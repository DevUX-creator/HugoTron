import * as THREE from "three";
import { createWorldStream, type StreamUniforms } from "@/components/world/stream";

/** The home scene's exact filament/particle renderer, following two open paths around the pack. */
export function createPackStream(small: boolean, depth: THREE.DepthTexture) {
  const path = (points: number[][]) =>
    new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...(p as [number, number, number]))),
    );
  const a = path([
    [0, 0.15, 23],
    [-0.6, 0.2, 12],
    [0.6, 0.25, 4],
    [5.7, 0.8, -3.5],
    [5.6, 3.1, -6.5],
    [2, 4.8, -10.7],
    [-1.4, 3.1, -8],
    [0.3, 1.85, -5.1],
    [5, 1.75, -9],
    [4, 3.5, -15],
    [-2, 4, -28],
    [-8, 5, -46],
  ]);
  const b = path([
    [-14, 1.2, 8],
    [-6, 0.6, 2],
    [-2, 0.9, -2],
    [-0.7, 2.6, -7],
    [2, 4.45, -11],
    [5.3, 3.6, -7.9],
    [2.9, 1.7, -4.5],
    [-1.7, 2.8, -8],
    [-3.9, 4.5, -17],
    [-9, 6, -30],
  ]);
  const uniforms: StreamUniforms = {
    chapter: { value: 1 },
    boost: { value: 0 },
    journeyCenter: { value: new THREE.Vector3(2, 3.3, -8) },
    time: { value: 0 },
    age: { value: 4 },
    pixelRatio: { value: 1 },
    tDepth: { value: depth },
    resolution: { value: new THREE.Vector2(1, 1) },
    nearClip: { value: 0.1 },
    farClip: { value: 180 },
    lensPointer: { value: new THREE.Vector2() },
  };
  const stream = createWorldStream(small, uniforms, {
    routes: [a, b, a, b],
    particles: small ? 450 : 800,
    strands: small ? 14 : 21,
    filamentOpacity: 0.36,
  });
  const scene = new THREE.Scene();
  scene.add(stream.group);
  return {
    scene,
    update(time: number, hover: number) {
      uniforms.time.value = time;
      uniforms.boost.value = hover * 0.08;
    },
    resize(width: number, height: number, ratio: number) {
      uniforms.resolution.value.set(width * ratio, height * ratio);
      uniforms.pixelRatio.value = ratio;
    },
    dispose: stream.dispose,
  };
}
