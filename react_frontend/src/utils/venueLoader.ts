import type { Venue, Seat } from "../types";

export async function loadVenue(): Promise<Venue> {
  const res = await fetch("/venue.json");
  if (!res.ok) throw new Error("Failed to load venue.json");
  const v = (await res.json()) as Venue;
  return v;
}

// flatten seats to array with references to section + row
export function flattenSeats(v: Venue) {
  const seats: Seat[] = [];
  for (const sec of v.sections) {
    for (const row of sec.rows) {
      for (const s of row.seats) {
        seats.push({
          ...s,
          sectionId: sec.id,
          rowIndex: row.index
        });
      }
    }
  }
  return seats;
}
