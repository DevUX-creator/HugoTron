import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { createPalaceWalk } from "../src/components/hall/palaceCamera";

describe("wholesale camera approach", () => {
  const walk = createPalaceWalk();
  const sample = (progress: number) => {
    const eye = new Vector3();
    const look = new Vector3();
    walk(progress, 0, eye, look);
    return { eye, look, direction: look.clone().sub(eye).normalize() };
  };

  it("does not snap its viewing direction at the final chapter or gaze blend boundaries", () => {
    for (const progress of [0.78, 0.84, 0.88, 0.96]) {
      const before = sample(progress - 0.00001);
      const after = sample(progress + 0.00001);
      expect(before.direction.angleTo(after.direction)).toBeLessThan(0.0001);
      expect(before.eye.distanceTo(after.eye)).toBeLessThan(0.002);
    }
  });

  it("approaches the door without crossing it, then eases to rest", () => {
    let previous = sample(0.74).eye.z;
    for (let step = 75; step <= 100; step++) {
      const { eye } = sample(step / 100);
      expect(eye.z).toBeLessThan(previous);
      expect(eye.z).toBeGreaterThan(-41.2);
      previous = eye.z;
    }
    const end = sample(1);
    expect(end.look.toArray()).toEqual([0, 2.45, -46.8]);
    expect(end.eye.distanceTo(sample(0.9999).eye)).toBeLessThan(0.00001);
  });

  it("retraces the same camera positions and gaze when scrolling backwards", () => {
    const positions = [0.78, 0.84, 0.879, 0.881, 0.92, 1];
    const forward = positions.map(sample);
    for (const [i, progress] of [...positions.entries()].reverse()) {
      const back = sample(progress);
      expect(back.eye.toArray()).toEqual(forward[i]!.eye.toArray());
      expect(back.look.toArray()).toEqual(forward[i]!.look.toArray());
    }
  });
});
