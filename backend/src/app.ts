import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import bookingsRouter from "./routes/bookings";
import showsRouter from "./routes/shows";
import { HttpError } from "./utils/httpError";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/shows", showsRouter);
app.use("/bookings", bookingsRouter);

// Centralized error handler
app.use(
  (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
  ) => {
    const status = err instanceof HttpError ? err.status : 500;
    const payload =
      err instanceof HttpError
        ? { error: err.message, details: err.details }
        : { error: "Internal Server Error" };

    if (status === 500) {
      console.error(err);
    }

    res.status(status).json(payload);
  }
);

export default app;
