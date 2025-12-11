import dotenv from "dotenv";
import app from "./app";
import { startBookingExpiryMonitor } from "./services/bookingService";

dotenv.config();

// Only start server if not in serverless environment (Vercel)
if (process.env.VERCEL !== "1" && !process.env.VERCEL_ENV) {
  const port = Number(process.env.PORT ?? 4000);

  app.listen(port, () => {
    console.log(`Ticket booking API running on http://localhost:${port}`);
  });

  // Only start expiry monitor in non-serverless environments
  startBookingExpiryMonitor();
}

export default app;
