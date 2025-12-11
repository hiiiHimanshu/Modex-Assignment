import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

export const pool =
  connectionString != null && connectionString.length > 0
    ? new Pool({
        connectionString,
        max: Number(process.env.DB_POOL_SIZE ?? 10),
      })
    : new Pool({
        host: process.env.DB_HOST ?? "localhost",
        port: Number(process.env.DB_PORT ?? 5432),
        database: process.env.DB_NAME ?? "ticketing",
        user: process.env.DB_USER ?? "postgres",
        password: process.env.DB_PASSWORD ?? "postgres",
        max: Number(process.env.DB_POOL_SIZE ?? 10),
      });

pool.on("error", (err) => {
  console.error("Unexpected Postgres error", err);
});
