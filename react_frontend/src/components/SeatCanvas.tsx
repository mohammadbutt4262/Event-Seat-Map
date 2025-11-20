import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import type { Seat } from "../types";
import { buildGrid } from "../utils/spatialHash";

const SEAT_VIEWBOX = 24;
const SEAT_SIZE = 22; // rendered size in CSS pixels
const SEAT_OUTLINE_WIDTH = 2.5;

type Props = {
  seats: Seat[];
  venueWidth: number;
  venueHeight: number;
  selectedSeatIds: string[];
  onSeatClick: (seat: Seat) => void;
  focusedId?: string | null;
};

export type SeatCanvasHandle = { focusSeat: () => void };

const SeatCanvas = forwardRef<SeatCanvasHandle, Props>(({
  seats,
  venueWidth,
  venueHeight,
  selectedSeatIds,
  onSeatClick,
  focusedId,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef(buildGrid(seats, 64));
  const seatPath = useMemo(
    () => new Path2D("M7 9c0-1.657 1.343-3 3-3h4c1.657 0 3 1.343 3 3v3h2v6h-2v3h-4v-3h-4v3H7v-3H5v-6h2V9z"),
    [],
  );
  const seatBasePath = useMemo(() => {
    const path = new Path2D();
    path.roundRect(5, 16, 14, 3.5, 1.5);
    return path;
  }, []);
  const seatHighlightPath = useMemo(() => {
    const path = new Path2D();
    path.ellipse(12, 8.5, 7, 3, 0, 0, Math.PI * 2);
    return path;
  }, []);
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const seatScale = SEAT_SIZE / SEAT_VIEWBOX;

  // update grid when seats change
  useEffect(() => { gridRef.current = buildGrid(seats, 64); }, [seats]);

  const selectedSet = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds]);
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, venueWidth, venueHeight);

    for (const seat of seats) {
      const isSelected = selectedSet.has(seat.id);
      const isFocused = focusedId === seat.id;
      const color = statusColor(seat.status);

      ctx.save();
      ctx.translate(seat.x, seat.y);
      ctx.scale(seatScale, seatScale);
      ctx.translate(-SEAT_VIEWBOX / 2, -SEAT_VIEWBOX / 2);

      // subtle drop shadow for depth
      ctx.shadowColor = "rgba(15, 23, 42, 0.25)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = color;
      ctx.fill(seatPath);

      ctx.shadowColor = "transparent";
      ctx.fillStyle = shadeColor(color, -12);
      ctx.fill(seatBasePath);

      // glossy highlight
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = "white";
      ctx.fill(seatHighlightPath);
      ctx.globalAlpha = 1;

      // base outline
      ctx.lineWidth = SEAT_OUTLINE_WIDTH / seatScale;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.stroke(seatPath);

      if (isSelected || isFocused) {
        ctx.lineWidth = (SEAT_OUTLINE_WIDTH + 1.5) / seatScale;
        ctx.strokeStyle = isSelected ? "#FFD700" : "#0047FF";
        ctx.shadowColor = isSelected ? "rgba(255,215,0,0.45)" : "rgba(0,71,255,0.45)";
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 0;
        ctx.stroke(seatPath);
      }

      ctx.restore();
    }

    ctx.restore();
  }, [dpr, focusedId, seats, seatBasePath, seatHighlightPath, seatScale, seatPath, selectedSet, venueWidth, venueHeight]);

  // resize handler (container responsive)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = Math.max(1, Math.floor(venueWidth * dpr));
    canvas.height = Math.max(1, Math.floor(venueHeight * dpr));
    canvas.style.width = `${venueWidth}px`;
    canvas.style.height = `${venueHeight}px`;

    drawFrame();
  }, [dpr, drawFrame, venueHeight, venueWidth]);

  useEffect(() => {
    drawFrame();
  }, [drawFrame]);

  function onPointerDown(e: React.PointerEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    if (document.activeElement !== canvas) {
      canvas.focus();
    }

    const normalizedX = ((e.clientX - rect.left) / rect.width) * venueWidth;
    const normalizedY = ((e.clientY - rect.top) / rect.height) * venueHeight;
    const mapUnitsPerPixelX = venueWidth / rect.width;
    const mapUnitsPerPixelY = venueHeight / rect.height;
    const hitRadius =
      (SEAT_SIZE / 2 + 6) * Math.max(mapUnitsPerPixelX, mapUnitsPerPixelY);

    const candidates = gridRef.current.query(normalizedX, normalizedY);
    let hit: Seat | null = null;
    let bestDist = Infinity;
    for (const s of candidates) {
      const dx = s.x - normalizedX;
      const dy = s.y - normalizedY;
      const dist2 = dx * dx + dy * dy;
      if (dist2 <= hitRadius * hitRadius && dist2 < bestDist) {
        bestDist = dist2;
        hit = s;
      }
    }
    if (hit) onSeatClick(hit);
  }

  // expose focus API
  useImperativeHandle(ref, () => ({
    focusSeat() {
      canvasRef.current?.focus();
    },
  }));

  return <canvas
    ref={canvasRef}
    onPointerDown={onPointerDown}
    role="img"
    aria-label="Seating map"
    tabIndex={0}
  />;
});

SeatCanvas.displayName = "SeatCanvas";

export default SeatCanvas;

function statusColor(st: string) {
  switch (st) {
    case "available":
      return "#2563EB";
    case "reserved":
      return "#F59E0B";
    case "sold":
      return "#9CA3AF";
    case "held":
      return "#EC4899";
    default:
      return "#64748B";
  }
}

function shadeColor(color: string, percent: number) {
  const clamp = (value: number) => Math.min(255, Math.max(0, value));
  const num = parseInt(color.slice(1), 16);
  const r = num >> 16;
  const g = (num >> 8) & 0x00ff;
  const b = num & 0x0000ff;
  const factor = (100 + percent) / 100;
  const newColor = (
    (clamp(Math.round(r * factor)) << 16) |
    (clamp(Math.round(g * factor)) << 8) |
    clamp(Math.round(b * factor))
  ).toString(16);
  return `#${newColor.padStart(6, "0")}`;
}
