import * as THREE from "three";

/** A full, almost straight body and asymmetric rounded caps, as in img.png. */
export function grainGeometry() {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const rows = 20;
  const sides = 12;
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    const roundness = Math.pow(Math.max(0.00001, 1 - (2 * t - 1) ** 2), 0.45);
    const radius = 0.0235 * roundness * (0.95 + Math.sin(t * Math.PI) * 0.05 - (t - 0.5) * 0.08);
    for (let side = 0; side <= sides; side++) {
      const angle = (side / sides) * Math.PI * 2;
      const crease = 1 - 0.035 * Math.pow(Math.max(0, Math.cos(angle)), 12);
      positions.push(
        Math.cos(angle) * radius * crease + 0.0018 * Math.sin(t * Math.PI),
        (t - 0.5) * 0.225,
        Math.sin(angle) * radius * 0.86,
      );
      uvs.push(side / sides, t);
      if (row < rows && side < sides) {
        const a = row * (sides + 1) + side;
        const b = a + sides + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
