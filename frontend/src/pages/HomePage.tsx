import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShowCard } from "../components/ShowCard";
import { useShows } from "../context/ShowContext";

const heroVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const HomePage = () => {
  const { shows, loading, error, refreshShows } = useShows();

  return (
    <div className="page">
      <motion.section
        className="hero"
        variants={heroVariant}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div layout>
          <p className="eyebrow">Reliable seat holds</p>
          <h1>Book buses, shows, or doctor slots without overbooking</h1>
          <p className="lede">
            Seats are locked atomically in Postgres. Pick a route, choose your
            seats, and get an instant confirmation.
          </p>
          <div className="hero-actions">
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link className="button primary" to="/admin">
                Go to Admin
              </Link>
            </motion.div>
            <motion.button
              className="button ghost"
              onClick={refreshShows}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Refresh availability
            </motion.button>
          </div>
        </motion.div>
        <motion.div
          className="hero-card"
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
        >
          <div className="stat">
            <span>Live trips</span>
            <strong>{shows.length}</strong>
          </div>
          <div className="stat">
            <span>Instant booking</span>
            <strong>Under 2s</strong>
          </div>
        </motion.div>
      </motion.section>

      <section className="section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Available trips</p>
            <h2>Choose a show or bus</h2>
          </div>
        </div>
        {loading ? (
          <div className="surface muted">Loading trips...</div>
        ) : error ? (
          <div className="surface error">{error}</div>
        ) : shows.length === 0 ? (
          <div className="surface muted">No shows yet. Ask an admin to add.</div>
        ) : (
          <motion.div
            className="grid"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.05, delayChildren: 0.05 },
              },
            }}
          >
            {shows.map((show) => (
              <ShowCard
                key={show.id}
                show={show}
                actions={
                  <Link className="button secondary" to={`/booking/${show.id}`}>
                    Select seats
                  </Link>
                }
              />
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
};
