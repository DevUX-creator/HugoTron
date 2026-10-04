import { DELIVERY_ROADS } from "@/content/deliveryRoads";

export type MapPoint = { x: number; y: number };
export const distance = (a: MapPoint, b: MapPoint) => Math.hypot(a.x - b.x, a.y - b.y);
export const mixPoint = (a: MapPoint, b: MapPoint, t: number): MapPoint => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

/** A tiny priority queue for A*, without a routing SDK or network service. */
class Queue {
  items: { id: number; cost: number }[] = [];
  push(id: number, cost: number) {
    const item = { id, cost };
    let i = this.items.length;
    this.items.push(item);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.items[parent]!.cost <= cost) break;
      this.items[i] = this.items[parent]!;
      i = parent;
    }
    this.items[i] = item;
  }
  pop() {
    const first = this.items[0];
    const last = this.items.pop();
    if (last && this.items.length) {
      let i = 0;
      while (i * 2 + 1 < this.items.length) {
        let child = i * 2 + 1;
        if (this.items[child + 1] && this.items[child + 1]!.cost < this.items[child]!.cost) child++;
        if (last.cost <= this.items[child]!.cost) break;
        this.items[i] = this.items[child]!;
        i = child;
      }
      this.items[i] = last;
    }
    return first;
  }
}

/** Roads are generalized cartography: this drives a visual journey, not live navigation. */
export function createRoadRouter() {
  const points = DELIVERY_ROADS.points.map(([x, y]) => ({ x: x!, y: y! }));
  const edges = DELIVERY_ROADS.edges as [number, number][];
  const adjacent: { id: number; cost: number }[][] = points.map(() => []);
  for (const [a, b] of edges) {
    const cost = distance(points[a]!, points[b]!);
    adjacent[a]!.push({ id: b, cost });
    adjacent[b]!.push({ id: a, cost });
  }
  const snap = (point: MapPoint) => {
    let best = { point: points[0]!, a: 0, b: 0, distance: Infinity };
    for (const [a, b] of edges) {
      const p = points[a]!,
        q = points[b]!;
      const dx = q.x - p.x,
        dy = q.y - p.y;
      const t = Math.max(
        0,
        Math.min(1, ((point.x - p.x) * dx + (point.y - p.y) * dy) / (dx * dx + dy * dy)),
      );
      const projected = mixPoint(p, q, t);
      const d = distance(projected, point);
      if (d < best.distance) best = { point: projected, a, b, distance: d };
    }
    return best;
  };
  return {
    snap,
    route(from: MapPoint, to: MapPoint): MapPoint[] {
      const start = snap(from),
        end = snap(to);
      if (start.a === end.a && start.b === end.b) return [from, start.point, end.point];
      const count = points.length;
      const cost = new Float64Array(count).fill(Infinity);
      const previous = new Int32Array(count).fill(-1);
      const visited = new Uint8Array(count);
      const queue = new Queue();
      for (const id of [start.a, start.b]) {
        cost[id] = distance(start.point, points[id]!);
        queue.push(id, cost[id]! + distance(points[id]!, end.point));
      }
      let goal = -1,
        best = Infinity;
      while (queue.items.length) {
        const item = queue.pop()!;
        if (item.cost >= best) break;
        const id = item.id;
        if (visited[id]) continue;
        visited[id] = 1;
        if (id === end.a || id === end.b) {
          const candidate = cost[id]! + distance(points[id]!, end.point);
          if (candidate < best) {
            best = candidate;
            goal = id;
          }
        }
        for (const edge of adjacent[id]!) {
          const next = cost[id]! + edge.cost;
          if (next >= cost[edge.id]!) continue;
          cost[edge.id] = next;
          previous[edge.id] = id;
          queue.push(edge.id, next + distance(points[edge.id]!, end.point));
        }
      }
      if (goal < 0) return [from];
      const result: MapPoint[] = [end.point];
      for (let id = goal; id !== -1; id = previous[id]!) result.push(points[id]!);
      result.push(start.point, from);
      return result.reverse().filter((p, i, all) => i === 0 || distance(p, all[i - 1]!) > 0.02);
    },
  };
}

/** Small corner radii give the van a turning arc, staying close to the road centreline. */
export function softenRoute(points: MapPoint[]) {
  if (points.length < 3) return points;
  const result = [points[0]!];
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1]!,
      b = points[i]!,
      c = points[i + 1]!;
    const radius = Math.min(0.65, distance(a, b) * 0.18, distance(b, c) * 0.18);
    if (radius < 0.02) {
      result.push(b);
      continue;
    }
    const before = mixPoint(b, a, radius / distance(a, b));
    const after = mixPoint(b, c, radius / distance(b, c));
    result.push(before);
    for (let n = 1; n <= 3; n++) {
      const t = n / 3;
      result.push(mixPoint(mixPoint(before, b, t), mixPoint(b, after, t), t));
    }
  }
  result.push(points.at(-1)!);
  return result;
}

export function measureRoute(points: MapPoint[]) {
  const lengths = [0];
  for (let i = 1; i < points.length; i++)
    lengths.push(lengths[i - 1]! + distance(points[i - 1]!, points[i]!));
  const length = lengths.at(-1)!;
  const sample = (travelled: number) => {
    let low = 0,
      high = points.length - 1;
    while (low + 1 < high) {
      const mid = (low + high) >> 1;
      if (lengths[mid]! <= travelled) low = mid;
      else high = mid;
    }
    const t = Math.max(
      0,
      Math.min(1, (travelled - lengths[low]!) / Math.max(0.0001, lengths[high]! - lengths[low]!)),
    );
    return { point: mixPoint(points[low]!, points[high]!, t), index: low };
  };
  return { points, length, sample };
}

export const routePath = (points: MapPoint[]) =>
  points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join("");
