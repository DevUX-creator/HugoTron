import { describe, expect, it } from "vitest";
import { createDeliveryRun, formatRunTime } from "../src/sections/Delivery/deliveryRun";
import { driveVelocity } from "../src/sections/Delivery/drivePhysics";

describe("delivery run", () => {
  it("starts on movement, collects passed stops once and freezes the final time", () => {
    const run = createDeliveryRun([
      { id: "a", x: 10, y: 0 },
      { id: "b", x: 20, y: 0 },
    ]);
    expect(run.advance({ x: 0, y: 0 }, { x: 30, y: 0 }, 2, 100)).toEqual([]);
    run.start(1000);
    expect(run.advance({ x: 0, y: 0 }, { x: 15, y: 0 }, 2, 2400)).toEqual(["a"]);
    expect(run.advance({ x: 15, y: 0 }, { x: 0, y: 0 }, 2, 2700)).toEqual([]);
    expect(run.advance({ x: 0, y: 0 }, { x: 30, y: 0 }, 2, 5000)).toEqual(["b"]);
    expect(run.snapshot(99999)).toEqual({
      collected: 2,
      total: 2,
      phase: "complete",
      elapsed: 4000,
    });
    run.reset();
    expect(run.snapshot(99999).phase).toBe("ready");
    expect(run.has("a")).toBe(false);
  });
  it("excludes hidden time and does not collect while paused", () => {
    const run = createDeliveryRun([{ id: "a", x: 10, y: 0 }]);
    run.start(1000);
    run.pause(2000);
    expect(run.advance({ x: 0, y: 0 }, { x: 20, y: 0 }, 2, 4000)).toEqual([]);
    expect(run.snapshot(6000).elapsed).toBe(1000);
    run.resume(9000);
    run.advance({ x: 0, y: 0 }, { x: 20, y: 0 }, 2, 10000);
    expect(run.snapshot(20000).elapsed).toBe(2000);
    expect(formatRunTime(65298)).toBe("01:05.2");
  });
  it("turns progressively and coasts to rest without frame-rate dependent acceleration", () => {
    const integrate = (hz: number) => {
      let velocity = { x: 0, y: 0 },
        heading = 180;
      for (let i = 0; i < hz; i++) {
        const p = driveVelocity(velocity, heading, { x: 1, y: 0 }, 1 / hz, 185, false);
        velocity = p.velocity;
        heading = p.heading;
      }
      return { velocity, heading };
    };
    const a = integrate(60),
      b = integrate(120);
    expect(a.heading).toBeCloseTo(90);
    expect(Math.abs(a.velocity.x - b.velocity.x)).toBeLessThan(2);
    const coast = driveVelocity(a.velocity, a.heading, { x: 0, y: 0 }, 0.1, 185, false);
    expect(coast.velocity.x).toBeGreaterThan(100);
    expect(coast.velocity.x).toBeLessThan(a.velocity.x);
    const firstTurn = driveVelocity({ x: 0, y: 185 }, 180, { x: 1, y: 0 }, 1 / 60, 185, false);
    expect(firstTurn.heading).toBeGreaterThan(170);
    expect(firstTurn.velocity.y).toBeGreaterThan(150);
  });
});
