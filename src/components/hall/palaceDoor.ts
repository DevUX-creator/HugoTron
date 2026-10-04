import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/** The same recessed, fan-lit doorway viewed from either side of the palace. */
export function createPalaceDoor(materials: {
  walls: THREE.Material;
  pale: THREE.Material;
  trim: THREE.Material;
  bronze: THREE.Material;
}) {
  const group = new THREE.Group();
  const geometry = new Set<THREE.BufferGeometry>();
  const ownedMaterials: THREE.Material[] = [];
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const own = <T extends THREE.BufferGeometry>(g: T) => {
    geometry.add(g);
    return g;
  };
  function uv(g: THREE.BufferGeometry) {
    const p = g.getAttribute("position"),
      n = g.getAttribute("normal"),
      t = g.getAttribute("uv");
    for (let i = 0; i < p.count; i++) {
      if (Math.abs(n.getY(i)) > 0.5) t.setXY(i, p.getX(i) / 2.5, p.getZ(i) / 2.5);
      else if (Math.abs(n.getX(i)) > 0.5) t.setXY(i, p.getZ(i) / 2.5, p.getY(i) / 2.5);
      else t.setXY(i, p.getX(i) / 2.5, p.getY(i) / 2.5);
    }
    return g;
  }
  function add(
    g: THREE.BufferGeometry,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
    angle = 0,
  ) {
    g.rotateZ(angle).translate(x, y, z);
    const pieces = batches.get(mat) ?? [];
    pieces.push(g.index ? g.toNonIndexed() : g);
    if (g.index) g.dispose();
    batches.set(mat, pieces);
  }
  function arch(inner: number, outer: number, depth: number) {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outer, 0, Math.PI, false);
    shape.lineTo(-inner, 0);
    shape.absarc(0, 0, inner, Math.PI, 0, true);
    shape.closePath();
    return uv(
      new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelSize: 0.018,
        bevelThickness: 0.018,
        bevelSegments: 1,
        curveSegments: 32,
      }).translate(0, 0, -depth / 2),
    );
  }
  const box = (w: number, h: number, d: number) => uv(new THREE.BoxGeometry(w, h, d));
  const wall = new THREE.Shape();
  wall.moveTo(-8.5, 0);
  wall.lineTo(8.5, 0);
  wall.lineTo(8.5, 19);
  wall.lineTo(-8.5, 19);
  wall.closePath();
  const opening = new THREE.Path();
  opening.moveTo(-1.45, 0);
  opening.lineTo(-1.45, 3.75);
  opening.absarc(0, 3.75, 1.45, Math.PI, 0, true);
  opening.lineTo(1.45, 0);
  opening.closePath();
  wall.holes.push(opening);
  add(
    uv(
      new THREE.ExtrudeGeometry(wall, {
        depth: 1,
        bevelEnabled: false,
        curveSegments: 32,
      }).translate(0, 0, -0.5),
    ),
    materials.walls,
    0,
    0,
    -0.1,
  );
  add(arch(1.46, 1.78, 0.95), materials.pale, 0, 3.75, 0.3);
  add(arch(1.79, 1.87, 1.06), materials.trim, 0, 3.75, 0.32);
  for (const side of [-1, 1]) {
    add(box(0.32, 3.75, 0.95), materials.pale, side * 1.63, 1.875, 0.3);
    add(box(0.46, 0.18, 1.08), materials.trim, side * 1.63, 0.09, 0.3);
    add(box(0.43, 0.15, 1.07), materials.trim, side * 1.63, 3.65, 0.3);
  }
  for (const radius of [0.4, 0.78, 1.2, 1.42])
    add(arch(radius - 0.025, radius + 0.025, 0.055), materials.bronze, 0, 3.75, 0.06);
  for (let i = 1; i < 8; i++) {
    const angle = (i * Math.PI) / 8;
    add(
      box(1.1, 0.025, 0.065),
      materials.bronze,
      Math.cos(angle) * 0.88,
      3.75 + Math.sin(angle) * 0.88,
      0.08,
      angle,
    );
  }
  for (const [material, pieces] of batches) {
    const mesh = new THREE.Mesh(own(mergeGeometries(pieces, false)!), material);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    pieces.forEach((g) => g.dispose());
  }
  const darkness = new THREE.MeshBasicMaterial({ color: 0x050c17 });
  const glow = new THREE.MeshBasicMaterial({
    color: new THREE.Color(3.2, 3.65, 4.2),
    toneMapped: false,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x394b57,
    metalness: 0.55,
    roughness: 0.4,
    emissive: 0x24303a,
    emissiveIntensity: 0.5,
  });
  ownedMaterials.push(darkness, glow, glass);
  const beyond = new THREE.Mesh(own(new THREE.PlaneGeometry(3.2, 6.1)), darkness);
  beyond.position.set(0, 2.75, -0.9);
  group.add(beyond);
  const transom = new THREE.Mesh(own(new THREE.CircleGeometry(1.43, 40, 0, Math.PI)), glow);
  transom.position.set(0, 3.75, -0.05);
  group.add(transom);
  const panelGeometry = own(new THREE.BoxGeometry(1.4, 3.7, 0.09));
  const stileGeometry = own(box(0.055, 3.6, 0.06));
  const railGeometry = own(box(1.3, 0.045, 0.07));
  const leaves = [-1, 1].map((side) => {
    const hinge = new THREE.Group();
    hinge.position.set(side * 1.43, 0, 0);
    group.add(hinge);
    const panel = new THREE.Mesh(panelGeometry, glass);
    panel.position.set(-side * 0.7, 1.85, 0);
    panel.castShadow = true;
    hinge.add(panel);
    for (const dx of [-0.59, 0.59]) {
      const stile = new THREE.Mesh(stileGeometry, materials.bronze);
      stile.position.set(-side * 0.7 + dx, 1.85, 0.07);
      hinge.add(stile);
    }
    for (const y of [0.35, 1.65, 3.3]) {
      const rail = new THREE.Mesh(railGeometry, materials.bronze);
      rail.position.set(-side * 0.7, y, 0.075);
      hinge.add(rail);
    }
    return { hinge, side };
  });
  return {
    group,
    leaves,
    dispose() {
      geometry.forEach((g) => g.dispose());
      ownedMaterials.forEach((m) => m.dispose());
    },
  };
}
