import type { MapPoint } from "./roadJourney";

/** Illustrative client stops, not a claim about actual customer locations. */
export const DELIVERY_STOPS = [
  { id: "01", x: 596.978, y: 315.595 },
  { id: "02", x: 665.121, y: 338.066 },
  { id: "03", x: 634.559, y: 393.82 },
  { id: "04", x: 564.9, y: 402.94 },
  { id: "05", x: 522.48, y: 375.03 },
  { id: "06", x: 537.542, y: 323.519 },
  { id: "07", x: 487.58, y: 330.198 },
  { id: "08", x: 597.58, y: 442.978 },
  { id: "09", x: 696.339, y: 391.681 },
  { id: "10", x: 633.48, y: 276.5 },
] as const;
export type RunSnapshot = {
  collected: number;
  total: number;
  phase: "ready" | "running" | "complete";
  elapsed: number;
};
export function formatRunTime(milliseconds: number) {
  const tenths = Math.floor(milliseconds / 100);
  return `${String(Math.floor(tenths / 600)).padStart(2, "0")}:${String(Math.floor(tenths / 10) % 60).padStart(2, "0")}.${tenths % 10}`;
}

/** Segment hits prevent a fast van skipping a stop. Only the fixed stop IDs and one clock are retained. */
export function createDeliveryRun(stops: readonly (MapPoint & { id: string })[] = DELIVERY_STOPS) {
  const collected = new Set<string>();
  let started: number | null = null,
    paused: number | null = null,
    pauseTotal = 0,
    finished: number | null = null;
  const elapsed = (now: number) =>
    started === null ? 0 : Math.max(0, (finished ?? paused ?? now) - started - pauseTotal);
  return {
    start(now: number) {
      started ??= now;
    },
    advance(from: MapPoint, to: MapPoint, radius: number, now: number) {
      if (started === null || paused !== null || finished !== null) return [];
      const dx = to.x - from.x,
        dy = to.y - from.y,
        length = dx * dx + dy * dy;
      const hits: string[] = [];
      for (const stop of stops) {
        if (collected.has(stop.id)) continue;
        const t = length
          ? Math.max(0, Math.min(1, ((stop.x - from.x) * dx + (stop.y - from.y) * dy) / length))
          : 0;
        if (Math.hypot(stop.x - from.x - t * dx, stop.y - from.y - t * dy) > radius) continue;
        collected.add(stop.id);
        hits.push(stop.id);
      }
      if (collected.size === stops.length) finished = now;
      return hits;
    },
    pause(now: number) {
      if (started !== null && finished === null) paused ??= now;
    },
    resume(now: number) {
      if (paused !== null) {
        pauseTotal += now - paused;
        paused = null;
      }
    },
    reset() {
      collected.clear();
      started = paused = finished = null;
      pauseTotal = 0;
    },
    has(id: string) {
      return collected.has(id);
    },
    snapshot(now: number): RunSnapshot {
      return {
        collected: collected.size,
        total: stops.length,
        phase: finished !== null ? "complete" : started === null ? "ready" : "running",
        elapsed: elapsed(now),
      };
    },
  };
}
