import { useEffect, useRef } from "react";
import type { Seat } from "../types";

interface KeyboardNavigatorProps {
  seats: Seat[];
  focusedSeatId?: string | null;
  onFocusSeat: (id: string) => void;
  onActivateSeat: (id: string) => void;
}

export default function KeyboardNavigator({
  seats,
  focusedSeatId,
  onFocusSeat,
  onActivateSeat,
}: KeyboardNavigatorProps) {
  const currentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (focusedSeatId) {
      currentIdRef.current = focusedSeatId;
    }
  }, [focusedSeatId]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (seats.length === 0) return;

      // find current seat
      const curId = currentIdRef.current ?? seats[0].id;
      const cur = seats.find(s => s.id === curId) ?? seats[0];

      const sameSectionSeats =
        cur.sectionId == null
          ? seats
          : seats.filter((s) => s.sectionId === cur.sectionId);
      const sameRowSeats =
        cur.rowIndex == null
          ? sameSectionSeats
          : sameSectionSeats.filter((s) => s.rowIndex === cur.rowIndex);

      const fallbackSectionSeats = sameSectionSeats.length > 0 ? sameSectionSeats : seats;
      const fallbackRowSeats = sameRowSeats.length > 0 ? sameRowSeats : fallbackSectionSeats;

      function pickCandidate(
        source: Seat[],
        filterFn: (s: Seat) => boolean,
        sortFn: (a: Seat, b: Seat) => number,
      ) {
        const candidates = source.filter((s) => s.id !== cur.id && filterFn(s));
        if (candidates.length === 0) return null;
        candidates.sort(sortFn);
        return candidates[0];
      }

      let picked: Seat | null = null;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          picked = pickCandidate(
            fallbackSectionSeats,
            (s) => s.y < cur.y,
            (a, b) => {
              const dyA = cur.y - a.y;
              const dyB = cur.y - b.y;
              if (dyA !== dyB) return dyA - dyB; // prefer closest vertically
              return Math.abs(cur.x - a.x) - Math.abs(cur.x - b.x);
            }
          );
          break;
        case "ArrowDown":
          e.preventDefault();
          picked = pickCandidate(
            fallbackSectionSeats,
            (s) => s.y > cur.y,
            (a, b) => {
              const dyA = a.y - cur.y;
              const dyB = b.y - cur.y;
              if (dyA !== dyB) return dyA - dyB;
              return Math.abs(cur.x - a.x) - Math.abs(cur.x - b.x);
            }
          );
          break;
        case "ArrowLeft":
          e.preventDefault();
          picked = pickCandidate(
            fallbackRowSeats,
            (s) => s.x < cur.x,
            (a, b) => {
              const dxA = cur.x - a.x;
              const dxB = cur.x - b.x;
              if (dxA !== dxB) return dxA - dxB;
              return Math.abs(cur.y - a.y) - Math.abs(cur.y - b.y);
            }
          );
          break;
        case "ArrowRight":
          e.preventDefault();
          picked = pickCandidate(
            fallbackRowSeats,
            (s) => s.x > cur.x,
            (a, b) => {
              const dxA = a.x - cur.x;
              const dxB = b.x - cur.x;
              if (dxA !== dxB) return dxA - dxB;
              return Math.abs(cur.y - a.y) - Math.abs(cur.y - b.y);
            }
          );
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          onActivateSeat(cur.id);
          return;
        case "Home":
          e.preventDefault();
          picked = fallbackSectionSeats
            .slice()
            .sort((a, b) => (a.y - b.y) || (a.x - b.x))[0];
          break;
        case "End":
          e.preventDefault();
          picked = fallbackSectionSeats
            .slice()
            .sort((a, b) => (b.y - a.y) || (b.x - a.x))[0];
          break;
        default:
          return;
      }

      if (picked) {
        currentIdRef.current = picked.id;
        onFocusSeat(picked.id);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [seats, onFocusSeat, onActivateSeat]);

  return (
    <div className="keyboard-nav" role="region" aria-label="Keyboard navigation guide">
      <h4>Keyboard Navigation</h4>
      <ul>
        <li>
          <span>↑ ↓ ← →</span>
          <span>Navigate seats</span>
        </li>
        <li>
          <span className="key-label">Enter</span> or <span className="key-label">Space</span>
          <span>Select seat</span>
        </li>
        <li>
          <span className="key-label">Home</span> / <span className="key-label">End</span>
          <span>First/Last seat</span>
        </li>
      </ul>
    </div>
  );
}
