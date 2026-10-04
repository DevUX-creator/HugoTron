import * as THREE from "three";
import type { PackFinish } from "./types";

/** A sewn paper sack: rounded gussets, a pinched seam, small folds and curved printed artwork. */
export function createLabelPack() {
  const group = new THREE.Group();
  const ownedGeometry: THREE.BufferGeometry[] = [];
  const ownedMaterials: THREE.Material[] = [];
  const widthAt = (v: number) =>
    0.8 * (0.87 + Math.sin(v * Math.PI) * 0.18 - Math.pow(v, 8) * 0.025);
  const depthAt = (v: number) =>
    0.51 * (0.53 + Math.sin(v * Math.PI) * 0.58) * (1 - Math.pow(v, 10) * 0.88);
  const fold = (x: number, v: number) =>
    Math.sin(x * 19 + v * 13) * 0.009 +
    Math.sin(v * 34 + Math.abs(x) * 7) *
      0.016 *
      Math.exp(-Math.pow((Math.abs(x) - 0.62) / 0.18, 2)) *
      Math.sin(v * Math.PI) +
    Math.sin(x * 34 - v * 18) * 0.018 * (Math.pow(v, 5) + Math.pow(1 - v, 5));
  const columns = 64,
    rows = 48;
  const geometry = new THREE.BufferGeometry();
  const points: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  for (let y = 0; y <= rows; y++) {
    const v = y / rows;
    for (let x = 0; x <= columns; x++) {
      const a = (x / columns) * Math.PI * 2;
      const c = Math.cos(a),
        s = Math.sin(a);
      const px = Math.sign(c) * Math.pow(Math.abs(c), 0.35) * widthAt(v);
      const pz = Math.sign(s) * Math.pow(Math.abs(s), 0.55) * depthAt(v) + fold(px, v);
      points.push(px, v * 2.5, pz);
      uvs.push(x / columns, v);
      if (x < columns && y < rows) {
        const i = y * (columns + 1) + x;
        indices.push(i, i + columns + 1, i + 1, i + 1, i + columns + 1, i + columns + 2);
      }
    }
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  ownedGeometry.push(geometry);
  // A reusable fibre height map: crossed threads, fine grain and no additional network asset.
  const fibreCanvas = document.createElement("canvas");
  fibreCanvas.width = fibreCanvas.height = 512;
  const fibreContext = fibreCanvas.getContext("2d")!;
  const pixels = fibreContext.createImageData(512, 512);
  let seed = 137;
  for (let y = 0; y < 512; y++)
    for (let x = 0; x < 512; x++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const grain = (seed / 4294967296 - 0.5) * 22;
      const weave = Math.sin((x * Math.PI) / 3) * 12 + Math.sin((y * Math.PI) / 4) * 9;
      const value = Math.round(145 + grain + weave);
      const i = (y * 512 + x) * 4;
      pixels.data.set([value, value, value, 255], i);
    }
  fibreContext.putImageData(pixels, 0, 0);
  const fibre = new THREE.CanvasTexture(fibreCanvas);
  fibre.wrapS = fibre.wrapT = THREE.RepeatWrapping;
  fibre.repeat.set(3, 2);
  const paper = new THREE.MeshPhysicalMaterial({
    color: 0xc2b6a1,
    roughness: 0.77,
    bumpMap: fibre,
    bumpScale: 0.014,
    sheen: 0.18,
    sheenRoughness: 0.8,
    sheenColor: new THREE.Color(0xb4c6d7),
    side: THREE.DoubleSide,
    envMapIntensity: 0.6,
  });
  ownedMaterials.push(paper);
  const body = new THREE.Mesh(geometry, paper);
  body.castShadow = true;
  group.add(body);
  const seamMat = new THREE.MeshStandardMaterial({ color: 0x9f927c, roughness: 0.9 });
  ownedMaterials.push(seamMat);
  const seamGeometry = new THREE.BoxGeometry(1.38, 0.085, 0.105);
  ownedGeometry.push(seamGeometry);
  const seam = new THREE.Mesh(seamGeometry, seamMat);
  seam.position.y = 2.49;
  group.add(seam);
  const stitchPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 96; i++)
    stitchPoints.push(
      new THREE.Vector3(-0.66 + (i / 96) * 1.32, 2.49 + (i % 2 ? 0.018 : -0.018), 0.058),
    );
  const stitchGeometry = new THREE.BufferGeometry().setFromPoints(stitchPoints);
  const stitchMaterial = new THREE.LineBasicMaterial({
    color: 0xb9aa8b,
    transparent: true,
    opacity: 0.7,
  });
  ownedGeometry.push(stitchGeometry);
  ownedMaterials.push(stitchMaterial);
  group.add(new THREE.Line(stitchGeometry, stitchMaterial));
  const capGeometry = new THREE.BoxGeometry(1.4, 0.035, 0.4);
  ownedGeometry.push(capGeometry);
  const cap = new THREE.Mesh(capGeometry, paper);
  cap.position.y = 0.02;
  group.add(cap);
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const printMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    roughness: 0.74,
    bumpMap: fibre,
    bumpScale: 0.008,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  ownedMaterials.push(printMaterial);
  const printGeometry = new THREE.PlaneGeometry(1.26, 1.84, 48, 64);
  ownedGeometry.push(printGeometry);
  const pos = printGeometry.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      y = pos.getY(i) + 1.27,
      v = y / 2.5;
    const ratio = Math.min(0.999, Math.pow(Math.abs(x / widthAt(v)), 1 / 0.35));
    pos.setXYZ(
      i,
      x,
      y,
      Math.pow(Math.sqrt(1 - ratio * ratio), 0.55) * depthAt(v) + fold(x, v) + 0.028,
    );
  }
  printGeometry.computeVertexNormals();
  const print = new THREE.Mesh(printGeometry, printMaterial);
  group.add(print);
  let finish: PackFinish = "natural";
  const brand = "YOUR BRAND";
  const targetColor = paper.color.clone();
  function redraw() {
    const ink = finish === "natural" ? "#182c44" : "#dce9f4";
    ctx.clearRect(0, 0, 768, 1024);
    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;
    ctx.textAlign = "center";
    ctx.font = "20px monospace";
    ctx.letterSpacing = "5px";
    ctx.fillText("PRIVATE LABEL", 384, 102);
    ctx.letterSpacing = "0px";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(95, 140);
    ctx.lineTo(673, 140);
    ctx.stroke();
    const words = brand.trim().toUpperCase().split(/\s+/);
    const lines =
      words.length > 1
        ? [
            words.slice(0, Math.ceil(words.length / 2)).join(" "),
            words.slice(Math.ceil(words.length / 2)).join(" "),
          ]
        : words;
    ctx.font = `500 ${Math.min(116, 620 / Math.max(...lines.map((v) => v.length)) / 0.65)}px sans-serif`;
    lines.forEach((line, i) => ctx.fillText(line, 384, 300 + i * 90));
    // Fine botanical engraving, drawn as part of the label rather than an extra image asset.
    ctx.lineWidth = 1.5;
    for (let stem = 0; stem < 5; stem++) {
      const x = 280 + stem * 52,
        top = 500 + Math.abs(2 - stem) * 18;
      ctx.beginPath();
      ctx.moveTo(x, 770);
      ctx.quadraticCurveTo(x - 16, 620, x + 9, top);
      ctx.stroke();
      for (let n = 0; n < 8; n++)
        for (const sign of [-1, 1]) {
          const y = top + n * 22;
          ctx.beginPath();
          ctx.moveTo(x, y + 20);
          ctx.quadraticCurveTo(x + sign * 30, y + 12, x + sign * 22, y - 3);
          ctx.quadraticCurveTo(x + sign * 3, y + 2, x, y + 20);
          ctx.stroke();
        }
    }
    ctx.font = "18px monospace";
    ctx.letterSpacing = "3px";
    ctx.fillText("SELECTED FOR YOU", 384, 852);
    ctx.font = "14px monospace";
    ctx.fillText("SOURCING / PACKAGING / SUPPLY", 384, 910);
    ctx.letterSpacing = "0px";
    texture.needsUpdate = true;
  }
  redraw();
  return {
    group,
    body,
    setFinish(next: PackFinish, immediate = false) {
      finish = next;
      targetColor.setHex(next === "natural" ? 0xc2b6a1 : next === "midnight" ? 0x25364c : 0x235ba1);
      if (immediate) {
        paper.color.copy(targetColor);
        seamMat.color.copy(targetColor).multiplyScalar(0.7);
      }
      redraw();
    },
    update(dt: number, reduced: boolean) {
      paper.color.lerp(targetColor, reduced ? 1 : 1 - Math.exp(-dt * 9));
      seamMat.color.copy(paper.color).multiplyScalar(0.7);
    },
    dispose() {
      ownedGeometry.forEach((g) => g.dispose());
      ownedMaterials.forEach((m) => m.dispose());
      texture.dispose();
      fibre.dispose();
    },
  };
}
