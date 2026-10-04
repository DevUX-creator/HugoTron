import { describe, expect, it } from "vitest";
import { DELIVERY_MAP } from "@/content/deliveryMap";
import {
  createRoadRouter,
  distance,
  measureRoute,
  softenRoute,
} from "@/sections/Delivery/roadJourney";

const origin = { x: DELIVERY_MAP.hamburg[0], y: DELIVERY_MAP.hamburg[1] };
const router = createRoadRouter();

describe("the Germany delivery journey", () => {
  it.each([
    ["east", { x: 748.8, y: 371.2 }],
    ["west", { x: 424.3, y: 497.6 }],
    ["south", { x: 656.7, y: 721.8 }],
  ])("reaches the %s on a continuous road route from Hamburg", (_, destination) => {
    const route = router.route(origin, destination);
    expect(route[0]).toEqual(origin);
    expect(distance(route.at(-1)!, destination)).toBeLessThan(12);
    expect(route.length).toBeGreaterThan(15);
    expect(measureRoute(route).length).toBeGreaterThan(distance(origin, destination) * 1.03);
    for (let i = 1; i < route.length; i++) {
      expect(distance(route[i - 1]!, route[i]!)).toBeLessThan(60);
      expect(Number.isFinite(route[i]!.x + route[i]!.y)).toBe(true);
    }
  });

  it("retargets from the van's current position without teleporting", () => {
    const first = measureRoute(softenRoute(router.route(origin, { x: 748.8, y: 371.2 })));
    const midway = first.sample(first.length * 0.45).point;
    const redirected = router.route(midway, { x: 424.3, y: 497.6 });
    expect(redirected[0]).toEqual(midway);
    expect(router.snap(redirected[0]!).distance).toBeLessThan(1.5);
    expect(measureRoute(softenRoute(redirected)).sample(0).point).toEqual(midway);
  });

  it("samples progress monotonically, with turning arcs close to the roads", () => {
    const smoothed = softenRoute(router.route(origin, { x: 656.7, y: 721.8 }));
    const route = measureRoute(smoothed);
    expect(route.sample(0).point).toEqual(smoothed[0]);
    expect(route.sample(route.length).point).toEqual(smoothed.at(-1));
    let index = 0;
    for (let step = 0; step <= 50; step++) {
      const sample = route.sample((route.length * step) / 50);
      expect(sample.index).toBeGreaterThanOrEqual(index);
      expect(router.snap(sample.point).distance).toBeLessThan(1.5);
      index = sample.index;
    }
  });
});
