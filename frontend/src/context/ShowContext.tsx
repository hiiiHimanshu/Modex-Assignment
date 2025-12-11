import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiError } from "../api/client";
import {
  bookSeats as bookSeatsApi,
  createShow as createShowApi,
  fetchShow,
  fetchShows,
} from "../api/shows";
import { BookingResult, ShowSummary, ShowWithSeats } from "../types";

type ShowContextValue = {
  shows: ShowSummary[];
  loading: boolean;
  error: string | null;
  bookingLoading: boolean;
  lastBooking: BookingResult | null;
  refreshShows: () => Promise<void>;
  createShow: (payload: {
    name: string;
    startTime: string;
    totalSeats: number;
  }) => Promise<void>;
  bookSeats: (
    showId: string,
    seats: number[],
    userName?: string
  ) => Promise<BookingResult>;
  fetchShowDetail: (id: string) => Promise<ShowWithSeats>;
  clearBooking: () => void;
};

const ShowContext = createContext<ShowContextValue | undefined>(undefined);

export const ShowProvider = ({ children }: { children: ReactNode }) => {
  const [shows, setShows] = useState<ShowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [lastBooking, setLastBooking] = useState<BookingResult | null>(null);

  const refreshShows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchShows();
      setShows(data.shows);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load shows");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshShows();
  }, [refreshShows]);

  const createShow = useCallback(
    async (payload: {
      name: string;
      startTime: string;
      totalSeats: number;
    }) => {
      await createShowApi(payload);
      await refreshShows();
    },
    [refreshShows]
  );

  const bookSeats = useCallback(
    async (showId: string, seats: number[], userName?: string) => {
      setBookingLoading(true);
      try {
        const result = await bookSeatsApi(showId, {
          seats,
          ...(userName ? { userName } : {}),
        });
        setLastBooking(result);
        await refreshShows();
        return result;
      } finally {
        setBookingLoading(false);
      }
    },
    [refreshShows]
  );

  const fetchShowDetail = useCallback(async (id: string) => {
    const { show } = await fetchShow(id);
    return show;
  }, []);

  const clearBooking = useCallback(() => setLastBooking(null), []);

  const value = useMemo(
    () => ({
      shows,
      loading,
      error,
      bookingLoading,
      lastBooking,
      refreshShows,
      createShow,
      bookSeats,
      fetchShowDetail,
      clearBooking,
    }),
    [
      shows,
      loading,
      error,
      bookingLoading,
      lastBooking,
      refreshShows,
      createShow,
      bookSeats,
      fetchShowDetail,
      clearBooking,
    ]
  );

  return <ShowContext.Provider value={value}>{children}</ShowContext.Provider>;
};

export const useShows = () => {
  const ctx = useContext(ShowContext);
  if (!ctx) {
    throw new Error("useShows must be used within ShowProvider");
  }
  return ctx;
};
