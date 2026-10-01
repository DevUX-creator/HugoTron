import { describe, expect, it } from "vitest";
import {
  bowlLift,
  BRUSH_VIEW_START,
  brushRice,
  constrainRice,
  flightDuration,
  flightTravel,
  grainFlight,
  riceEntrance,
  riceTransition,
  seededRandom,
  stepSpring,
  stepCameraSpring,
  stepRiceBrush,
  type RiceBrushState,
  TOSS_DURATION,
} from "../src/components/rice/motion";

describe("rice study motion", () => {
  it("approaches without overshoot and stops smoothly at the resting composition", () => {
    expect(riceEntrance(-1)).toEqual(riceEntrance(0));
    expect(riceEntrance(2)).toEqual(riceEntrance(1));
    expect(riceEntrance(0).travel).toBe(0);
    expect(riceEntrance(1)).toEqual({ travel: 1, remaining: 0, opacity: 1, sway: 0 });
    let previous = 0;
    for (let p = 0; p <= 1; p += 0.01) {
      const entry = riceEntrance(p);
      expect(entry.travel).toBeGreaterThanOrEqual(previous);
      expect(entry.travel).toBeLessThanOrEqual(1);
      expect(Math.abs(entry.sway)).toBeLessThan(0.6);
      previous = entry.travel;
    }
    expect(riceEntrance(0.001).travel).toBeLessThan(0.000001);
    expect(1 - riceEntrance(0.999).travel).toBeLessThan(0.000001);
  });

  it("keeps every grain above its resting position and below its flight ceiling, including tiny secondary hops", () => {
    for (const height of [0, 0.0001, 0.015, 0.055, 0.22, 0.8, 1.42]) {
      for (let time = 0; time <= TOSS_DURATION; time += 0.01) {
        const lift = grainFlight(time, height, 0.34);
        expect(lift).toBeGreaterThanOrEqual(0);
        expect(lift).toBeLessThanOrEqual(height + 0.000001);
      }
    }
  });

  it("lands even the tallest grains before the next interaction and resets exactly", () => {
    for (const height of [0.0001, 0.055, 0.22, 1.42]) {
      for (const delay of [0.25, 0.33, 0.42]) {
        expect(grainFlight(0, height, delay)).toBe(0);
        expect(grainFlight(TOSS_DURATION - 0.001, height, delay)).toBe(0);
        expect(grainFlight(TOSS_DURATION, height, delay)).toBe(0);
        expect(grainFlight(TOSS_DURATION + 10, height, delay)).toBe(0);
      }
    }
    expect(bowlLift(0)).toBeCloseTo(0);
    expect(bowlLift(0.85)).toBe(0);
    expect(bowlLift(TOSS_DURATION)).toBe(0);
  });

  it("uses a single ballistic arc with its apex halfway through the flight", () => {
    const height = 0.8;
    const delay = 0.31;
    const duration = flightDuration(height);
    expect(grainFlight(delay + duration / 2, height, delay)).toBeCloseTo(height);
    expect(grainFlight(delay + duration / 4, height, delay)).toBeCloseTo(
      grainFlight(delay + (duration * 3) / 4, height, delay),
    );
  });

  it("recreates the same resting arrangement after a remount", () => {
    const first = seededRandom(1121);
    const second = seededRandom(1121);
    for (let i = 0; i < 100; i++) expect(first()).toBe(second());
  });

  it("drifts forwards through the apex instead of reversing the airborne path", () => {
    let previous = 0;
    for (let i = 0; i <= 100; i++) {
      const next = flightTravel(i / 100);
      expect(next).toBeGreaterThanOrEqual(previous);
      previous = next;
    }
    expect(flightTravel(0)).toBe(0);
    expect(flightTravel(1)).toBe(1);
  });

  it("lets rice lag behind the tilt, change sides, and settle when the dish levels", () => {
    const state = { value: 0, velocity: 0 };
    stepSpring(state, 0.075, 1 / 60);
    expect(state.value).toBeGreaterThan(0);
    expect(state.value).toBeLessThan(0.01);
    for (let i = 0; i < 180; i++) stepSpring(state, 0.075, 1 / 60);
    expect(state.value).toBeCloseTo(0.075, 4);
    for (let i = 0; i < 180; i++) stepSpring(state, -0.075, 1 / 60);
    expect(state.value).toBeCloseTo(-0.075, 4);
    for (let i = 0; i < 240; i++) stepSpring(state, 0, 1 / 60);
    expect(state.value).toBe(0);
    expect(state.velocity).toBe(0);
  });

  it("keeps the rice response consistent on low and high frame-rate devices", () => {
    const slow = { value: 0, velocity: 0 };
    const fast = { value: 0, velocity: 0 };
    for (let i = 0; i < 15; i++) stepSpring(slow, 0.075, 1 / 15);
    for (let i = 0; i < 120; i++) stepSpring(fast, 0.075, 1 / 120);
    expect(slow.value).toBeCloseTo(fast.value, 6);
  });

  it("keeps repeated landing scatter inside the rim", () => {
    const random = seededRandom(34);
    let point = { u: 0.8, v: 0.2 };
    for (let i = 0; i < 1000; i++) {
      point = constrainRice(point.u + random() * 0.052 - 0.026, point.v + random() * 0.052 - 0.026);
      expect(Math.hypot(point.u, point.v)).toBeLessThanOrEqual(0.865001);
    }
  });
});

describe("rice camera transition", () => {
  it("settles the short curved climb into the original horizontal overhead view", () => {
    for (const progress of [0, BRUSH_VIEW_START, 0.96, 1]) {
      const pose = riceTransition(progress);
      expect(pose.framing).toBe(1);
      expect(pose.bowlBank).toBe(0);
      expect(pose.bowlPitch).toBeCloseTo(0);
      expect(pose.bowlLift).toBe(0);
    }
    expect(riceTransition(0).elevation).toBe(Math.atan2(2.55, Math.hypot(0.2, 7.8)));
    expect(riceTransition(0.15).elevation).toBe(riceTransition(0).elevation);
    expect(riceTransition(0.3).azimuth).toBeLessThan(-0.4);
    expect(riceTransition(BRUSH_VIEW_START).elevation).toBe(Math.PI / 2);
    for (const compact of [false, true]) {
      const heading = riceTransition(BRUSH_VIEW_START, false, compact).azimuth;
      expect(heading).toBe(0);
      for (const progress of [BRUSH_VIEW_START, 0.95, 1]) {
        expect(riceTransition(progress, false, compact).azimuth).toBe(heading);
      }
      // Native yaw/pitch reaches the original up vector without a separate roll correction.
      const top = riceTransition(1, false, compact);
      expect(Math.sin(top.azimuth)).toBeCloseTo(0);
      expect(Math.cos(top.azimuth)).toBeCloseTo(1);
    }
    expect(riceTransition(1).elevation).toBe(Math.PI / 2);
    expect(riceTransition(-1)).toEqual(riceTransition(0));
    expect(riceTransition(2)).toEqual(riceTransition(1));
  });

  it("rises continuously through the side arc with a bounded, subtle bowl tilt", () => {
    for (const compact of [false, true]) {
      let lastElevation = 0;
      let previous = riceTransition(0, false, compact);
      for (let i = 0; i <= 1000; i++) {
        const pose = riceTransition(i / 1000, false, compact);
        expect(pose.elevation).toBeGreaterThanOrEqual(lastElevation);
        expect(pose.elevation).toBeLessThanOrEqual(Math.PI / 2);
        expect(Math.hypot(pose.bowlBank, pose.bowlPitch)).toBeLessThan(0.1);
        expect(pose.framing).toBeGreaterThanOrEqual(1);
        expect(Math.abs(pose.azimuth)).toBeLessThan(0.55);
        expect(Math.abs(pose.azimuth - previous.azimuth)).toBeLessThan(0.003);
        const direction = [
          Math.sin(pose.azimuth) * Math.cos(pose.elevation),
          Math.sin(pose.elevation),
          Math.cos(pose.azimuth) * Math.cos(pose.elevation),
        ];
        const up = [
          -Math.sin(pose.azimuth) * Math.sin(pose.elevation),
          Math.cos(pose.elevation),
          -Math.cos(pose.azimuth) * Math.sin(pose.elevation),
        ];
        // Native yaw/pitch retains an orthonormal camera frame all the way to the zenith.
        expect(
          Math.hypot(
            direction[1]! * up[2]! - direction[2]! * up[1]!,
            direction[2]! * up[0]! - direction[0]! * up[2]!,
            direction[0]! * up[1]! - direction[1]! * up[0]!,
          ),
        ).toBeCloseTo(1);
        previous = pose;
        lastElevation = pose.elevation;
      }
    }
  });

  it("pulls back early and smoothly pushes in for the rest of the approach", () => {
    for (const compact of [false, true]) {
      const peak = riceTransition(0.3, false, compact).framing;
      expect(peak).toBeGreaterThan(1.1);
      let previous = 1;
      for (let i = 0; i <= 30; i++) {
        const framing = riceTransition(i / 100, false, compact).framing;
        expect(framing).toBeGreaterThanOrEqual(previous);
        previous = framing;
      }
      for (let i = 31; i <= 100; i++) {
        const framing = riceTransition(i / 100, false, compact).framing;
        expect(framing).toBeLessThanOrEqual(previous);
        previous = framing;
      }
      expect(previous).toBe(1);
    }
  });

  it("softens small-screen motion and jumps to the same endpoint with reduced motion", () => {
    const desktop = riceTransition(0.45);
    const mobile = riceTransition(0.45, false, true);
    expect(Math.abs(mobile.azimuth)).toBeLessThan(Math.abs(desktop.azimuth));
    expect(mobile.bowlBank).toBeLessThan(desktop.bowlBank);
    expect(mobile.framing).toBeLessThan(desktop.framing);
    for (let i = 0; i <= 10; i++) {
      const pose = riceTransition(i / 10, true);
      expect(pose).toEqual(riceTransition(i < 5 ? 0 : 1));
      expect(pose.bowlBank).toBe(0);
      expect(pose.bowlPitch).toBeCloseTo(0);
      expect(pose.framing).toBe(1);
    }
  });
});

describe("camera drift", () => {
  it("gains momentum, then settles exactly without overshooting or rendering forever", () => {
    const camera = { value: 0, velocity: 0 };
    stepCameraSpring(camera, 1, 1 / 60);
    const firstVelocity = camera.velocity;
    const firstPosition = camera.value;
    stepCameraSpring(camera, 1, 1 / 60);
    expect(camera.velocity).toBeGreaterThan(firstVelocity);
    expect(camera.value - firstPosition).toBeGreaterThan(firstPosition);
    let previous = camera.value;
    for (let i = 0; i < 300; i++) {
      stepCameraSpring(camera, 1, 1 / 60);
      expect(camera.value).toBeGreaterThanOrEqual(previous);
      expect(camera.value).toBeLessThanOrEqual(1);
      previous = camera.value;
    }
    expect(camera).toEqual({ value: 1, velocity: 0 });
    expect(stepCameraSpring(camera, 1, 1 / 60)).toBe(false);
  });

  it("keeps the same drift response at different refresh rates", () => {
    for (const frequency of [3.2, 5]) {
      const samples = [15, 30, 60, 120].map((rate) => {
        const camera = { value: 0, velocity: 0 };
        for (let i = 0; i < rate; i++) stepCameraSpring(camera, 1, 1 / rate, frequency);
        return camera;
      });
      for (const camera of samples) {
        expect(camera.value).toBeCloseTo(samples[0]!.value, 10);
        expect(camera.velocity).toBeCloseTo(samples[0]!.velocity, 10);
      }
    }
  });

  it("carries momentum through a direction change and returns to rest", () => {
    const camera = { value: 0, velocity: 0 };
    for (let i = 0; i < 20; i++) stepCameraSpring(camera, 1, 1 / 60);
    const position = camera.value;
    stepCameraSpring(camera, 0, 1 / 120);
    expect(camera.value).toBeGreaterThan(position);
    for (let i = 0; i < 300; i++) stepCameraSpring(camera, 0, 1 / 60);
    expect(camera).toEqual({ value: 0, velocity: 0 });
  });
});

describe("brushing rice", () => {
  const state = (): RiceBrushState => ({ velocityU: 0, velocityV: 0, yaw: 0, spin: 0, lift: 0 });
  const stroke = { fromX: -0.1, fromZ: 0, toX: 0.1, toZ: 0 };

  it("parts nearby grains to opposite sides with a little forward drag", () => {
    const left = state();
    const right = state();
    expect(brushRice(left, { x: 0, y: -0.06 }, stroke, 0.8)).toBe(true);
    expect(brushRice(right, { x: 0, y: 0.06 }, stroke, 0.8)).toBe(true);
    expect(left.velocityV).toBeLessThan(0);
    expect(right.velocityV).toBeGreaterThan(0);
    expect(left.velocityU).toBeGreaterThan(0);
    expect(right.velocityU).toBeGreaterThan(0);
    expect(left.spin * right.spin).toBeLessThan(0);
  });

  it("leaves distant grains and stationary taps undisturbed", () => {
    const far = state();
    expect(brushRice(far, { x: 0.6, y: 0.4 }, stroke, 0.8)).toBe(false);
    expect(brushRice(far, { x: 0, y: 0 }, { ...stroke, toX: stroke.fromX }, 0.8)).toBe(false);
    expect(far).toEqual(state());
  });

  it("settles into a new position and orientation instead of rewinding the stroke", () => {
    const grain = state();
    const anchor = { x: 0, y: 0.06 };
    brushRice(grain, anchor, stroke, 0.8);
    for (let i = 0; i < 300; i++) stepRiceBrush(grain, anchor, 1 / 60);
    expect(anchor.x).toBeGreaterThan(0);
    expect(anchor.y).toBeGreaterThan(0.06);
    expect(grain.yaw).toBeGreaterThan(0);
    expect(grain.velocityU).toBe(0);
    expect(grain.velocityV).toBe(0);
    expect(grain.spin).toBe(0);
    expect(grain.lift).toBe(0);
    const resting = { ...anchor };
    expect(stepRiceBrush(grain, anchor, 0.1)).toBe(false);
    expect(anchor).toEqual(resting);
  });

  it("keeps grains inside the rim after repeated strong pushes", () => {
    const grain = state();
    const anchor = { x: 0.8, y: 0.2 };
    for (let i = 0; i < 300; i++) {
      grain.velocityU += 0.4;
      grain.velocityV += 0.4;
      stepRiceBrush(grain, anchor, 1 / 30);
      expect(Math.hypot(anchor.x, anchor.y)).toBeLessThanOrEqual(0.855001);
      expect(Number.isFinite(grain.velocityU + grain.velocityV)).toBe(true);
    }
  });

  it("preserves the friction response across frame rates and reduces motion strength", () => {
    const slow = state();
    const fast = state();
    const gentle = state();
    const a = { x: 0, y: 0.06 };
    const b = { ...a };
    brushRice(slow, a, stroke, 0.8);
    brushRice(fast, b, stroke, 0.8);
    brushRice(gentle, a, stroke, 0.8, 0.22);
    expect(gentle.velocityU).toBeCloseTo(slow.velocityU * 0.22);
    expect(gentle.lift).toBeLessThan(slow.lift);
    for (let i = 0; i < 8; i++) stepRiceBrush(slow, a, 1 / 16);
    for (let i = 0; i < 60; i++) stepRiceBrush(fast, b, 1 / 120);
    expect(a.x).toBeCloseTo(b.x, 8);
    expect(a.y).toBeCloseTo(b.y, 8);
    expect(slow.yaw).toBeCloseTo(fast.yaw, 8);
  });
});
