import * as THREE from "three";
import { WORLD_DEPTH } from "./journey";

/** Shared curves keep the glowing filaments and the orbiting mineral field together. */
export function createWorldLightPaths() {
  const paths: [number, number, number][][] = [
    [
      [-4.6, 0.35, 4.2],
      [-2.5, 0.55, 2.1],
      [-1.15, 0.72, 0.8],
      [0.5, 0.82, -0.1],
      [1.4, 1.1, -2.4],
      [1.65, 1.25, -5.1],
      [1.8, 1.3, -9.5],
    ],
    [
      [4.5, 0.7, 3],
      [2.2, 0.82, 1.3],
      [0.9, 1, 0.1],
      [-0.6, 1, -1.8],
      [-1, 1.15, -4.5],
      [-1.35, 1.35, -8.8],
    ],
    [
      [-8, -0.6, 11],
      [-5, 0, 6],
      [-2.4, 0.6, 2],
      [-2.5, 1.5, -2],
      [-0.6, 2, -6],
      [2.5, 2.6, -11],
      [3.4, 3.1, -18],
    ],
    [
      [1.5, -0.9, 12],
      [0.8, -0.2, 6],
      [1.5, 0.8, 2],
      [3.6, 1.4, -1.5],
      [4.8, 2.1, -5],
      [4.5, 2.6, -11],
      [4, 3.2, -19],
    ],
  ];
  return paths.map(
    (points, index) =>
      new THREE.CatmullRomCurve3(
        points.map(
          ([x, y, z]) =>
            new THREE.Vector3(x, y + (index > 1 ? 1.65 : 0), z - (index > 1 ? WORLD_DEPTH : 0)),
        ),
      ),
  );
}
