import * as THREE from "three";

export const WORLD_DEPTH = 20;

export function worldCameraFov(progress: number) {
  const arriving = THREE.MathUtils.smootherstep(progress, 0.7, 1);
  const dive =
    THREE.MathUtils.smoothstep(progress, 0.06, 0.3) *
    (1 - THREE.MathUtils.smoothstep(progress, 0.55, 0.85));
  return 43 + dive * 5 - arriving * 3;
}

/** A point ahead of the camera follows the light current, not a travelling object. */
function trailFocus(progress: number, output: THREE.Vector3) {
  const travel = THREE.MathUtils.smootherstep(progress, 0.14, 0.76);
  output.set(
    -Math.sin(travel * Math.PI) * 0.8,
    1.65 + Math.sin(travel * Math.PI) * 0.3,
    -WORLD_DEPTH * travel,
  );
}

export function createWorldJourneyRig() {
  const focus = new THREE.Vector3(0, 1.65, 0);
  const followPosition = new THREE.Vector3();
  const followTarget = new THREE.Vector3();
  const offset = new THREE.Vector3();
  return {
    focus,
    /** Follow the streams forward, then open the view across their sweeping curves. */
    update(progress: number, mobile: boolean, position: THREE.Vector3, target: THREE.Vector3) {
      trailFocus(progress, focus);
      const follow = THREE.MathUtils.smootherstep(progress, 0.04, 0.27);
      const settle = THREE.MathUtils.smootherstep(progress, 0.6, 1);
      const bank = settle * 0.28;
      const distance = THREE.MathUtils.lerp(mobile ? 8.8 : 5.6, mobile ? 15.5 : 10.8, settle);
      offset.set(
        Math.sin(bank) * distance + Math.sin(progress * Math.PI) * 0.35 * (1 - settle),
        THREE.MathUtils.lerp(0.65, mobile ? 11.8 : 9.2, settle),
        Math.cos(bank) * distance,
      );
      followPosition.copy(focus).add(offset);
      followTarget.copy(focus);
      followTarget.y -= settle * (mobile ? 0.4 : 0.5);
      position.lerp(followPosition, follow);
      target.lerp(followTarget, follow);
    },
  };
}
