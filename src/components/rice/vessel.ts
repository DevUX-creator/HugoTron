import * as THREE from "three";
import { bowlOutline, riceSurface, seededRandom } from "./motion";

/** Closed cross-section: foot, outside, rounded lip, inside, inner floor. */
export function ceramicGeometry() {
  const profile = new THREE.CatmullRomCurve3(
    [
      [0.001, 0.015],
      [0.3, 0.015],
      [0.46, 0.03],
      [0.57, 0.12],
      [0.7, 0.32],
      [0.84, 0.59],
      [0.96, 0.87],
      [1, 0.985],
      [1.001, 1.01],
      [0.99, 1.026],
      [0.975, 1.015],
      [0.959, 0.973],
      [0.91, 0.82],
      [0.8, 0.57],
      [0.66, 0.35],
      [0.48, 0.21],
      [0.25, 0.19],
      [0.001, 0.19],
    ].map(([r, y]) => new THREE.Vector3(r!, y!, 0)),
    false,
    "centripetal",
  );
  const rows = 90;
  const columns = 192;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row++) {
    const point = profile.getPoint(row / rows);
    for (let column = 0; column <= columns; column++) {
      const angle = (column / columns) * Math.PI * 2;
      const outline = bowlOutline(angle, point.x);
      const rim = 1.18 + 0.24 * Math.cos(angle) - 0.21 * Math.sin(angle);
      // Barely perceptible hand-thrown irregularity; the bowl remains rigid.
      const irregularity = Math.sin(angle * 5 + 0.4) * Math.sin(point.y * 3) * 0.004;
      positions.push(outline.x, 0.035 + point.y * rim + irregularity, outline.z);
      uvs.push(column / columns, row / rows);
      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column;
        const b = a + columns + 1;
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

/** Warm ivory starch with small opaque flecks, without baking in the light. */
export function riceMaps() {
  const width = 64;
  const height = 256;
  const albedo = new Uint8Array(width * height * 4);
  const relief = new Uint8Array(width * height * 4);
  const random = seededRandom(774);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = (x / width) * Math.PI * 2;
      const v = y / height;
      const starch = 0.5 + Math.sin(u * 2 + Math.sin(v * 22)) * 0.18 + Math.sin(v * 39) * 0.16;
      const fine = random();
      const i = (y * width + x) * 4;
      albedo[i] = 231 + starch * 23;
      albedo[i + 1] = 202 + starch * 36;
      albedo[i + 2] = 152 + starch * 52;
      albedo[i + 3] = 255;
      relief[i] = relief[i + 1] = relief[i + 2] = 122 + starch * 14 + fine * 12;
      relief[i + 3] = 255;
    }
  }
  const color = new THREE.DataTexture(albedo, width, height);
  const bump = new THREE.DataTexture(relief, width, height);
  for (const texture of [color, bump]) {
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
  }
  color.colorSpace = THREE.SRGBColorSpace;
  return { color, bump };
}

/** Fine mineral pores, with subtle mottling rather than a photographic light baked in. */
export function ceramicMaps() {
  const size = 512;
  const random = seededRandom(516);
  const colorData = new Uint8Array(size * size * 4);
  const bumpData = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const fine = random();
      const waves = Math.sin(x * 0.06 + Math.sin(y * 0.08) * 2) * Math.sin(y * 0.043 + x * 0.016);
      const pore = fine > 0.979 ? -40 : 0;
      const grain = (fine - 0.5) * 22 + waves * 6 + pore;
      colorData[i] = 88 + grain;
      colorData[i + 1] = 73 + grain * 0.86;
      colorData[i + 2] = 62 + grain * 0.75;
      colorData[i + 3] = 255;
      const bump = 137 + (fine - 0.5) * 75 + waves * 14 + pore;
      bumpData[i] = bumpData[i + 1] = bumpData[i + 2] = bump;
      bumpData[i + 3] = 255;
    }
  }
  const color = new THREE.DataTexture(colorData, size, size);
  const bump = new THREE.DataTexture(bumpData, size, size);
  for (const texture of [color, bump]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 2);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
  }
  color.colorSpace = THREE.SRGBColorSpace;
  return { color, bump };
}

/** Buried rice has volume; the texture fills tiny gaps beneath the loose kernels. */
export function riceBed() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const context = canvas.getContext("2d")!;
  const random = seededRandom(274);
  context.fillStyle = "#b7a386";
  context.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 16000; i++) {
    context.save();
    context.translate(random() * 1024, random() * 1024);
    context.rotate(random() * Math.PI);
    context.beginPath();
    context.ellipse(0, 0, 12 + random() * 5, 2.5 + random(), 0, 0, Math.PI * 2);
    const value = 184 + Math.floor(random() * 42);
    context.fillStyle = `rgb(${value + 24},${value + 7},${value - 27})`;
    context.fill();
    context.strokeStyle = "rgba(115, 96, 62, 0.22)";
    context.lineWidth = 1;
    context.stroke();
    context.restore();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const rows = 40;
  const columns = 128;
  for (let row = 0; row <= rows; row++) {
    const radius = Math.max(0.001, (row / rows) * 0.85);
    for (let column = 0; column <= columns; column++) {
      const angle = (column / columns) * Math.PI * 2;
      const outline = bowlOutline(angle, radius);
      // Keep the filler beneath both buried grain layers so a brushed groove reveals kernels.
      positions.push(outline.x, riceSurface(radius, angle) - 0.16, outline.z);
      uvs.push(outline.x / 4.5 + 0.5, outline.z / 2.6 + 0.5);
      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column;
        const b = a + columns + 1;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    // Match the warm instance tint; a white, fully lit bed reads as a pale stripe after brushing.
    color: 0xe5d5b8,
    map: texture,
    bumpMap: texture,
    bumpScale: 0.012,
    roughness: 0.55,
    envMapIntensity: 0.32,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

/** The turned foot ring beneath the dish; the caller scales it to the oval. */
export function ceramicFootGeometry() {
  return new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.6, 0),
      new THREE.Vector2(0.64, 0.025),
      new THREE.Vector2(0.68, 0.08),
      new THREE.Vector2(0.64, 0.105),
      new THREE.Vector2(0.57, 0.08),
      new THREE.Vector2(0.57, 0.01),
      new THREE.Vector2(0.6, 0),
    ],
    96,
  );
}
