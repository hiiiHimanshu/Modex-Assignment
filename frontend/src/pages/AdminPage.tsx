import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShowCard } from "../components/ShowCard";
import { useShows } from "../context/ShowContext";

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const AdminPage = () => {
  const { shows, createShow, loading, error } = useShows();
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [totalSeats, setTotalSeats] = useState(40);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const soonestStart = useMemo(() => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + 15);
    return date.toISOString().slice(0, 16);
  }, []);

  const handleSubmit = async (evt: FormEvent) => {
    evt.preventDefault();
    setFormError(null);
    setMessage(null);
    if (!name.trim()) {
      setFormError("Name is required");
      return;
    }
    if (!startTime) {
      setFormError("Start time is required");
      return;
    }
    if (totalSeats < 1) {
      setFormError("Total seats must be at least 1");
      return;
    }

    try {
      setSubmitting(true);
      await createShow({
        name,
        startTime: new Date(startTime).toISOString(),
        totalSeats,
      });
      setName("");
      setStartTime("");
      setTotalSeats(40);
      setMessage("Show created successfully");
    } catch (err) {
      setFormError("Unable to create show. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <motion.section
        className="section"
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="section-header">
          <div>
            <p className="eyebrow">Admin</p>
            <h2>Create a new show/trip</h2>
            <p className="lede">
              Keep inputs sane—future bookings rely on accurate start times and
              seat counts.
            </p>
          </div>
        </div>
        <motion.form
          className="card form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <label className="field">
            <span>Show / Bus / Doctor name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dawn Express"
            />
          </label>
          <label className="field">
            <span>Start time</span>
            <input
              type="datetime-local"
              value={startTime}
              min={soonestStart}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </label>
          <label className="field inline">
            <span>Total seats</span>
            <input
              type="number"
              min={1}
              value={totalSeats}
              onChange={(e) => setTotalSeats(Number(e.target.value))}
            />
          </label>
          {formError ? <div className="surface error">{formError}</div> : null}
          {message ? <div className="surface success">{message}</div> : null}
          <motion.button
            className="button primary"
            disabled={submitting}
            type="submit"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            {submitting ? "Saving..." : "Create show"}
          </motion.button>
        </motion.form>
      </motion.section>

      <section className="section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Current shows</p>
            <h2>Live schedule</h2>
          </div>
          <Link className="button ghost" to="/">
            View as user
          </Link>
        </div>
        {loading ? (
          <div className="surface muted">Loading shows...</div>
        ) : error ? (
          <div className="surface error">{error}</div>
        ) : shows.length === 0 ? (
          <div className="surface muted">No entries yet.</div>
        ) : (
          <motion.div
            className="grid"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.05, delayChildren: 0.02 },
              },
            }}
          >
            {shows.map((show) => (
              <ShowCard
                key={show.id}
                show={show}
                actions={
                  <div className="card-actions-row">
                    <span className="label">
                      {show.availableSeats} seats open
                    </span>
                    <Link to={`/booking/${show.id}`} className="button secondary">
                      Open booking
                    </Link>
                  </div>
                }
              />
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
};
