import type { Seat } from "../types";
import { getPriceForTier, formatCurrency } from "../utils/pricing";

interface SummaryBarProps {
  selectedSeats: Seat[];
  clear: () => void;
  limit: number;
}

export default function SummaryBar({ selectedSeats, clear, limit }: SummaryBarProps) {
  const subtotal = selectedSeats.reduce(
    (sum, seat) => sum + getPriceForTier(seat.priceTier),
    0
  );

  return (
    <div className="summary-bar">
      <h3>Selection Summary</h3>
      <div className="summary-info">
        <span className="label">Selected:</span>
        <span className="value">{selectedSeats.length} / {limit}</span>
      </div>
      <div className="summary-info">
        <span className="label">Subtotal:</span>
        <span className="value">{formatCurrency(subtotal)}</span>
      </div>

      {selectedSeats.length > 0 && (
        <>
          <h4 style={{ marginTop: "0.5rem", marginBottom: "0.25rem" }}>
            Selected Seats
          </h4>
          <ul className="seat-list">
            {selectedSeats.map((seat) => (
              <li key={seat.id}>
                <span className="seat-id">{seat.id}</span>
                <span className="seat-price">
                  {formatCurrency(getPriceForTier(seat.priceTier))}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <button
        className="clear-btn"
        onClick={clear}
        disabled={selectedSeats.length === 0}
        aria-label="Clear all selected seats"
      >
        Clear Selection
      </button>
    </div>
  );
}
