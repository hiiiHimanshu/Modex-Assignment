import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool";
import { createBookingWithSeats } from "../services/bookingService";

const router = Router();

const createShowSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  startTime: z.preprocess((val) => {
    if (typeof val === "string" || val instanceof Date) {
      return new Date(val);
    }
    return val;
  }, z.date()),
  totalSeats: z.preprocess((val) => Number(val), z.number().int().positive()),
});

const bookingSchema = z.object({
  userName: z.string().trim().min(1).optional(),
  seats: z
    .array(z.preprocess((val) => Number(val), z.number().int().positive()))
    .min(1, "At least one seat is required"),
});

router.post("/", async (req, res, next) => {
  const parsed = createShowSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  const { name, startTime, totalSeats } = parsed.data;

  try {
    const result = await pool.query(
      "INSERT INTO shows (name, start_time, total_seats) VALUES ($1, $2, $3) RETURNING *",
      [name, startTime, totalSeats]
    );
    return res.status(201).json({ show: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (_req, res, next) => {
  try {
    const result = await pool.query(
      `
      SELECT s.id, s.name, s.start_time, s.total_seats,
        COALESCE(rs.reserved, 0) AS reserved_seats
      FROM shows s
      LEFT JOIN (
        SELECT show_id, COUNT(*) AS reserved
        FROM booking_seats
        GROUP BY show_id
      ) rs ON rs.show_id = s.id
      ORDER BY s.start_time ASC;
    `
    );

    const shows = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      startTime: row.start_time,
      totalSeats: row.total_seats,
      reservedSeats: Number(row.reserved_seats),
      availableSeats: row.total_seats - Number(row.reserved_seats),
    }));

    return res.json({ shows });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  try {
    const showResult = await pool.query(
      "SELECT id, name, start_time, total_seats FROM shows WHERE id = $1",
      [id]
    );
    if (showResult.rowCount === 0) {
      return res.status(404).json({ error: "Show not found" });
    }

    const show = showResult.rows[0];
    const seatsResult = await pool.query(
      "SELECT seat_number FROM booking_seats WHERE show_id = $1 ORDER BY seat_number ASC",
      [id]
    );
    const reservedSeats = seatsResult.rows.map((r) => r.seat_number);
    const seatSet = new Set<number>(reservedSeats);
    const availableSeats: number[] = [];
    for (let i = 1; i <= show.total_seats; i += 1) {
      if (!seatSet.has(i)) {
        availableSeats.push(i);
      }
    }

    return res.json({
      show: {
        id: show.id,
        name: show.name,
        startTime: show.start_time,
        totalSeats: show.total_seats,
        reservedSeats,
        availableSeats,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/bookings", async (req, res, next) => {
  const { id: showId } = req.params;
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }

  try {
    const payload = {
      showId,
      seats: parsed.data.seats.map((s) => Number(s)),
      ...(parsed.data.userName ? { userName: parsed.data.userName } : {}),
    };

    const result = await createBookingWithSeats(payload);

    if (result.status === "CONFIRMED") {
      return res.status(201).json(result);
    }

    return res.status(409).json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
