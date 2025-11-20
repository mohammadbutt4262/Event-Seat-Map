import type { Seat } from "../types";

export function buildGrid(seats: Seat[], bucketSize = 64) {
  const map = new Map<string, Seat[]>();
  const key = (gx:number, gy:number) => `${gx}_${gy}`;
  for (const s of seats) {
    const gx = Math.floor(s.x / bucketSize);
    const gy = Math.floor(s.y / bucketSize);
    const k = key(gx, gy);
    const arr = map.get(k) ?? [];
    arr.push(s);
    map.set(k, arr);
  }
  return {
    // Query returns seats from the bucket containing x,y and its 8 neighbours
    query(x:number, y:number) {
      const gx = Math.floor(x / bucketSize);
      const gy = Math.floor(y / bucketSize);
      const results: Seat[] = [];
      const seen = new Set<string>();
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const k = key(gx + ox, gy + oy);
          const arr = map.get(k);
          if (!arr) continue;
          for (const s of arr) {
            if (seen.has(s.id)) continue;
            seen.add(s.id);
            results.push(s);
          }
        }
      }
      return results;
    }
  };
}
