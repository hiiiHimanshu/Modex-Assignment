# Ticket Booking System – Design Notes

## High-level architecture
- **API layer (Express/Node)** – stateless; handles validation, rate limits, and dispatches DB writes inside transactions. Horizontally scalable behind a load balancer.
- **Postgres** – source of truth for shows, bookings, and seat reservations. Uses row-level constraints plus explicit transactions for atomic seat locking.
- **Background worker** – lightweight interval (or Cron/worker pod) to expire stale `PENDING` bookings after 2 minutes and release seats.
- **Frontend (React)** – consumes APIs, caches show lists in Context to avoid redundant fetches, and renders live seat maps.

## Data model
- `shows` – `id`, `name`, `start_time`, `total_seats`.
- `bookings` – `id`, `show_id`, `seats_requested`, `status (PENDING|CONFIRMED|FAILED)`, `user_name`, timestamps.
- `booking_seats` – `id`, `booking_id`, `show_id`, `seat_number`, `created_at`, **unique (show_id, seat_number)**.

Rationale: splitting `booking_seats` makes each seat independently lockable with a uniqueness constraint while keeping booking metadata lightweight.

## Concurrency + atomicity
1. Fetch show with `SELECT ... FOR UPDATE` to validate seat ranges.
2. Insert a `PENDING` booking row.
3. Insert requested seats via `INSERT ... ON CONFLICT DO NOTHING RETURNING seat_number`.
4. If every seat inserted → set booking `CONFIRMED`; otherwise delete inserted seats and mark `FAILED`.

Because the seat uniqueness constraint lives in Postgres and the entire flow runs inside a single transaction, simultaneous bookings cannot over-allocate the same seat.

## Scaling plan
- **Stateless API**: run multiple API pods behind a load balancer; keep sticky sessions off.
- **Database**:
  - Start with one primary + read replicas for `GET /shows` traffic; writers hit primary.
  - Add **partitioning by show_id** for `booking_seats` and `bookings` once seat volume grows.
  - Shard by geographic region or route-id hash if writes saturate a single primary; each shard maintains its own uniqueness constraints.
  - Use **connection pooling** (pgBouncer) to cap DB connections per app pod.
- **Caching**:
  - Cache show lists and seat counts in Redis with short TTL (e.g., 5–15s) since writes happen via API only.
  - Invalidate per `show_id` after successful booking/creation.
- **Message queues**:
  - Push booking lifecycle events (confirmed/failed) onto a queue (Kafka/SQS) for downstream systems (notifications, analytics, payment capture) without blocking the booking response.
  - A worker consumes and handles retries or dead-lettering.
- **Booking expiry**: cron/worker scans for `PENDING` bookings older than 2 minutes, marks them `FAILED`, and deletes held seats. For higher scale, schedule per-shard jobs or use a delayed queue (e.g., Redis streams with delayed tasks).

## Availability and observability
- Health checks on `/health`, plus liveness/readiness probes in orchestration.
- Metrics: track booking latency, conflict rate, seats/sec, DB contention (lock waits), and queue lag.
- Logging: structured request logs with booking_id/show_id correlation.
- Alerts: high conflict rates, migration failures, or expiry job lag.

## Failure modes
- **DB primary failover**: drivers reconnect; read replicas serve read-only endpoints while primary is promoted.
- **Hot show with heavy demand**: partition `booking_seats` by `show_id`, scale writer replicas horizontally, and pre-warm caches.
- **Queue backpressure**: bookings still commit because the queue publish can be fire-and-forget with a retry buffer; dead-letter for later replay.

## Extensibility
- Add auth/roles, payments, refunds, and notifications without touching the seat locking path.
- Support different layouts (rows/columns) by storing seat metadata instead of numeric indices, keeping the uniqueness constraint on `(show_id, seat_identifier)`.
