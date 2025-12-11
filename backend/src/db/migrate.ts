import { pool } from "./pool";

const schema = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  total_seats INTEGER NOT NULL CHECK (total_seats > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  seats_requested INTEGER NOT NULL CHECK (seats_requested > 0),
  status TEXT NOT NULL CHECK (status IN ('PENDING','CONFIRMED','FAILED')),
  user_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS booking_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  show_id uuid NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  seat_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(show_id, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_bookings_show_id ON bookings(show_id);
CREATE INDEX IF NOT EXISTS idx_booking_seats_show_id ON booking_seats(show_id);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Running migrations...");
    await client.query(schema);
    console.log("Migrations complete.");
  } catch (err) {
    console.error("Migration failed", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
