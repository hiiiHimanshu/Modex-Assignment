import { Router } from "express";
import { pool } from "../db/pool";

const router = Router();

router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const bookingResult = await pool.query(
      `SELECT b.id, b.show_id, b.status, b.seats_requested, b.user_name, b.created_at, b.updated_at, s.name AS show_name, s.start_time
       FROM bookings b
       INNER JOIN shows s ON s.id = b.show_id
       WHERE b.id = $1`,
      [id]
    );

    if (bookingResult.rowCount === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const seatsResult = await pool.query(
      "SELECT seat_number FROM booking_seats WHERE booking_id = $1 ORDER BY seat_number ASC",
      [id]
    );

    return res.json({
      booking: {
        ...bookingResult.rows[0],
        seats: seatsResult.rows.map((r) => r.seat_number),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
