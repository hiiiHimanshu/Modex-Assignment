import { BookingResult, ShowSummary, ShowWithSeats } from "../types";
import { request } from "./client";

export const fetchShows = async (): Promise<{ shows: ShowSummary[] }> =>
  request("/shows");

export const fetchShow = async (
  id: string
): Promise<{ show: ShowWithSeats }> => {
  const data = await request<{ show: any }>(`/shows/${id}`);
  const show = data.show;
  const reservedSeatNumbers =
    show.reservedSeats ?? show.reserved_seats ?? ([] as number[]);
  const availableSeatNumbers =
    show.availableSeats ?? show.available_seats ?? ([] as number[]);

  return {
    show: {
      id: show.id,
      name: show.name,
      startTime: show.startTime ?? show.start_time,
      totalSeats: show.totalSeats ?? show.total_seats,
      reservedSeats: Array.isArray(reservedSeatNumbers)
        ? reservedSeatNumbers.length
        : Number(reservedSeatNumbers ?? 0),
      availableSeats: Array.isArray(availableSeatNumbers)
        ? availableSeatNumbers.length
        : Number(availableSeatNumbers ?? 0),
      reservedSeatNumbers: Array.isArray(reservedSeatNumbers)
        ? reservedSeatNumbers
        : [],
      availableSeatNumbers: Array.isArray(availableSeatNumbers)
        ? availableSeatNumbers
        : [],
    },
  };
};

export const createShow = async (payload: {
  name: string;
  startTime: string;
  totalSeats: number;
}) => {
  const { show } = await request<{ show: ShowSummary }>("/shows", {
    method: "POST",
    json: payload,
  });
  return show;
};

export const bookSeats = async (
  showId: string,
  payload: { seats: number[]; userName?: string }
): Promise<BookingResult> => {
  try {
    return await request(`/shows/${showId}/bookings`, {
      method: "POST",
      json: payload,
    });
  } catch (err: unknown) {
    const apiErr = err as any;
    if (apiErr?.details?.status) {
      return apiErr.details as BookingResult;
    }
    throw err;
  }
};

export const fetchBooking = async (id: string) =>
  request(`/bookings/${id}`, { method: "GET" });
