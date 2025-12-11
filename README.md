# Ticket Booking System (Backend + Frontend)

Full-stack seat-booking demo that prevents overbooking with Postgres row-level guarantees. Built with **Node/Express/Postgres** and a **React + TypeScript** frontend.

## Quick start

Prereqs: Node 18+, npm, and Postgres (or Docker).

```bash
# 1) Start Postgres (or point DATABASE_URL to your instance)
docker compose up -d db

# 2) Backend
cd backend
cp .env.example .env           # adjust DATABASE_URL if needed
npm install
npm run db:migrate
npm run db:seed                # optional sample data
npm run dev                    # runs on http://localhost:4000

# 3) Frontend
cd ../frontend
cp .env.example .env           # set VITE_API_BASE_URL if backend differs
npm install
npm run dev                    # open the printed Vite URL
```

## API (backend)

Base URL: `http://localhost:4000`

- `GET /health` – service check.
- `POST /shows` – create a show/trip. Body: `{ "name": "City Express", "startTime": "2024-12-12T15:00:00Z", "totalSeats": 40 }`
- `GET /shows` – list shows with available/reserved counts.
- `GET /shows/:id` – show detail + seat map (`reservedSeats` and `availableSeats` arrays).
- `POST /shows/:id/bookings` – book seats atomically. Body: `{ "seats": [1,2,3], "userName": "Maya" }`. Returns `CONFIRMED` or `FAILED` with conflicting seats.
- `GET /bookings/:id` – booking status/history.

Postman collection: `docs/api.postman_collection.json`.

## Concurrency + expiry

- Seat reservations live in `booking_seats` with a **unique (show_id, seat_number)** constraint.
- Booking flow happens in a single transaction:
  1) `SELECT ... FOR UPDATE` the show to validate seat range.
  2) Create a `PENDING` booking row.
  3) `INSERT ... ON CONFLICT DO NOTHING` for each seat; if any miss, the booking is marked `FAILED` and inserts are rolled back.
  4) Otherwise update to `CONFIRMED`.
- A lightweight interval task marks any `PENDING` bookings older than 2 minutes as `FAILED` and frees seats.

## Frontend (React + TS)

- Routes: `/` (user list), `/booking/:id` (seat selection), `/admin` (create + view shows).
- Context API manages mock auth (role + name) and shared show/booking state; requests reuse cached show lists to avoid extra fetches.
- Seat grid highlights availability and selection before confirmation; booking status panel shows `PENDING/CONFIRMED/FAILED`.

## Design docs

- Scaling/design notes live in `docs/system-design.md` (architecture, DB sharding/replication approaches, locking strategy, caching, queues).

## Scripts

Backend:
- `npm run db:migrate` – create tables.
- `npm run db:seed` – add sample shows.
- `npm run dev` / `npm run start` / `npm run build`.

Frontend:
- `npm run dev` / `npm run build`.
- UI polish uses Framer Motion for page/seat/status transitions.

## Assumptions

- Seat numbers start at 1 and run sequentially to `totalSeats`.
- Bookings are either fully confirmed or fully failed (no partial success).
- API is intentionally minimal—add auth, payments, and observability for production. 
