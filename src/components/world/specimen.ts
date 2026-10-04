import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { grainGeometry } from "@/components/rice/grain";
import { bowlOutline, riceSurface } from "@/components/rice/motion";
import {
  ceramicFootGeometry,
  ceramicGeometry,
  ceramicMaps,
  riceBed,
  riceMaps,
} from "@/components/rice/vessel";

export type SpecimenId = "rice" | "pistachios" | "tea" | "saffron" | "pulses" | "grains";
/** Every ingredient this module can serve; `spices` appears on the category pages only. */
export type IngredientId = SpecimenId | "spices";

type Colour = [number, number, number];
type Sample = { point: [number, number, number]; colour: Colour };

function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

/** Smooth 3D value noise, used to keep natural surfaces from reading as perfect primitives. */
function noise(x: number, y: number, z: number) {
  const hash = (a: number, b: number, c: number) => {
    const n = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const w = fz * fz * (3 - 2 * fz);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const corner = (dx: number, dy: number, dz: number) => hash(ix + dx, iy + dy, iz + dz);
  return lerp(
    lerp(lerp(corner(0, 0, 0), corner(1, 0, 0), u), lerp(corner(0, 1, 0), corner(1, 1, 0), u), v),
    lerp(lerp(corner(0, 0, 1), corner(1, 0, 1), u), lerp(corner(0, 1, 1), corner(1, 1, 1), u), v),
    w,
  );
}

function mix(a: Colour, b: Colour, t: number): Colour {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** A rows × sides surface; t runs along the body and angle around it. */
function surface(rows: number, sides: number, at: (t: number, angle: number) => Sample, arc = 1) {
  const positions: number[] = [];
  const colours: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row++) {
    for (let side = 0; side <= sides; side++) {
      const sample = at(row / rows, (side / sides) * Math.PI * 2 * arc);
      positions.push(...sample.point);
      colours.push(...sample.colour);
      if (row < rows && side < sides) {
        const a = row * (sides + 1) + side;
        const b = a + sides + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colours, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Two thin half shells hinged at the base, parted at the tip around a green kernel. */
function pistachioGeometry() {
  const length = 0.062;
  const shell = (sign: number) => {
    const geometry = surface(
      22,
      14,
      (t, angle) => {
        const profile = Math.pow(Math.sin(t * Math.PI), 0.62) * (1 - (t - 0.5) * 0.18);
        const lumps = 1 + (noise(t * 6, angle * 1.3, sign * 3) - 0.5) * 0.08;
        const x = Math.cos(angle) * 0.041 * profile * lumps;
        const z = sign * Math.abs(Math.sin(angle)) * 0.035 * profile * lumps + sign * 0.0015;
        const y = (t - 0.5) * length * 2;
        // The shell opens from its hinge at the base towards the parted tip.
        const open = sign * 0.3 * t * t;
        const hinge = y + length;
        const suture = Math.pow(1 - Math.abs(Math.sin(angle)), 6);
        const colour = mix(
          [0.8, 0.68, 0.5],
          [0.66, 0.52, 0.36],
          suture * 0.6 + noise(t * 9, angle * 3, sign) * 0.25,
        );
        return {
          point: [
            x,
            hinge * Math.cos(open) - z * Math.sin(open) - length,
            z * Math.cos(open) + hinge * Math.sin(open),
          ],
          colour,
        };
      },
      0.5,
    );
    return geometry;
  };
  const kernel = surface(18, 16, (t, angle) => {
    const profile = Math.pow(Math.sin(t * Math.PI), 0.7);
    const x = Math.cos(angle) * 0.034 * profile;
    const z = Math.sin(angle) * 0.028 * profile;
    const skin = noise(t * 7, Math.cos(angle) * 3, Math.sin(angle) * 3);
    const colour = mix([0.42, 0.6, 0.18], [0.46, 0.2, 0.24], Math.max(0, skin - 0.45) * 1.8);
    return { point: [x, (t - 0.5) * length * 1.75 + 0.004, z], colour };
  });
  const parts = [shell(1), shell(-1), kernel];
  parts.forEach((part, index) =>
    part.setAttribute(
      "shellSide",
      new THREE.Float32BufferAttribute(
        new Float32Array(part.getAttribute("position").count).fill(
          index === 0 ? 1 : index === 1 ? -1 : 0,
        ),
        1,
      ),
    ),
  );
  const geometry = mergeGeometries(parts, false)!;
  parts.forEach((part) => part.dispose());
  return geometry;
}

/** A rolled black-tea leaf: a tapered sheet curled into a loose spiral and twisted along its length. */
function teaGeometry() {
  const length = 0.13;
  return surface(
    28,
    18,
    (t, angle) => {
      const taper = Math.pow(Math.sin(Math.PI * Math.min(0.98, Math.max(0.02, t))), 0.55);
      const spiral = 0.0035 + (angle / (Math.PI * 1.6)) * 0.0075;
      const twist = t * Math.PI * 1.3;
      const cx = Math.cos(angle) * spiral * taper;
      const cz = Math.sin(angle) * spiral * taper;
      const x = cx * Math.cos(twist) - cz * Math.sin(twist) + Math.sin(t * Math.PI) * 0.012;
      const z = cx * Math.sin(twist) + cz * Math.cos(twist);
      const vein = noise(t * 14, angle * 2, 1);
      return {
        point: [x, (t - 0.5) * length, z],
        colour: mix([0.075, 0.05, 0.035], [0.2, 0.13, 0.07], vein * 0.8),
      };
    },
    0.8,
  );
}

/** A saffron stigma: a fine, gently curved thread that flares into an open trumpet. */
function saffronGeometry() {
  const length = 0.19;
  return surface(40, 10, (t, angle) => {
    const radius = 0.0024 + 0.011 * Math.pow(t, 5);
    const bend = Math.sin(t * 2.4) * 0.024;
    // The trumpet rim is slightly ragged, as the dried stigma is.
    const frill = 1 + Math.pow(t, 8) * Math.sin(angle * 5) * 0.18;
    const x = Math.cos(angle) * radius * frill + bend;
    const z = Math.sin(angle) * radius * frill + Math.sin(t * 3.1) * 0.008;
    const style = 1 - Math.min(1, t / 0.12);
    const colour = mix(
      mix([0.55, 0.035, 0.03], [0.82, 0.12, 0.05], Math.pow(t, 3)),
      [0.95, 0.66, 0.2],
      style,
    );
    return { point: [x, (t - 0.5) * length, z], colour };
  });
}

/** A chickpea: a lumpy sphere with its characteristic beak and a shallow seam. */
function chickpeaGeometry() {
  return surface(24, 28, (t, angle) => {
    const polar = t * Math.PI;
    const nx = Math.sin(polar) * Math.cos(angle);
    const ny = Math.cos(polar);
    const nz = Math.sin(polar) * Math.sin(angle);
    const beak = Math.pow(Math.max(0, nx * 0.8 + ny * 0.6), 9);
    const seam = Math.exp(-(nz * nz) * 60) * Math.max(0, nx) * 0.05;
    const lumps = (noise(nx * 2.2 + 5, ny * 2.2, nz * 2.2) - 0.5) * 0.07;
    const radius = 0.038 * (1 + lumps + beak * 0.42 - seam);
    return {
      point: [nx * radius, ny * radius * 0.94, nz * radius],
      colour: mix(
        mix([0.86, 0.68, 0.42], [0.76, 0.57, 0.34], lumps * 6 + 0.5),
        [0.58, 0.4, 0.24],
        beak,
      ),
    };
  });
}

/** A wheat kernel: a plump oval with a deep ventral crease and a darker germ end. */
function wheatGeometry() {
  const length = 0.078;
  return surface(24, 22, (t, angle) => {
    const profile = Math.pow(Math.sin(t * Math.PI), 0.6) * (1 + (t - 0.5) * 0.12);
    const crease = 1 - 0.38 * Math.exp(-Math.pow((angle - Math.PI * 1.5) / 0.32, 2));
    const x = Math.cos(angle) * 0.022 * profile * crease;
    const z = Math.sin(angle) * 0.02 * profile * crease;
    const germ = Math.pow(Math.max(0, 1 - t / 0.2), 2);
    const colour = mix(
      mix([0.8, 0.54, 0.27], [0.7, 0.44, 0.2], noise(t * 8, angle, 2)),
      [0.52, 0.3, 0.14],
      germ,
    );
    return { point: [x, (t - 0.5) * length, z], colour };
  });
}

/** A green cardamom pod: a plump three-ridged spindle with fine lengthwise ribs. */
function cardamomGeometry() {
  const length = 0.07;
  return surface(26, 30, (t, angle) => {
    const profile = Math.pow(Math.sin(t * Math.PI), 0.55) * (1 - Math.pow(t, 6) * 0.4);
    // Three soft lobes and many fine ribs.
    const lobes = 1 + Math.cos(angle * 3) * 0.1 + Math.cos(angle * 18) * 0.025;
    const x = Math.cos(angle) * 0.019 * profile * lobes;
    const z = Math.sin(angle) * 0.019 * profile * lobes;
    const tip = Math.pow(Math.max(0, (t - 0.85) / 0.15), 2);
    const colour = mix(
      mix([0.55, 0.62, 0.36], [0.43, 0.5, 0.27], noise(t * 7, angle * 2, 4)),
      [0.36, 0.33, 0.2],
      tip,
    );
    return { point: [x, (t - 0.5) * length, z], colour };
  });
}

/** World units per unit of the rice page's dish, so the dish spans about the cube's width. */
const DISH = 0.3;

/** The rice page's kernel, at the rice page's scale, served in the rice page's dish. */
const RICE = { heap: 3000, ring: 70, depth: 0.13 };

type CloudRecipe = {
  geometry: () => THREE.BufferGeometry;
  count: number;
  material: THREE.MeshPhysicalMaterialParameters;
};

/** Every other ingredient floats as one hero piece ringed by a tilted orbit. */
const CLOUDS: Record<Exclude<IngredientId, "rice">, CloudRecipe> = {
  pistachios: {
    geometry: pistachioGeometry,
    count: 90,
    material: { roughness: 0.5, side: THREE.DoubleSide },
  },
  tea: {
    geometry: teaGeometry,
    count: 150,
    material: { roughness: 0.42, side: THREE.DoubleSide, clearcoat: 0.3, clearcoatRoughness: 0.4 },
  },
  saffron: {
    geometry: saffronGeometry,
    count: 170,
    material: { roughness: 0.45, side: THREE.DoubleSide, sheen: 0.5, sheenColor: 0xff3a1a },
  },
  pulses: { geometry: chickpeaGeometry, count: 120, material: { roughness: 0.58 } },
  grains: {
    geometry: wheatGeometry,
    count: 190,
    material: { roughness: 0.48, clearcoat: 0.12, clearcoatRoughness: 0.4 },
  },
  spices: {
    geometry: cardamomGeometry,
    count: 150,
    material: { roughness: 0.62, sheen: 0.25, sheenColor: 0xd8e2a8 },
  },
};
const RING_RADIUS = 0.56;

type Piece = {
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  scale: number;
  delay: number;
  /** Where a brushing hand has pushed this kernel, eased back to rest. */
  offset: THREE.Vector3;
  /** How high it jumps when the dish is tossed. */
  hop: number;
};

type Orbiter = {
  radius: number;
  angle: number;
  height: number;
  speed: number;
  axis: THREE.Vector3;
  spin: number;
  phase: number;
  scale: number;
  delay: number;
};

type Serving = {
  id: IngredientId;
  /** Only rice is served in a dish; the other ingredients are a floating cloud alone. */
  dish: THREE.Group | null;
  heap: THREE.InstancedMesh | null;
  ring: THREE.InstancedMesh;
  pieces: Piece[];
  orbiters: Orbiter[];
  presence: number;
  target: 0 | 1;
  settled: boolean;
  disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[];
};

/**
 * Ingredients that take the cube's place. Rice is served in the rice page's ceramic dish, its
 * kernels pouring in from above with a few orbiting it; every other ingredient is one large hero
 * piece ringed by a tilted orbit of smaller ones.
 */
export function createSpecimen(small: boolean) {
  const group = new THREE.Group();
  group.name = "Hugo_specimen";
  // A tilted orbital plane for the loose pieces around the dish.
  const orbit = new THREE.Group();
  orbit.rotation.set(0.42, 0, -0.18);
  group.add(orbit);
  // A warm key just above and in front of the dish, where the cube's core was.
  const light = new THREE.PointLight(0xffe0b8, 0, 3, 1.6);
  light.position.set(-0.3, 0.7, 0.7);
  // A soft, cool fill from the courtyard side keeps shadowed faces from going black.
  const fill = new THREE.PointLight(0xdfe6ff, 0, 3, 1.6);
  fill.position.set(0.6, -0.1, 0.8);
  group.add(light, fill);

  const servings = new Map<IngredientId, Serving>();
  let environment: THREE.Texture | null = null;
  const ceramic = ceramicMaps();
  const ceramicMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xb2a499,
    map: ceramic.color,
    bumpMap: ceramic.bump,
    bumpScale: 0.019,
    roughness: 0.52,
    metalness: 0.025,
    clearcoat: 0.12,
    clearcoatRoughness: 0.4,
    envMapIntensity: 0.35,
  });
  const bowlGeometry = ceramicGeometry();
  const footGeometry = ceramicFootGeometry();
  let riceTexture: ReturnType<typeof riceMaps> | null = null;

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const direction = new THREE.Vector3();
  const tint = new THREE.Color();
  let interactive = false;
  let explore = 0;
  let active = false;
  let impulse = 0;
  let touch = 0;
  const cursor = new THREE.Vector2();
  const opening = { value: 0 };
  // Brushing the rice: the pointer's ray meets the top of the heap, in the dish's own space.
  let ray: THREE.Ray | null = null;
  let brushing = 0;
  let disturbed = false;
  const brush = new THREE.Vector2();
  const localRay = new THREE.Ray();
  const inverse = new THREE.Matrix4();
  const heapTop = new THREE.Plane(new THREE.Vector3(0, 1, 0), -riceSurface(0, 0));
  const hit = new THREE.Vector3();
  const goal = new THREE.Vector3();

  /** Kernels part around the hand and pile at the edge of its path, then settle back. */
  function brushRice(serving: Serving, delta: number, time: number, reduced: boolean) {
    const dish = serving.dish!;
    let target = 0;
    if (interactive && !reduced && ray && active) {
      dish.updateWorldMatrix(true, false);
      localRay.copy(ray).applyMatrix4(inverse.copy(dish.matrixWorld).invert());
      // The heap is domed: meet its top first, then settle onto the height under that point.
      heapTop.constant = -riceSurface(0, 0);
      for (let pass = 0; pass < 3 && localRay.intersectPlane(heapTop, hit); pass++) {
        const u = hit.x / 2.4;
        const v = hit.z / 1.2;
        heapTop.constant = -riceSurface(Math.min(1, Math.hypot(u, v)), Math.atan2(v, u));
      }
      if (localRay.intersectPlane(heapTop, hit) && (hit.x / 2.1) ** 2 + (hit.z / 1.25) ** 2 < 1) {
        brush.set(hit.x, hit.z);
        target = 1;
      }
    }
    brushing = THREE.MathUtils.damp(brushing, target, target ? 10 : 3, delta);
    const toss = reduced ? 0 : impulse;
    if (brushing < 0.002 && toss < 0.002 && !disturbed) return;
    let moving = false;
    serving.pieces.forEach((piece, index) => {
      const dx = piece.position.x - brush.x;
      const dz = piece.position.z - brush.y;
      const distance = Math.max(Math.hypot(dx, dz), 0.0001);
      // A furrow about a hand wide: kernels part from its centre and ride up into a ridge.
      const push = Math.exp(-((distance / 0.36) ** 2)) * brushing;
      const rim = Math.exp(-(((distance - 0.5) / 0.16) ** 2)) * brushing;
      goal.set(
        (dx / distance) * push * 0.38,
        rim * 0.11 - push * 0.06 + toss * piece.hop * Math.abs(Math.sin(time * 7 + index)),
        (dz / distance) * push * 0.38,
      );
      piece.offset.lerp(goal, 1 - Math.exp(-delta * (push > 0.05 ? 16 : 5)));
      if (piece.offset.lengthSq() > 1e-8) moving = true;
      position.copy(piece.position).add(piece.offset);
      scale.setScalar(piece.scale);
      serving.heap!.setMatrixAt(index, matrix.compose(position, piece.rotation, scale));
    });
    serving.heap!.instanceMatrix.needsUpdate = true;
    disturbed = moving;
  }

  function riceMaterial() {
    // The rice page's starch texture and kernel material, unchanged.
    riceTexture ??= riceMaps();
    return new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: riceTexture.color,
      bumpMap: riceTexture.bump,
      bumpScale: 0.0007,
      roughness: 0.27,
      metalness: 0,
      ior: 1.43,
      sheen: 0.04,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color(0xffefcf),
      clearcoat: 0.12,
      clearcoatRoughness: 0.32,
      specularIntensity: 0.9,
      transmission: 0.1,
      thickness: 0.045,
      attenuationColor: new THREE.Color(0xefcf8e),
      attenuationDistance: 0.4,
      envMap: environment,
      envMapIntensity: 0.32,
    });
  }

  function buildCloud(id: Exclude<IngredientId, "rice">): Serving {
    const recipe = CLOUDS[id];
    const random = seeded(4000 + id.length * 97 + id.charCodeAt(0));
    const geometry = recipe.geometry();
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      vertexColors: true,
      envMap: environment,
      envMapIntensity: 0.25,
      ...recipe.material,
    });
    if (id === "pistachios") {
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uShellOpen = opening;
        shader.vertexShader = `attribute float shellSide;\nuniform float uShellOpen;\n${shader.vertexShader}`;
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          `
          #include <begin_vertex>
          float hingeAngle = shellSide * uShellOpen * 0.72;
          float cs = cos(hingeAngle), sn = sin(hingeAngle);
          vec2 shellPosition = vec2(transformed.y + 0.062, transformed.z);
          transformed.y = cs * shellPosition.x - sn * shellPosition.y - 0.062;
          transformed.z = sn * shellPosition.x + cs * shellPosition.y;
          if (shellSide == 0.0) transformed.y += uShellOpen * 0.014;
        `,
        );
        shader.vertexShader = shader.vertexShader.replace(
          "#include <beginnormal_vertex>",
          `
          #include <beginnormal_vertex>
          float na = shellSide * uShellOpen * 0.72;
          objectNormal.yz = mat2(cos(na), sin(na), -sin(na), cos(na)) * objectNormal.yz;
        `,
        );
      };
      material.customProgramCacheKey = () => "hugo-pistachio-hinge-v1";
    }
    const count = Math.round(recipe.count * (small ? 0.6 : 1));
    const ring = new THREE.InstancedMesh(geometry, material, count);
    ring.name = `Hugo_specimen_${id}`;
    ring.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    ring.frustumCulled = false;
    ring.visible = false;
    const orbiters: Orbiter[] = [];
    for (let i = 0; i < count; i++) {
      // One large hero piece at the centre; the rest form a banded ring with a sparse halo.
      const hero = i === 0;
      const halo = !hero && random() < 0.18;
      const band = (random() + random() + random()) / 3 - 0.5;
      const radius = hero ? 0 : halo ? 0.3 + random() * 0.5 : RING_RADIUS + band * 0.34;
      orbiters.push({
        radius,
        angle: random() * Math.PI * 2,
        height: hero ? 0 : halo ? (random() - 0.5) * 0.7 : band * 0.16 + (random() - 0.5) * 0.05,
        speed: hero ? 0.12 : (0.1 + random() * 0.12) / (0.3 + radius),
        axis: new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize(),
        spin: hero ? 0.22 : 0.3 + random() * 0.9,
        phase: random() * Math.PI * 2,
        scale: hero ? 3.6 : (1.3 + random() * 0.6) * (halo ? 0.8 : 1),
        delay: random(),
      });
      ring.setColorAt(i, tint.setScalar(0.86 + random() * 0.2));
    }
    orbit.add(ring);
    const serving: Serving = {
      id,
      dish: null,
      heap: null,
      ring,
      pieces: [],
      orbiters,
      presence: 0,
      target: 0,
      settled: false,
      disposables: [geometry, material],
    };
    servings.set(id, serving);
    return serving;
  }

  function buildRice(): Serving {
    const id = "rice";
    const random = seeded(4000 + id.length * 97 + id.charCodeAt(0));
    const geometry = grainGeometry().scale(DISH, DISH, DISH);
    const material = riceMaterial();
    const dish = new THREE.Group();
    dish.name = `Hugo_dish_${id}`;
    dish.visible = false;
    const bowl = new THREE.Mesh(bowlGeometry, ceramicMaterial);
    const foot = new THREE.Mesh(footGeometry, ceramicMaterial);
    foot.scale.set(1.5, 1, 0.85);
    const bed = riceBed();
    dish.add(bowl, foot, bed);

    const heapCount = Math.round(RICE.heap * (small ? 0.55 : 1));
    const heap = new THREE.InstancedMesh(geometry, material, heapCount);
    heap.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    heap.frustumCulled = false;
    const pieces: Piece[] = [];
    for (let i = 0; i < heapCount; i++) {
      // As on the rice page: kernels lie mostly flat across a domed surface, deeper ones below.
      const radius = Math.sqrt(random()) * 0.8;
      const angle = random() * Math.PI * 2;
      const outline = bowlOutline(angle, radius);
      const layer = random();
      const depth = -Math.pow(layer, 0.6) * RICE.depth + (random() - 0.5) * 0.02;
      const yaw = random() * Math.PI * 2;
      direction.set(Math.cos(yaw), (random() - 0.5) * 0.6, Math.sin(yaw)).normalize();
      const rotation = new THREE.Quaternion().setFromUnitVectors(up, direction);
      rotation.multiply(quaternion.setFromAxisAngle(up, random() * Math.PI * 2));
      pieces.push({
        position: new THREE.Vector3(outline.x, riceSurface(radius, angle) + depth, outline.z),
        rotation,
        scale: (0.9 + random() * 0.22) / DISH,
        // Deeper pieces land first, so the heap builds up from the bottom of the dish.
        delay: layer * 0.55 + random() * 0.45,
        offset: new THREE.Vector3(),
        hop: (0.1 + random() * 0.26) * (1 - layer * 0.6),
      });
      tint.setRGB(1, 0.95 + random() * 0.04, 0.82 + random() * 0.12, THREE.SRGBColorSpace);
      tint.multiplyScalar(0.66 + random() * 0.28);
      heap.setColorAt(i, tint);
    }
    dish.add(heap);

    const ringCount = Math.round(RICE.ring * (small ? 0.6 : 1));
    const ring = new THREE.InstancedMesh(geometry, material, ringCount);
    ring.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    ring.frustumCulled = false;
    ring.visible = false;
    const orbiters: Orbiter[] = [];
    for (let i = 0; i < ringCount; i++) {
      const band = (random() + random() + random()) / 3 - 0.5;
      orbiters.push({
        radius: 1.08 + band * 0.34,
        angle: random() * Math.PI * 2,
        height: band * 0.14 + (random() - 0.5) * 0.08,
        speed: 0.1 + random() * 0.08,
        axis: new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize(),
        spin: 0.3 + random() * 0.8,
        phase: random() * Math.PI * 2,
        scale: 1.8 * (0.85 + random() * 0.3),
        delay: random(),
      });
      ring.setColorAt(i, tint.setScalar(0.85 + random() * 0.2));
    }
    group.add(dish);
    orbit.add(ring);
    const serving: Serving = {
      id,
      dish,
      heap,
      ring,
      pieces,
      orbiters,
      presence: 0,
      target: 0,
      settled: false,
      disposables: [
        geometry,
        material,
        bed.geometry,
        bed.material as THREE.Material,
        (bed.material as THREE.MeshStandardMaterial).map!,
      ],
    };
    servings.set(id, serving);
    return serving;
  }

  function easeOutBack(t: number) {
    const c = 1.5;
    return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
  }

  function pour(serving: Serving) {
    serving.pieces.forEach((piece, index) => {
      const local = THREE.MathUtils.clamp((serving.presence - piece.delay * 0.55) / 0.45, 0, 1);
      const fall = (1 - local) ** 2;
      position.copy(piece.position);
      position.y += fall * 3.2;
      scale.setScalar(piece.scale * Math.min(1, local * 4));
      serving.heap!.setMatrixAt(index, matrix.compose(position, piece.rotation, scale));
    });
    serving.heap!.instanceMatrix.needsUpdate = true;
  }

  const ALL: readonly SpecimenId[] = ["rice", "pistachios", "tea", "saffron", "pulses", "grains"];
  function build(id: IngredientId) {
    return servings.get(id) ?? (id === "rice" ? buildRice() : buildCloud(id));
  }

  return {
    group,
    get interaction() {
      return touch;
    },
    /** How strongly the rice is being brushed, 0–1 (inspection only). */
    get brushing() {
      return brushing;
    },
    setInteraction(
      progress: number,
      pointer: THREE.Vector2,
      hovering: boolean,
      pointerRay?: THREE.Ray,
    ) {
      interactive = true;
      ray = pointerRay ?? null;
      explore = progress;
      cursor.copy(pointer);
      active = hovering && Math.abs(pointer.x) < 0.6 && Math.abs(pointer.y) < 0.55;
    },
    activate() {
      impulse = 1;
    },
    /**
     * Builds every serving up front, behind the loading screen, so a first selection only has to
     * show objects that already exist rather than paint textures and fill thousands of instances.
     */
    prepare(only?: IngredientId) {
      (only ? [only] : ALL).forEach(build);
      const textures = new Set<THREE.Texture>();
      group.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        for (const value of Object.values(object.material as THREE.Material))
          if (value instanceof THREE.Texture) textures.add(value);
      });
      return [...textures];
    },
    /** Shader compilation only visits visible objects; the scene reveals them for that pass alone. */
    reveal(value: boolean) {
      for (const serving of servings.values()) {
        const shown = value || serving.presence > 0;
        serving.ring.visible = shown;
        if (serving.dish) serving.dish.visible = shown;
      }
    },
    select(id: IngredientId | null) {
      for (const serving of servings.values()) serving.target = serving.id === id ? 1 : 0;
      if (id) build(id).target = 1;
    },
    setEnvironment(texture: THREE.Texture) {
      environment = texture;
      ceramicMaterial.envMap = texture;
      ceramicMaterial.needsUpdate = true;
      for (const serving of servings.values()) {
        const material = serving.ring.material as THREE.MeshPhysicalMaterial;
        material.envMap = texture;
        material.needsUpdate = true;
      }
    },
    /** `wait` holds a new dish back while the cube is still folding away. */
    update(time: number, delta: number, reduced: boolean, wait: boolean) {
      impulse *= Math.exp(-delta * 0.8);
      touch = reduced
        ? 0
        : THREE.MathUtils.damp(touch, Math.max(active ? 1 : 0, impulse), 4, delta);
      opening.value = interactive && !reduced ? touch : 0;
      if (interactive)
        orbit.rotation.set(
          0.42 - explore * 0.25,
          cursor.x * touch * 0.13,
          -0.18 + cursor.y * touch * 0.1,
        );
      let rice = 0;
      let cloud = 0;
      for (const serving of servings.values()) {
        const entering = serving.target === 1;
        if (entering && wait && serving.presence === 0) continue;
        const before = serving.presence;
        const rate = reduced ? 1 : delta / (entering ? 1.8 : 0.6);
        serving.presence = THREE.MathUtils.clamp(before + (entering ? rate : -rate), 0, 1);
        const presence = serving.presence;
        if (serving.dish) rice = presence;
        else cloud = Math.max(cloud, presence);
        const visible = presence > 0;
        serving.ring.visible = visible;
        if (serving.dish) serving.dish.visible = visible;
        if (!visible) {
          serving.settled = false;
          continue;
        }
        if (serving.dish) {
          // The dish rises in with a small overshoot and sinks away when another is chosen.
          const rise = entering
            ? easeOutBack(Math.min(1, presence * 1.8))
            : THREE.MathUtils.smoothstep(presence, 0, 1);
          serving.dish.scale.setScalar(DISH * Math.max(0.001, rise));
          serving.dish.position.set(0, -0.28 - (1 - rise) * 0.3 + Math.sin(time * 0.6) * 0.012, 0);
          // Its slow sway stops while it is being looked into and brushed.
          const sway = interactive ? 1 - explore : 1;
          serving.dish.rotation.set(0.5, -0.45 + Math.sin(time * 0.18) * 0.3 * sway, 0);
          // Kernels fall in while entering; once settled the heap is static and costs nothing.
          if (entering && (!serving.settled || before !== presence)) {
            pour(serving);
            serving.settled = presence === 1;
          } else if (serving.settled && interactive) brushRice(serving, delta, time, reduced);
        }
        // A floating cloud bursts from its centre in every direction, height included.
        const lift = serving.dish ? 1 : 0;
        serving.orbiters.forEach((orbiter, index) => {
          const local = THREE.MathUtils.clamp((presence - orbiter.delay * 0.4) / 0.6, 0, 1);
          const reach = entering ? easeOutBack(local) : 1 + (1 - local) * 1.4;
          const angle = orbiter.angle + time * orbiter.speed;
          position.set(
            Math.cos(angle) * orbiter.radius * reach,
            orbiter.height * (lift + (1 - lift) * reach) +
              Math.sin(time * 0.7 + orbiter.phase) * 0.015,
            Math.sin(angle) * orbiter.radius * reach,
          );
          if (interactive && !reduced && !serving.dish) {
            const response = touch * (index === 0 ? 0.45 : 1);
            const drift = Math.sin(time * 0.55 + orbiter.phase);
            if (serving.id === "pistachios") {
              position.multiplyScalar(1 + explore * 0.2 + response * 0.18);
              position.y += response * 0.06 * drift;
            } else if (serving.id === "tea") {
              position.y += drift * (0.08 + response * 0.2) + explore * orbiter.height;
              position.x += cursor.x * response * 0.12;
            } else if (serving.id === "saffron") {
              position.x *= 1 + explore * 0.45 + response * 0.45;
              position.y += Math.sin(angle * 2 + time * 0.4) * response * 0.12;
            } else if (serving.id === "pulses") {
              const distance = Math.hypot(position.x - cursor.x * 0.8, position.z + cursor.y * 0.8);
              const wave = Math.exp(-distance * 3) * response;
              position.y += wave * 0.2;
              position.x += (position.x - cursor.x * 0.8) * wave * 0.28;
            } else if (serving.id === "spices") {
              position.y += Math.cos(angle * 2 + time * 0.2) * (explore * 0.1 + response * 0.14);
              position.z *= 1 + response * 0.28;
            } else {
              position.y += Math.sin(angle * 3 - time * 0.7) * (explore * 0.1 + response * 0.15);
              position.x *= 1 + explore * 0.2;
            }
          }
          quaternion.setFromAxisAngle(
            orbiter.axis,
            orbiter.phase + time * orbiter.spin + (1 - local) * 5,
          );
          scale.setScalar(orbiter.scale * Math.min(1, local * 1.8));
          serving.ring.setMatrixAt(index, matrix.compose(position, quaternion, scale));
        });
        serving.ring.instanceMatrix.needsUpdate = true;
      }
      // The dish takes a higher key and a fill; the floating clouds keep their closer warm key.
      const blend = rice / Math.max(rice + cloud, 0.0001);
      light.position.set(
        THREE.MathUtils.lerp(-0.25, -0.3, blend),
        THREE.MathUtils.lerp(0.45, 0.7, blend),
        THREE.MathUtils.lerp(0.55, 0.7, blend),
      );
      light.intensity = rice * 2.2 + cloud * 1.8;
      fill.intensity = rice * 0.5;
    },
    dispose() {
      for (const serving of servings.values()) {
        serving.disposables.forEach((item) => item.dispose());
        serving.heap?.dispose();
        serving.ring.dispose();
      }
      servings.clear();
      bowlGeometry.dispose();
      footGeometry.dispose();
      ceramicMaterial.dispose();
      ceramic.color.dispose();
      ceramic.bump.dispose();
      riceTexture?.color.dispose();
      riceTexture?.bump.dispose();
    },
  };
}
