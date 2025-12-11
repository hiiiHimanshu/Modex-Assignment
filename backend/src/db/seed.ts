import { pool } from "./pool";

type SeedShow = {
  name: string;
  startOffsetMinutes: number;
  totalSeats: number;
};

const seedShows: SeedShow[] = [
  { name: "City Express", startOffsetMinutes: 30, totalSeats: 40 },
  { name: "Mountain Line", startOffsetMinutes: 90, totalSeats: 32 },
  { name: "Evening Shuttle", startOffsetMinutes: 240, totalSeats: 24 },
];

async function seed() {
  const client = await pool.connect();
  try {
    for (const show of seedShows) {
      const startTime = new Date(
        Date.now() + show.startOffsetMinutes * 60 * 1000
      );
      await client.query(
        `
        INSERT INTO shows (name, start_time, total_seats)
        SELECT $1, $2, $3
        WHERE NOT EXISTS (
          SELECT 1 FROM shows WHERE name = $1 AND start_time = $2
        );
      `,
        [show.name, startTime, show.totalSeats]
      );
    }
    console.log("Seed complete");
  } catch (err) {
    console.error("Seed failed", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
