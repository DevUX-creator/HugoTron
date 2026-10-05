import { CatmullRomCurve3, MathUtils, Vector3 } from "three";

/** The scroll-driven walk ends outside the door; the click owns the passage through it. */
export function createPalaceWalk() {
  const path = new CatmullRomCurve3([
    new Vector3(0.1, 1.78, 6),
    new Vector3(-0.1, 1.78, -4),
    new Vector3(0.25, 1.78, -13),
    new Vector3(-0.25, 1.78, -25),
    new Vector3(0.12, 1.78, -34),
    new Vector3(0, 1.78, -41.2),
  ]);
  const doorway = new Vector3(0, 2.45, -46.8);

  return (progress: number, door: number, eye: Vector3, look: Vector3) => {
    const p = MathUtils.clamp(progress, 0, 1);
    const approach = MathUtils.clamp((p - 0.84) / 0.16, 0, 1);
    const walk = p <= 0.84 ? p : 0.84 + 0.08 * (2 * approach - approach * approach);
    path.getPointAt(walk, eye);
    path.getPointAt(Math.min(1, walk + 0.13), look);
    look.y = 2.6 + Math.sin(p * Math.PI) * 0.75;
    // The former hard switch at 88% snapped the viewing direction. Blend the gaze
    // over the final approach, with zero blend velocity at both ends. Sampling by
    // scroll progress also makes the same movement continuous when walking back.
    look.lerp(doorway, MathUtils.smootherstep(p, 0.78, 0.96));
    eye.z -= door * door * 3.6;
  };
}
