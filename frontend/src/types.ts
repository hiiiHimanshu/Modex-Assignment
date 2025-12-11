export type BookingStatus = "PENDING" | "CONFIRMED" | "FAILED";

export type ShowSummary = {
  id: string;
  name: string;
  startTime: string;
  totalSeats: number;
  reservedSeats: number;
  availableSeats: number;
};

export type ShowWithSeats = ShowSummary & {
  reservedSeatNumbers: number[];
  availableSeatNumbers: number[];
};

export type BookingResult =
  | {
      status: Extract<BookingStatus, "CONFIRMED">;
      bookingId: string;
      showId: string;
      seatsConfirmed: number[];
    }
  | {
      status: Extract<BookingStatus, "FAILED">;
      bookingId: string | null;
      showId: string;
      failedSeats: number[];
      reason: string;
    };
