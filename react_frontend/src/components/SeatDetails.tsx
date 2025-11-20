import type { Seat } from "../types";
import { getPriceForTier, formatCurrency } from "../utils/pricing";

interface SeatDetailsProps {
  seat?: Seat;
}

export default function SeatDetails({ seat }: SeatDetailsProps) {
  if (!seat) {
    return (
      <div className="seat-details">
        <h3>Seat Details</h3>
        <div className="no-selection">Select a seat for details</div>
      </div>
    );
  }

  const price = getPriceForTier(seat.priceTier);

  return (
    <div className="seat-details">
      <h3>Seat Details</h3>
      <p>
        <span className="label">Section:</span>
        <span className="value">{seat.sectionId || "N/A"}</span>
      </p>
      <p>
        <span className="label">Row:</span>
        <span className="value">{seat.rowIndex || "N/A"}</span>
      </p>
      <p>
        <span className="label">Seat ID:</span>
        <span className="value">{seat.id}</span>
      </p>
      <p>
        <span className="label">Col:</span>
        <span className="value">{seat.col}</span>
      </p>
      <p>
        <span className="label">Price:</span>
        <span className="value">{formatCurrency(price)}</span>
      </p>
      <p>
        <span className="label">Status:</span>
        <span className="value">
          <span className={`status-badge ${seat.status}`}>{seat.status}</span>
        </span>
      </p>
      <p>
        <span className="label">Price Tier:</span>
        <span className="value">
          <span className="status-badge price-tier">Tier {seat.priceTier}</span>
        </span>
      </p>
    </div>
  );
}
