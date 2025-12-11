import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { SeatGrid } from "../components/SeatGrid";
import { useAuth } from "../context/AuthContext";
import { useShows } from "../context/ShowContext";
import type { BookingResult, ShowWithSeats } from "../types";
import { formatDateTime } from "../utils/format";
import { ApiError } from "../api/client";

export const BookingPage = () => {
  const { id } = useParams<{ id: string }>();
  const { name, setName } = useAuth();
  const {
    fetchShowDetail,
    bookSeats,
    bookingLoading,
    lastBooking,
    clearBooking,
  } = useShows();

  const [show, setShow] = useState<ShowWithSeats | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<BookingResult | null>(null);

  const loadShow = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const detail = await fetchShowDetail(id);
      setShow({
        ...detail,
        reservedSeatNumbers: detail.reservedSeatNumbers ?? detail.reservedSeats,
        availableSeatNumbers:
          detail.availableSeatNumbers ?? detail.availableSeats,
      });
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to load show details."
      );
    } finally {
      setLoading(false);
    }
  }, [fetchShowDetail, id]);

  useEffect(() => {
    loadShow();
    setSelectedSeats([]);
    clearBooking();
  }, [id, loadShow, clearBooking]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadShow();
    }, 12000);
    return () => clearInterval(timer);
  }, [loadShow]);

  useEffect(() => {
    if (lastBooking) {
      setStatus(lastBooking);
    }
  }, [lastBooking]);

  const toggleSeat = (seat: number) => {
    setSelectedSeats((prev) =>
      prev.includes(seat)
        ? prev.filter((s) => s !== seat)
        : [...prev, seat].sort((a, b) => a - b)
    );
  };

  const handleBooking = async () => {
    if (!show || !id) return;
    if (selectedSeats.length === 0) {
      setError("Select at least one seat");
      return;
    }
    setError(null);
    try {
      const result = await bookSeats(id, selectedSeats, name);
      setStatus(result);
      setSelectedSeats([]);
      await loadShow();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Booking failed. Please try again."
      );
    }
  };

  if (!id) {
    return <div className="surface error">No show selected.</div>;
  }

  return (
    <div className="page">
      {loading ? (
        <div className="surface muted">Loading show...</div>
      ) : error ? (
        <div className="surface error">{error}</div>
      ) : show ? (
        <>
          <section className="section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Booking</p>
                <h2>{show.name}</h2>
                <p className="meta">
                  {formatDateTime(show.startTime)} · {show.availableSeats} seats
                  left
                </p>
              </div>
              <div className="surface inline">
                <div className="legend">
                  <span className="pill mini filled"></span>
                  <small>Reserved</small>
                </div>
                <div className="legend">
                  <span className="pill mini outline"></span>
                  <small>Available</small>
                </div>
                <div className="legend">
                  <span className="pill mini accent"></span>
                  <small>Selected</small>
                </div>
              </div>
            </div>

            <div className="booking-layout">
              <motion.div
                className="card wide"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <div className="field inline">
                  <span>Your name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Who is booking?"
                  />
                </div>
                <SeatGrid
                  totalSeats={show.totalSeats}
                  reserved={show.reservedSeatNumbers}
                  selected={selectedSeats}
                  onToggle={toggleSeat}
                />
                <div className="booking-actions">
                  <div className="surface muted inline">
                    <span>{selectedSeats.length} seat(s) selected</span>
                  </div>
                  <motion.button
                    className="button primary"
                    onClick={handleBooking}
                    disabled={bookingLoading}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {bookingLoading ? "Locking seats..." : "Confirm booking"}
                  </motion.button>
                </div>
                {error ? <div className="surface error">{error}</div> : null}
              </motion.div>

              <motion.div
                className="card status"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.35 }}
              >
                <p className="eyebrow">Status</p>
                <AnimatePresence mode="popLayout">
                  {status ? (
                    <motion.div
                      key={status.bookingId ?? status.status}
                      className={`status-block ${status.status.toLowerCase()}`}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="status-row">
                        <span className="badge">{status.status}</span>
                        <span className="tiny">
                          Booking {status.bookingId ?? "n/a"}
                        </span>
                      </div>
                      {status.status === "CONFIRMED" ? (
                        <div>
                          <p>Seats locked:</p>
                          <strong>{status.seatsConfirmed.join(", ")}</strong>
                        </div>
                      ) : (
                        <div>
                          <p>Unavailable seats:</p>
                          <strong>{status.failedSeats.join(", ")}</strong>
                          <p className="meta">{status.reason}</p>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      className="surface muted"
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 1 }}
                    >
                      Select seats and confirm to see booking status.
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
};
