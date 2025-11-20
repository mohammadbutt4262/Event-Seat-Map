import { useEffect, useMemo, useRef, useState } from "react";
import { loadVenue, flattenSeats } from "./utils/venueLoader";
import type { Seat, Venue } from "./types";
import SeatCanvas from "./components/SeatCanvas";
import type { SeatCanvasHandle } from "./components/SeatCanvas";
import { useSelection } from "./hooks/useSelection";
import KeyboardNavigator from "./components/KeyboardNavigator";
import SummaryBar from "./components/SummaryBar";
import SeatDetails from "./components/SeatDetails";

export default function App() {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const canvasRef = useRef<SeatCanvasHandle | null>(null);
  const { selectedIds, toggle, clear, limit } = useSelection(8);
  const [focused, setFocused] = useState<string | null>(null);

  useEffect(() => {
    loadVenue().then(v => { setVenue(v); setSeats(flattenSeats(v)); });
  }, []);

  const seatById = useMemo(() => {
    const map = new Map<string, Seat>();
    for (const seat of seats) {
      map.set(seat.id, seat);
    }
    return map;
  }, [seats]);

  const selectedSeats = useMemo(
    () =>
      selectedIds
        .map((id) => seatById.get(id))
        .filter((seat): seat is Seat => Boolean(seat)),
    [selectedIds, seatById],
  );

  const focusedSeat = focused ? seatById.get(focused) : undefined;

  // seatIds intentionally omitted; KeyboardNavigator uses spatial `seats` prop now

  function onSeatClick(seat: Seat) {
    setFocused(seat.id); // always show details on click
    if (seat.status === "available") {
      toggle(seat.id); // only toggle selection for available seats
    }
  }

  return (
    <div className="app">
      <h1>{venue?.name ?? "Loading..."}</h1>

      <div className="map-and-aside">
        <div className="map-wrapper" role="application" aria-label="Seating map area">
          {venue && (
            <SeatCanvas
              ref={canvasRef}
              seats={seats}
              venueWidth={venue.map.width}
              venueHeight={venue.map.height}
              selectedSeatIds={selectedIds}
              onSeatClick={onSeatClick}
              focusedId={focused}
            />
          )}
        </div>

        <aside>
          <SeatDetails seat={focusedSeat} />
          <KeyboardNavigator
            seats={seats}
            focusedSeatId={focused}
            onFocusSeat={(id)=>{ setFocused(id); canvasRef.current?.focusSeat(); }}
            onActivateSeat={(id)=>{ const s=seatById.get(id); if (s) onSeatClick(s); }}
          />
          <SummaryBar selectedSeats={selectedSeats} clear={clear} limit={limit} />
        </aside>
      </div>
    </div>
  );
}
