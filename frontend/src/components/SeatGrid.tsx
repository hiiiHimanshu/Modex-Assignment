import { motion } from "framer-motion";

type SeatGridProps = {
  totalSeats: number;
  reserved: number[];
  selected: number[];
  onToggle: (seat: number) => void;
};

const seatVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export const SeatGrid = ({
  totalSeats,
  reserved,
  selected,
  onToggle,
}: SeatGridProps) => {
  const seatNumbers = Array.from({ length: totalSeats }, (_, i) => i + 1);
  const reservedSet = new Set(reserved);
  const selectedSet = new Set(selected);
  const columns = Math.min(8, Math.max(4, Math.ceil(totalSeats / 5)));

  return (
    <div
      className="seat-grid"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(48px, 1fr))` }}
    >
      {seatNumbers.map((seat) => {
        const isReserved = reservedSet.has(seat);
        const isSelected = selectedSet.has(seat);
        return (
          <motion.button
            key={seat}
            className={`seat ${isReserved ? "reserved" : ""} ${
              isSelected ? "selected" : ""
            }`}
            disabled={isReserved}
            onClick={() => onToggle(seat)}
            aria-pressed={isSelected}
            aria-label={`Seat ${seat} ${
              isReserved ? "unavailable" : "available"
            }`}
            variants={seatVariants}
            initial="hidden"
            animate="visible"
            whileTap={!isReserved ? { scale: 0.95 } : undefined}
            transition={{ duration: 0.15 }}
            layout
          >
            {seat}
          </motion.button>
        );
      })}
    </div>
  );
};
