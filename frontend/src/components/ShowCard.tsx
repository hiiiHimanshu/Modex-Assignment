import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ShowSummary } from "../types";
import { formatDateTime } from "../utils/format";

type Props = {
  show: ShowSummary;
  actions?: ReactNode;
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const ShowCard = ({ show, actions }: Props) => {
  return (
    <motion.div
      className="card show-card"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, boxShadow: "0 20px 36px rgba(15,23,42,0.12)" }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      layout
    >
      <div className="card-top">
        <div>
          <p className="eyebrow">Departing</p>
          <h3 className="title">{show.name}</h3>
          <p className="meta">{formatDateTime(show.startTime)}</p>
        </div>
        <div className="seats">
          <div className="seat-count">
            <span className="label">Available</span>
            <strong>{show.availableSeats}</strong>
          </div>
          <div className="seat-count muted">
            <span className="label">Reserved</span>
            <strong>{show.reservedSeats}</strong>
          </div>
          <div className="seat-count muted">
            <span className="label">Total</span>
            <strong>{show.totalSeats}</strong>
          </div>
        </div>
      </div>
      {actions ? <div className="card-actions">{actions}</div> : null}
    </motion.div>
  );
};
