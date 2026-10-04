import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createPalaceStream } from "./palaceStream";
import type { HallScene, HallOptions } from "./types";

/** An original masonry nave: paired columns, moulded piers, deep arches and a distant lit door. */
export function createPalaceScene(mount: HTMLElement, options: HallOptions): HallScene {
  const small = matchMedia("(width < 48rem)").matches;
  let disposed = false,
    visible = true,
    reduced = options.reduced;
  let frame = 0,
    previous = 0,
    time = 0,
    target = 0,
    progress = 0,
    doorTarget = 0,
    door = 0;
  let loaded = false;
  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.25 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.domElement.setAttribute("aria-hidden", "true");
  mount.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a111c);
  scene.fog = new THREE.FogExp2(0x182735, 0.017);
  const camera = new THREE.PerspectiveCamera(small ? 64 : 54, 1, 0.1, 100);
  const geometrySet = new Set<THREE.BufferGeometry>();
  const materialSet = new Set<THREE.Material>();
  const textureSet = new Set<THREE.Texture>();
  const lights: THREE.Light[] = [];
  const own = <T extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(value: T): T => {
    if (value instanceof THREE.BufferGeometry) geometrySet.add(value);
    else if (value instanceof THREE.Material) materialSet.add(value);
    else textureSet.add(value);
    return value;
  };
  const loader = new THREE.TextureLoader();
  const assets: Promise<unknown>[] = [];
  const texture = (name: string) => {
    let settled = () => {};
    assets.push(
      new Promise<void>((resolve) => {
        settled = resolve;
      }),
    );
    const map = own(
      loader.load(
        `/textures/palace/${name}.webp`,
        (loaded) => {
          if (disposed) loaded.dispose();
          settled();
        },
        undefined,
        settled,
      ),
    );
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return map;
  };
  const masonry = texture("weathered-masonry");
  const limestone = texture("aged-limestone");
  const floorMap = texture("worn-floor");
  const woodMap = texture("crate-oak");
  const stone = (map: THREE.Texture, color: number, bump = 0.035, roughness = 0.85) =>
    own(
      new THREE.MeshStandardMaterial({
        map,
        bumpMap: map,
        bumpScale: bump,
        color,
        roughness,
        envMapIntensity: 0.2,
      }),
    );
  const outer = stone(masonry, 0x747875, 0.065);
  const walls = stone(masonry, 0xa8adb1, 0.055);
  const pale = stone(limestone, 0xb1aaa0, 0.028);
  const trim = stone(limestone, 0x969a9b, 0.025);
  const dark = stone(limestone, 0x555e67, 0.032);
  const floor = stone(floorMap, 0x969d9f, 0.025, 0.48);
  const bronze = own(
    new THREE.MeshStandardMaterial({ color: 0x303f4b, metalness: 0.72, roughness: 0.44 }),
  );
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.08);
  room.dispose();
  pmrem.dispose();
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.12;
  scene.add(new THREE.HemisphereLight(0xb8cee5, 0x171923, 0.48));
  const sun = new THREE.DirectionalLight(0xc2d4e7, 1.8);
  sun.position.set(-12, 23, -7);
  sun.target.position.set(1, 0, -22);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(small ? 1024 : 2048);
  Object.assign(sun.shadow.camera, {
    left: -18,
    right: 18,
    top: 31,
    bottom: -31,
    near: 1,
    far: 80,
  });
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.055;
  sun.shadow.radius = 2;
  scene.add(sun, sun.target);
  lights.push(sun);
  const lantern = new THREE.PointLight(0x9bbce6, 7, 12, 2);
  scene.add(lantern);
  lights.push(lantern);
  for (const [x, z, tint] of [
    [-6.8, -12, 0xe9e3d5],
    [6.8, -29, 0x9ebfef],
  ] as const) {
    const light = new THREE.SpotLight(tint, 1450, 38, 0.45, 0.75, 2);
    light.position.set(x, 16, z);
    light.target.position.set(-x * 0.15, 0, z - 7);
    scene.add(light, light.target);
    lights.push(light);
  }

  // Collect reusable pieces; static architecture is merged by material before upload.
  const queue = new Map<
    string,
    { geometry: THREE.BufferGeometry; material: THREE.Material; matrices: THREE.Matrix4[] }
  >();
  const shapes = new Map<string, THREE.BufferGeometry>();
  const position = new THREE.Vector3(),
    rotation = new THREE.Quaternion(),
    scale = new THREE.Vector3(1, 1, 1);
  const euler = new THREE.Euler();
  const put = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    rx = 0,
    ry = 0,
    rz = 0,
  ) => {
    const key = `${geometry.uuid}:${material.uuid}`;
    let batch = queue.get(key);
    if (!batch) {
      batch = { geometry, material, matrices: [] };
      queue.set(key, batch);
    }
    batch.matrices.push(
      new THREE.Matrix4().compose(
        position.set(x, y, z),
        rotation.setFromEuler(euler.set(rx, ry, rz)),
        scale,
      ),
    );
  };
  const box = (w: number, h: number, d: number) => {
    const key = `box:${w}:${h}:${d}`;
    if (shapes.has(key)) return shapes.get(key)!;
    const g = own(new THREE.BoxGeometry(w, h, d));
    const p = g.getAttribute("position"),
      n = g.getAttribute("normal"),
      uv = g.getAttribute("uv");
    for (let i = 0; i < p.count; i++) {
      if (Math.abs(n.getY(i)) > 0.5) uv.setXY(i, p.getX(i) / 2.5, p.getZ(i) / 2.5);
      else if (Math.abs(n.getX(i)) > 0.5) uv.setXY(i, p.getZ(i) / 2.5, p.getY(i) / 2.5);
      else uv.setXY(i, p.getX(i) / 2.5, p.getY(i) / 2.5);
    }
    shapes.set(key, g);
    return g;
  };
  const cylinder = (top: number, bottom: number, height: number) => {
    const key = `column:${top}:${bottom}:${height}`;
    if (shapes.has(key)) return shapes.get(key)!;
    const g = own(new THREE.CylinderGeometry(top, bottom, height, small ? 16 : 28));
    const uv = g.getAttribute("uv");
    for (let i = 0; i < uv.count; i++)
      uv.setXY(i, (uv.getX(i) * Math.PI * (top + bottom)) / 2.5, (uv.getY(i) * height) / 2.5);
    shapes.set(key, g);
    return g;
  };
  const arch = (inner: number, outer: number, depth: number, angle = Math.PI) => {
    const key = `arch:${inner}:${outer}:${depth}:${angle}`;
    if (shapes.has(key)) return shapes.get(key)!;
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outer, 0, angle, false);
    shape.lineTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    shape.absarc(0, 0, inner, angle, 0, true);
    shape.closePath();
    const g = own(
      new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelSize: 0.018,
        bevelThickness: 0.018,
        bevelSegments: 1,
        curveSegments: 32,
      }),
    );
    g.translate(0, 0, -depth / 2);
    const uv = g.getAttribute("uv");
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2.5, uv.getY(i) / 2.5);
    shapes.set(key, g);
    return g;
  };
  const wallWithArch = (
    width: number,
    height: number,
    radius: number,
    spring: number,
    depth: number,
  ) => {
    const shape = new THREE.Shape();
    shape.moveTo(-width, 0);
    shape.lineTo(width, 0);
    shape.lineTo(width, height);
    shape.lineTo(-width, height);
    shape.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-radius, 0);
    hole.lineTo(-radius, spring);
    hole.absarc(0, spring, radius, Math.PI, 0, true);
    hole.lineTo(radius, 0);
    hole.closePath();
    shape.holes.push(hole);
    const g = own(
      new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 32 }),
    );
    g.translate(0, 0, -depth / 2);
    const uv = g.getAttribute("uv");
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2.5, uv.getY(i) / 2.5);
    return g;
  };

  // The foreground tunnel frames the larger, brighter nave.
  put(box(16, 0.25, 68), floor, 0, -0.14, -20);
  for (const side of [-1, 1]) {
    put(box(1.6, 12, 16), outer, side * 4.65, 6, 4);
    for (const [y, d, h] of [
      [0.45, 0.2, 0.9],
      [3.65, 0.33, 0.14],
      [3.9, 0.44, 0.16],
      [4.08, 0.27, 0.08],
    ])
      put(box(d!, h!, 16), dark, side * 3.85, y!, 4);
    put(box(0.8, 18.5, 45), walls, side * 8.1, 9.25, -24.5);
    put(box(3.9, 0.18, 47), dark, side * 6, 0.09, -23);
    // Two shallow stone borders catch the light alongside the processional path.
    put(box(0.11, 0.055, 60), trim, side * 2.05, 0.025, -19);
    put(box(0.065, 0.04, 60), dark, side * 2.19, 0.025, -19);
  }
  put(wallWithArch(8.5, 20, 3.85, 3.9, 1.4), outer, 0, 0, -3);
  put(arch(3.85, 4.32, 1.7), dark, 0, 3.9, -2.8);
  put(arch(4.33, 4.43, 1.78), trim, 0, 3.9, -2.76);
  // Small voussoir joints give the entrance arch real masonry depth.
  const archBlock = arch(3.86, 4.31, 1.75, Math.PI / 26 - 0.007);
  for (let i = 0; i < 26; i++) put(archBlock, outer, 0, 3.9, -2.72, 0, 0, (i * Math.PI) / 26);
  for (const z of [-6, -14, -22, -30, -38]) {
    for (const side of [-1, 1]) {
      const x = side * 4.1;
      // Layered moulded bases, paired shafts, neck rings and broad capitals.
      for (const [w, h, y, d] of [
        [1.95, 0.16, 0.08, 2.1],
        [1.8, 0.18, 0.25, 1.96],
        [1.63, 0.76, 0.72, 1.83],
        [1.86, 0.13, 1.16, 2.02],
        [1.7, 0.12, 1.28, 1.9],
      ])
        put(box(w!, h!, d!), pale, x, y!, z);
      for (const offset of [-0.48, 0.48]) {
        put(cylinder(0.27, 0.34, 3.77), pale, x, 3.235, z + offset);
        for (const [r, h, y] of [
          [0.37, 0.12, 1.44],
          [0.32, 0.09, 1.55],
          [0.29, 0.1, 5.08],
          [0.4, 0.14, 5.2],
        ])
          put(cylinder(r!, r!, h!), trim, x, y!, z + offset);
      }
      for (const [w, h, y, d] of [
        [1.55, 0.14, 5.35, 1.82],
        [1.85, 0.17, 5.51, 2.04],
        [1.65, 0.17, 5.68, 1.87],
        [1.44, 5.2, 8.36, 1.58],
        [1.62, 0.12, 11.02, 1.78],
        [1.8, 0.18, 11.18, 1.96],
        [1.63, 0.2, 11.37, 1.79],
      ])
        put(box(w!, h!, d!), pale, x, y!, z);
      // Recessed panel framed with four thin stone mouldings on the face of every pier.
      for (const offset of [-0.57, 0.57])
        put(box(0.075, 4.72, 0.11), trim, x + offset, 8.38, z + 0.84);
      for (const y of [6.03, 10.72]) put(box(1.21, 0.07, 0.11), trim, x, y, z + 0.84);
      put(box(1.12, 4.62, 0.022), dark, x, 8.38, z + 0.8);
      // Outer pilasters and long aisle entablatures make the room read as architecture.
      put(box(0.34, 12.6, 1.15), pale, side * 7.62, 6.3, z);
      if (z === -6) {
        put(box(0.48, 0.18, 45), trim, side * 7.55, 5.6, -24.5);
        put(box(0.57, 0.2, 45), pale, side * 7.5, 11.4, -24.5);
      }
    }
    put(arch(3.42, 4.12, 1.58), pale, 0, 11.45, z);
    put(arch(3.33, 3.44, 1.73), trim, 0, 11.45, z + 0.015);
    put(arch(4.13, 4.24, 1.71), trim, 0, 11.45, z);
    // A discreet keystone and a barrel-vault rib in the upper shadows.
    put(box(0.42, 0.95, 1.86), pale, 0, 15.19, z);
    put(arch(7.85, 8.1, 0.2), dark, 0, 11.4, z);
  }
  // Side arcades, with deep shadow behind the columns instead of flat bright window stickers.
  const windowMaterials = [-1, 1].map((side) =>
    own(new THREE.MeshBasicMaterial({ color: side < 0 ? 0x718d9d : 0x3c526c, fog: true })),
  );
  const lancetShape = new THREE.Shape();
  lancetShape.moveTo(-0.65, 0);
  lancetShape.lineTo(0.65, 0);
  lancetShape.lineTo(0.65, 3.3);
  lancetShape.quadraticCurveTo(0.6, 4, 0, 4.65);
  lancetShape.quadraticCurveTo(-0.6, 4, -0.65, 3.3);
  lancetShape.closePath();
  const lancet = own(new THREE.ShapeGeometry(lancetShape, 20));
  for (const side of [-1, 1])
    for (const z of [-10, -18, -26, -34, -42]) {
      put(arch(3.25, 3.62, 0.48), trim, side * 4.1, 5.66, z, 0, Math.PI / 2);
      put(box(0.18, 0.22, 7.3), trim, side * 4.1, 9.38, z);
      // A lit lancet set within a dark recess; simple stone mullions break its glow.
      put(box(0.11, 5.2, 1.9), dark, side * 7.62, 8.3, z);
      put(
        lancet,
        windowMaterials[side < 0 ? 0 : 1]!,
        side * 7.55,
        6.2,
        z,
        0,
        (-side * Math.PI) / 2,
      );
      put(box(0.1, 4.45, 0.07), trim, side * 7.48, 8.4, z);
      for (const y of [7.2, 9.05]) put(box(0.1, 0.065, 1.35), trim, side * 7.48, y, z);
    }
  // A ceiling surface closes the nave; the ribs remain visible against it.
  put(box(16.8, 0.5, 45), dark, 0, 19, -24.5);
  const cableMaterial = own(
    new THREE.MeshStandardMaterial({ color: 0x171d22, roughness: 0.72, metalness: 0.4 }),
  );
  for (const [z, y, drop] of [
    [-9, 10.4, 2.8],
    [-20, 12.2, 3.5],
    [-32, 11.8, 2],
  ]) {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-4.2, y!, z!),
      new THREE.Vector3(0.4, y! - drop!, z! - 1.5),
      new THREE.Vector3(4.2, y! + 0.6, z! - 3),
    );
    put(own(new THREE.TubeGeometry(curve, 40, 0.019, 5)), cableMaterial, 0, 0, 0);
  }

  // Wholesale objects live in small, quiet groups in the side aisles.
  const wood = own(
    new THREE.MeshStandardMaterial({
      map: woodMap,
      color: 0xa39c92,
      roughness: 0.92,
      bumpMap: woodMap,
      bumpScale: 0.018,
    }),
  );
  const linen = own(
    new THREE.MeshStandardMaterial({
      color: 0x8a806a,
      roughness: 1,
      bumpMap: limestone,
      bumpScale: 0.018,
    }),
  );
  const band = own(
    new THREE.MeshStandardMaterial({ color: 0x344958, roughness: 0.68, metalness: 0.25 }),
  );
  const crate = (x: number, z: number, y = 0.55) => {
    put(box(1.45, 1.05, 1.1), wood, x, y, z);
    for (const dx of [-0.61, 0.61])
      for (const dz of [-0.58, 0.58]) put(box(0.12, 1.16, 0.09), wood, x + dx, y, z + dz);
    for (const dy of [-0.43, 0.43]) {
      put(box(1.5, 0.12, 0.07), wood, x, y + dy, z + 0.59);
      put(box(1.5, 0.12, 0.07), wood, x, y + dy, z - 0.59);
    }
    for (const dx of [-0.38, 0.38]) put(box(0.045, 1.075, 1.12), band, x + dx, y, z);
    // Plank joints remain shallow and readable in grazing light.
    for (const dy of [-0.26, 0, 0.26]) put(box(1.43, 0.008, 0.015), dark, x, y + dy, z + 0.558);
  };
  const sackGeometry = own(new THREE.SphereGeometry(1, small ? 16 : 24, 16));
  const sackP = sackGeometry.getAttribute("position");
  for (let i = 0; i < sackP.count; i++) {
    const x = sackP.getX(i),
      y = sackP.getY(i),
      z = sackP.getZ(i);
    const pinch = 1 - THREE.MathUtils.smoothstep(y, 0.35, 1) * 0.76;
    sackP.setXYZ(
      i,
      x * 0.4 * pinch * (1 + Math.sin(y * 17 + z * 9) * 0.025),
      Math.max(0.015, (y + 0.82) * 0.66),
      z * 0.3 * pinch,
    );
  }
  sackGeometry.computeVertexNormals();
  for (const [x, z] of [
    [-5.45, -10.5],
    [5.65, -22.5],
    [-5.2, -33.5],
  ]) {
    for (const dx of [-0.6, 0, 0.6]) put(box(0.16, 0.15, 1.5), wood, x! + dx, 0.08, z!);
    for (let i = 0; i < 6; i++) put(box(1.65, 0.07, 0.2), wood, x!, 0.19, z! - 0.63 + i * 0.25);
    crate(x! - 0.2, z! + 0.04, 0.78);
    crate(x! + 0.1, z! + 0.04, 1.88);
    for (let i = 0; i < 3; i++) {
      const sx = x! + 0.95 + (i % 2) * 0.64,
        sz = z! - 0.6 + Math.floor(i / 2) * 0.65;
      put(sackGeometry, linen, sx, 0.06, sz, 0, i * 0.7, (i - 1) * 0.035);
      put(cylinder(0.055, 0.07, 0.14), linen, sx, 1.23, sz);
      put(cylinder(0.07, 0.07, 0.025), band, sx, 1.22, sz);
    }
  }

  // Pale double door, deeply inset in a tall stone surround.
  put(wallWithArch(8.5, 19, 1.45, 3.75, 1), walls, 0, 0, -46);
  put(arch(1.46, 1.78, 0.95), pale, 0, 3.75, -45.6);
  put(arch(1.79, 1.87, 1.06), trim, 0, 3.75, -45.58);
  for (const side of [-1, 1]) {
    put(box(0.32, 3.75, 0.95), pale, side * 1.63, 1.875, -45.6);
    put(box(0.46, 0.18, 1.08), trim, side * 1.63, 0.09, -45.6);
    put(box(0.43, 0.15, 1.07), trim, side * 1.63, 3.65, -45.6);
  }
  const glow = own(
    new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 3.65, 4.2), toneMapped: false }),
  );
  const beyond = new THREE.Mesh(own(new THREE.PlaneGeometry(3.2, 6.1)), glow);
  beyond.position.set(0, 2.75, -46.8);
  scene.add(beyond);
  const transom = new THREE.Mesh(own(new THREE.CircleGeometry(1.43, 40, 0, Math.PI)), glow);
  transom.position.set(0, 3.75, -45.95);
  scene.add(transom);
  const ring = (radius: number, y: number, z: number) =>
    put(arch(radius - 0.025, radius + 0.025, 0.055), bronze, 0, y, z);
  for (const radius of [0.4, 0.78, 1.2, 1.42]) ring(radius, 3.75, -45.84);
  for (let i = 1; i < 8; i++) {
    const angle = (Math.PI * i) / 8;
    put(
      box(1.1, 0.025, 0.065),
      bronze,
      Math.cos(angle) * 0.88,
      3.75 + Math.sin(angle) * 0.88,
      -45.82,
      0,
      0,
      angle,
    );
  }
  const leaves = [-1, 1].map((side) => {
    const hinge = new THREE.Group();
    hinge.position.set(side * 1.43, 0, -45.9);
    scene.add(hinge);
    const glass = new THREE.Mesh(
      own(new THREE.BoxGeometry(1.4, 3.7, 0.09)),
      own(
        new THREE.MeshStandardMaterial({
          color: 0x394b57,
          metalness: 0.55,
          roughness: 0.4,
          emissive: 0x24303a,
          emissiveIntensity: 0.5,
        }),
      ),
    );
    glass.position.set(-side * 0.7, 1.85, 0);
    glass.castShadow = true;
    hinge.add(glass);
    for (const dx of [-0.59, 0.59]) {
      const stile = new THREE.Mesh(box(0.055, 3.6, 0.06), bronze);
      stile.position.set(-side * 0.7 + dx, 1.85, 0.07);
      hinge.add(stile);
    }
    for (const y of [0.35, 1.65, 3.3]) {
      const rail = new THREE.Mesh(box(1.3, 0.045, 0.07), bronze);
      rail.position.set(-side * 0.7, y, 0.075);
      hinge.add(rail);
    }
    return { hinge, side };
  });
  const doorLight = new THREE.PointLight(0xc8d9ef, 160, 24, 2);
  doorLight.position.set(0, 3.4, -44.8);
  scene.add(doorLight);
  lights.push(doorLight);
  const floorLight = new THREE.SpotLight(0xdce9ff, 140, 18, 0.5, 0.8, 2);
  floorLight.position.set(0, 5, -44.2);
  floorLight.target.position.set(0, 0, -41.3);
  scene.add(floorLight, floorLight.target);
  lights.push(floorLight);
  const staticBatches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  for (const batch of queue.values()) {
    const pieces = staticBatches.get(batch.material) ?? [];
    for (const matrix of batch.matrices) {
      const piece = batch.geometry.index ? batch.geometry.toNonIndexed() : batch.geometry.clone();
      pieces.push(piece.applyMatrix4(matrix));
    }
    staticBatches.set(batch.material, pieces);
  }
  for (const [material, pieces] of staticBatches) {
    const geometry = own(mergeGeometries(pieces)!);
    pieces.forEach((piece) => piece.dispose());
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  staticBatches.clear();
  queue.clear();
  shapes.clear();
  // Keep only the final static batches and the separate moving door geometry.
  const retainedGeometry = new Set<THREE.BufferGeometry>();
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) retainedGeometry.add(object.geometry);
  });
  for (const geometry of geometrySet) {
    if (!retainedGeometry.has(geometry)) {
      geometry.dispose();
      geometrySet.delete(geometry);
    }
  }

  const stream = createPalaceStream(small);
  scene.add(stream.group);
  // Broad, faint shafts carry the window light through the air; depth testing keeps them behind stone.
  const shaftMaterial = own(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vUv;varying float vDistance;void main(){vUv=uv;vec4 p=modelViewMatrix*vec4(position,1.);vDistance=-p.z;gl_Position=projectionMatrix*p;}`,
      fragmentShader: `varying vec2 vUv;varying float vDistance;void main(){float a=exp(-pow((vUv.x-.5)*4.,2.))*smoothstep(0.,.12,vUv.y)*(1.-smoothstep(.8,1.,vUv.y))*.028*exp(-vDistance*.012);gl_FragColor=vec4(.7,.83,1.,a);}`,
    }),
  );
  const shafts = [-11, -28, -42].map((z, i) => {
    const mesh = new THREE.Mesh(
      own(new THREE.PlaneGeometry(i === 2 ? 2.2 : 3.6, 15)),
      shaftMaterial,
    );
    mesh.position.set(i === 1 ? 1.4 : -0.8, 8, z);
    scene.add(mesh);
    return mesh;
  });

  // A single light post pass gives depth and a restrained bloom to the fine electric paths.
  const targetBuffer = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples: small ? 0 : 2,
    depthTexture: new THREE.DepthTexture(1, 1),
  });
  const postUniforms = {
    color: { value: targetBuffer.texture },
    depth: { value: targetBuffer.depthTexture },
    resolution: { value: new THREE.Vector2(1, 1) },
    nearClip: { value: 0.1 },
    farClip: { value: 100 },
  };
  const postMaterial = new THREE.ShaderMaterial({
    uniforms: postUniforms,
    depthTest: false,
    depthWrite: false,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: `
      #include <common>
      #include <packing>
      uniform sampler2D color,depth;uniform vec2 resolution;uniform float nearClip,farClip;varying vec2 vUv;
      void main(){
        float distance=-perspectiveDepthToViewZ(texture2D(depth,vUv).x,nearClip,farClip);
        float blur=smoothstep(21.,60.,distance)*1.4;
        vec2 pixel=1./resolution; vec3 base=texture2D(color,vUv).rgb;
        vec3 soft=base*4.,bloom=vec3(0.);
        for(int i=0;i<8;i++){float a=float(i)*.785398;vec2 dir=vec2(cos(a),sin(a));
          soft+=texture2D(color,vUv+dir*pixel*blur).rgb;
          bloom+=max(vec3(0.),texture2D(color,vUv+dir*pixel*4.).rgb-vec3(1.15));
        }
        vec3 c=soft/12.+bloom*.033;
        vec2 p=(vUv-.5)*vec2(1.,.85); c*=1.-smoothstep(.23,.74,length(p))*.38;
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const post = new FullScreenQuad(postMaterial);
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.1, 1.78, 6),
    new THREE.Vector3(-0.1, 1.78, -4),
    new THREE.Vector3(0.25, 1.78, -13),
    new THREE.Vector3(-0.25, 1.78, -25),
    new THREE.Vector3(0.12, 1.78, -34),
    new THREE.Vector3(0, 1.78, -41.2),
  ]);
  const eye = new THREE.Vector3(),
    look = new THREE.Vector3();
  const pointer = new THREE.Vector2(),
    smoothed = new THREE.Vector2();
  function place() {
    path.getPointAt(progress, eye);
    path.getPointAt(Math.min(1, progress + 0.13), look);
    look.y = 2.6 + Math.sin(progress * Math.PI) * 0.75;
    if (progress > 0.88) look.set(0, 2.45, -46.8);
    eye.z -= door * door * 3.6;
    camera.position.copy(eye);
    camera.lookAt(look);
    camera.rotateY(-smoothed.x * 0.055);
    camera.rotateX(-smoothed.y * 0.038);
    lantern.position.set(eye.x, eye.y + 0.6, eye.z - 0.6);
    for (const shaft of shafts) {
      shaft.rotation.y = camera.rotation.y;
      shaft.rotation.z = -0.11;
    }
  }
  function render(now: number) {
    frame = 0;
    if (disposed || !loaded || !visible || document.hidden) return;
    const moving = Math.abs(target - progress) > 0.0001 || Math.abs(doorTarget - door) > 0.0001;
    if (!reduced && previous && now - previous < (moving ? 16 : 33) - 1) {
      wake();
      return;
    }
    const dt = Math.min((now - (previous || now)) / 1000, 0.05);
    previous = now;
    if (!reduced) time += dt;
    progress = reduced ? target : THREE.MathUtils.damp(progress, target, 4.8, dt);
    door = reduced ? doorTarget : THREE.MathUtils.damp(door, doorTarget, 5, dt);
    smoothed.lerp(pointer, reduced ? 1 : 1 - Math.exp(-dt * 3));
    place();
    stream.update(time);
    for (const { hinge, side } of leaves) hinge.rotation.y = side * door * 1.5;
    doorLight.intensity = 160 + door * 190;
    renderer.setRenderTarget(targetBuffer);
    renderer.render(scene, camera);
    const calls = renderer.info.render.calls;
    renderer.setRenderTarget(null);
    post.render(renderer);
    mount.dataset.progress = progress.toFixed(4);
    mount.dataset.door = door.toFixed(4);
    mount.dataset.calls = String(calls + renderer.info.render.calls);
    mount.dataset.textures = String(renderer.info.memory.textures);
    mount.dataset.geometries = String(renderer.info.memory.geometries);
    mount.dataset.frames = String(Number(mount.dataset.frames || 0) + 1);
    if (!reduced || moving) wake();
  }
  function wake() {
    if (!frame && loaded && !disposed && visible && !document.hidden)
      frame = requestAnimationFrame(render);
  }
  function resize() {
    const width = mount.clientWidth,
      height = mount.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const canvas = renderer.domElement;
    targetBuffer.setSize(canvas.width, canvas.height);
    postUniforms.resolution.value.set(canvas.width, canvas.height);
    stream.resize(canvas.width, canvas.height, renderer.getPixelRatio());
    wake();
  }
  function move(event: PointerEvent) {
    if (reduced || event.pointerType !== "mouse") return;
    pointer.set((event.clientX / innerWidth) * 2 - 1, (event.clientY / innerHeight) * 2 - 1);
    wake();
  }
  function leave() {
    pointer.set(0, 0);
    wake();
  }
  function visibility() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    wake();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(mount);
  const observer = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting;
    visibility();
  });
  observer.observe(mount);
  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("blur", leave);
  document.addEventListener("visibilitychange", visibility);
  const lost = (event: Event) => {
    event.preventDefault();
    if (!disposed) {
      loaded = false;
      cancelAnimationFrame(frame);
      frame = 0;
      options.onError();
    }
  };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  resize();
  place();
  void Promise.all(assets)
    .then(async () => {
      if (disposed) return;
      renderer.shadowMap.needsUpdate = true;
      await renderer.compileAsync(scene, camera);
      if (disposed) return;
      loaded = true;
      render(performance.now());
      options.onReady();
      wake();
    })
    .catch(() => {
      if (!disposed) options.onError();
    });
  return {
    setProgress(value) {
      target = THREE.MathUtils.clamp(value, 0, 1);
      wake();
    },
    setDoor(value) {
      doorTarget = THREE.MathUtils.clamp(value, 0, 1);
      wake();
    },
    setReducedMotion(value) {
      reduced = value;
      if (value) pointer.set(0, 0);
      wake();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      observer.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", leave);
      document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      geometrySet.forEach((g) => g.dispose());
      materialSet.forEach((m) => m.dispose());
      textureSet.forEach((t) => t.dispose());
      stream.dispose();
      lights.forEach((light) => {
        if (
          light instanceof THREE.DirectionalLight ||
          light instanceof THREE.SpotLight ||
          light instanceof THREE.PointLight
        )
          light.shadow?.dispose();
      });
      environment.dispose();
      targetBuffer.depthTexture?.dispose();
      targetBuffer.dispose();
      postMaterial.dispose();
      post.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
