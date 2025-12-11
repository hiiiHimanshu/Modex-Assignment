import { PoolClient } from "pg";
import { pool } from "../db/pool";
import { HttpError } from "../utils/httpError";

export type BookingStatus = "PENDING" | "CONFIRMED" | "FAILED";

export type BookingResult =
  | {
      bookingId: string;
      status: Extract<BookingStatus, "CONFIRMED">;
      showId: string;
      seatsConfirmed: number[];
    }
  | {
      bookingId: string | null;
      status: Extract<BookingStatus, "FAILED">;
      showId: string;
      failedSeats: number[];
      reason: string;
    };

const convertSeatsToUnique = (seats: number[]) => Array.from(new Set(seats));

const ensureSeatNumbersAreValid = (seats: number[], totalSeats: number) => {
  const invalidSeats = seats.filter(
    (seat) => seat < 1 || seat > totalSeats || Number.isNaN(seat)
  );
  if (invalidSeats.length > 0) {
    throw new HttpError(400, "Seat numbers are out of range", { invalidSeats });
  }
};

const insertSeats = async (
  client: PoolClient,
  bookingId: string,
  showId: string,
  seats: number[]
) => {
  const insertResult = await client.query(
    `
    WITH requested AS (
      SELECT unnest($3::int[]) AS seat_number
    ),
    inserted AS (
      INSERT INTO booking_seats (booking_id, show_id, seat_number)
      SELECT $1, $2, seat_number FROM requested
      ON CONFLICT DO NOTHING
      RETURNING seat_number
    )
    SELECT seat_number FROM inserted;
    `,
    [bookingId, showId, seats]
  );

  return insertResult.rows.map((r) => r.seat_number as number);
};

export const createBookingWithSeats = async ({
  showId,
  seats,
  userName,
}: {
  showId: string;
  seats: number[];
  userName?: string;
}): Promise<BookingResult> => {
  const uniqueSeats = convertSeatsToUnique(seats);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const showResult = await client.query(
      "SELECT id, total_seats FROM shows WHERE id = $1 FOR UPDATE",
      [showId]
    );

    if (showResult.rowCount === 0) {
      throw new HttpError(404, "Show not found");
    }

    const show = showResult.rows[0];
    ensureSeatNumbersAreValid(uniqueSeats, show.total_seats);

    const bookingResult = await client.query(
      "INSERT INTO bookings (show_id, seats_requested, status, user_name) VALUES ($1, $2, 'PENDING', $3) RETURNING id",
      [showId, uniqueSeats.length, userName ?? null]
    );
    const bookingId = bookingResult.rows[0].id as string;

    const insertedSeats = await insertSeats(
      client,
      bookingId,
      showId,
      uniqueSeats
    );

    const allSeatsReserved = insertedSeats.length === uniqueSeats.length;
    if (allSeatsReserved) {
      await client.query(
        "UPDATE bookings SET status = 'CONFIRMED', updated_at = now() WHERE id = $1",
        [bookingId]
      );
      await client.query("COMMIT");
      return {
        bookingId,
        status: "CONFIRMED",
        showId,
        seatsConfirmed: insertedSeats,
      };
    }

    const failedSeats = uniqueSeats.filter(
      (seat) => !insertedSeats.includes(seat)
    );

    // Clean up seats tied to this failed booking
    await client.query("DELETE FROM booking_seats WHERE booking_id = $1", [
      bookingId,
    ]);
    await client.query(
      "UPDATE bookings SET status = 'FAILED', updated_at = now() WHERE id = $1",
      [bookingId]
    );
    await client.query("COMMIT");

    return {
      bookingId,
      status: "FAILED",
      showId,
      failedSeats,
      reason: "Requested seats are no longer available",
    };
  } catch (err) {
    await client.query("ROLLBACK");
    if (err instanceof HttpError) {
      throw err;
    }
    throw new HttpError(500, "Unable to complete booking", err);
  } finally {
    client.release();
  }
};

export const expireStalePendingBookings = async (
  ageInMinutes = 2
): Promise<number> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `
      WITH expired AS (
        UPDATE bookings
        SET status = 'FAILED', updated_at = now()
        WHERE status = 'PENDING' AND created_at < now() - ($1 || ' minutes')::interval
        RETURNING id
      ), removed AS (
        DELETE FROM booking_seats bs
        USING expired e
        WHERE bs.booking_id = e.id
        RETURNING bs.booking_id
      )
      SELECT count(*) AS removed FROM expired;
    `,
      [ageInMinutes]
    );
    await client.query("COMMIT");
    return Number(result.rows[0]?.removed ?? 0);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const startBookingExpiryMonitor = () => {
  const interval = Number(process.env.BOOKING_EXPIRY_POLL_SECONDS ?? 30);
  setInterval(async () => {
    try {
      const expired = await expireStalePendingBookings();
      if (expired > 0) {
        console.log(`Expired ${expired} pending bookings`);
      }
    } catch (err) {
      console.error("Failed to expire pending bookings", err);
    }
  }, interval * 1000);
};
