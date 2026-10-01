import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createWorldStream } from "./stream";
import { createCubeOutline } from "./outline";

const SIZE = 1.05;
const WALL = 0.07;
const PULSE_EVERY = 7.5;

/**
 * An alternative light cube: five glass panels and a metal front plate seal around a live core. The logo stays
 * whole on the front panel; on hover the panels part along their faces to reveal the light inside.
 */
export function createCoreInstallation(small: boolean, pixelRatio: number) {
  const group = new THREE.Group();
  group.name = "Hugo_core_cube";
  group.position.set(0, 1.65, 0);
  const travelOffset = new THREE.Vector3();
  let travelOpen = 0;
  let travelPresence = 1;
  let travelScale = 1;
  const uniforms = {
    chapter: { value: 0 },
    journeyCenter: { value: new THREE.Vector3(0, 1.65, 0) },
    time: { value: 0 },
    edgeTime: { value: 0 },
    age: { value: 0 },
    formed: { value: 0 },
    /** The core and its optical effects dissolve with the cube on scroll. */
    coreFormed: { value: 0 },
    dark: { value: 1 },
    cubeMatrix: { value: new THREE.Matrix4() },
    lensPointer: { value: new THREE.Vector2(0.5, 0.5) },
    pixelRatio: { value: pixelRatio },
    tDepth: { value: null as THREE.DepthTexture | null },
    resolution: { value: new THREE.Vector2(1, 1) },
    nearClip: { value: 0.1 },
    farClip: { value: 80 },
    glassHover: { value: 0 },
    boost: { value: 0 },
    glassPointer: { value: new THREE.Vector2(0.5, 0.5) },
  };
  // Shared by the glass, the core and the flare: rises with each pulse and on hover.
  const energy = { value: 0 };
  const coreWorld = { value: new THREE.Vector3() };
  const coreScale = { value: 1 };

  let disposed = false;
  let resolveAssets: () => void;
  const assetsReady = new Promise<void>((resolve) => {
    resolveAssets = resolve;
  });
  const logo = new THREE.TextureLoader().load(
    "/brand/logo.png",
    (texture) => {
      if (disposed) texture.dispose();
      resolveAssets();
    },
    undefined,
    () => resolveAssets(),
  );
  logo.colorSpace = THREE.SRGBColorSpace;
  logo.anisotropy = 4;

  // Glass for five panels; the front is a solid brushed-metal plate carrying the polished logo.
  function panelMaterial(plate: boolean) {
    const PLATE = plate ? "1.0" : "0.0";
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x2a64c0,
      map: logo,
      metalness: plate ? 1 : 0,
      roughness: plate ? 0.35 : 0,
      ior: 1.5,
      transmission: plate ? 0 : 0.95,
      thickness: 0.06,
      dispersion: 1.2,
      iridescence: 0.25,
      iridescenceIOR: 1.35,
      iridescenceThicknessRange: [180, 520],
      attenuationColor: 0x9cc2ff,
      attenuationDistance: 1.2,
      clearcoat: plate ? 0.35 : 0.6,
      clearcoatRoughness: 0,
      envMapIntensity: 1.1,
      emissive: 0xffffff,
      transparent: true,
      opacity: 0,
    });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.coreTime = uniforms.time;
      shader.uniforms.coreEnergy = energy;
      shader.uniforms.coreHover = uniforms.glassHover;
      shader.uniforms.coreWorld = coreWorld;
      shader.uniforms.coreScale = coreScale;
      shader.uniforms.corePointer = uniforms.glassPointer;
      shader.vertexShader =
        `attribute float logoFace;
      uniform vec3 coreWorld;
      uniform float coreScale;
      varying float vLogoFace, vInward, vCoreDistance;
      varying vec2 vLogoUv;
      ` + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
      vLogoFace = logoFace;
      vLogoUv = position.xy / ${SIZE.toFixed(3)} + 0.5;
      vec3 panelWorld = (modelMatrix * vec4(position, 1.0)).xyz;
      vec3 panelNormal = normalize(mat3(modelMatrix) * normal);
      vInward = max(0.0, dot(panelNormal, normalize(coreWorld - panelWorld)));
      vCoreDistance = length(panelWorld - coreWorld) / coreScale;`,
      );
      shader.fragmentShader =
        `uniform float coreTime, coreEnergy, coreHover;
      uniform vec2 corePointer;
      varying float vLogoFace, vInward, vCoreDistance;
      varying vec2 vLogoUv;
      ` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_pars_fragment>",
        `#include <map_pars_fragment>
      float logoAt(vec2 uv) {
        vec3 ink = texture2D(map, clamp(uv, 0.001, 0.999)).rgb;
        return smoothstep(0.45, 0.9, min(ink.r, min(ink.g, ink.b))) * vLogoFace;
      }
      float metalHash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      `,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `
      float mark = logoAt(vLogoUv);
      // A softened copy of the lettering gives the inlay a rounded, raised bevel.
      float bevelRadius = 0.0035;
      float relief = (mark * 4.0
        + logoAt(vLogoUv + vec2(bevelRadius, 0.0)) + logoAt(vLogoUv - vec2(bevelRadius, 0.0))
        + logoAt(vLogoUv + vec2(0.0, bevelRadius)) + logoAt(vLogoUv - vec2(0.0, bevelRadius))) / 8.0;
      // Brushed grain runs horizontally across the metal.
      float brushed = metalHash(vec2(floor(vLogoUv.y * 420.0), floor(vLogoUv.x * 9.0)));
      vec2 faceEdge = min(vMapUv, 1.0 - vMapUv);
      float edgeDistance = min(faceEdge.x, faceEdge.y);
      float seam = 1.0 - smoothstep(0.0, 0.05, edgeDistance);
      float lip = 1.0 - smoothstep(0.0, 0.014, edgeDistance);
      vec3 viewDirection = normalize(vViewPosition);
      float fresnel = pow(1.0 - abs(dot(normalize(vNormal), viewDirection)), 2.5);
      vec3 deep = mix(vec3(0.05, 0.2, 0.62), vec3(0.3, 0.1, 0.62), smoothstep(-0.5, 0.6, vLogoUv.x - vLogoUv.y));
      vec3 steel = mix(vec3(0.82, 0.86, 0.92), vec3(0.95, 0.97, 1.0), brushed);
      // The plate is dark, cool gunmetal so the polished lettering reads as the brightest metal.
      vec3 gunmetal = mix(vec3(0.13, 0.15, 0.2), vec3(0.19, 0.22, 0.28), brushed);
      vec3 body = mix(mix(vec3(0.74, 0.86, 1.0), deep, 0.15), gunmetal, ${PLATE});
      diffuseColor.rgb = mix(body, steel, mark);
      `,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>\nroughnessFactor += (brushed - 0.5) * 0.08 * ${PLATE};\nroughnessFactor = mix(roughnessFactor, 0.12 + brushed * 0.06, mark);\nroughnessFactor = max(roughnessFactor, 0.3 * clamp(relief * (1.0 - relief) * 4.0, 0.0, 1.0) * vLogoFace);`,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <metalnessmap_fragment>",
        "#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, 1.0, mark);",
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <normal_fragment_maps>",
        `#include <normal_fragment_maps>
      // Height derivatives turn the soft relief into real bevel normals that catch the studio light.
      float inlayHeight = relief * 0.0025 + (brushed - 0.5) * 0.00004 * mark;
      vec3 surfaceX = dFdx(-vViewPosition), surfaceY = dFdy(-vViewPosition);
      vec3 reliefX = cross(surfaceY, normal), reliefY = cross(normal, surfaceX);
      float determinant = dot(surfaceX, reliefX) * faceDirection;
      vec3 reliefGradient = sign(determinant) * (dFdx(inlayHeight) * reliefX + dFdy(inlayHeight) * reliefY);
      // Only the front face is perturbed, and never by a degenerate derivative, so no NaN reaches
      // the transmission buffer.
      if (vLogoFace > 0.5 && abs(determinant) > 1e-12) normal = normalize(normal - reliefGradient / abs(determinant));
      `,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        `
      // Core light pools on the inner faces and escapes along the panel edges.
      float coreFalloff = exp(-vCoreDistance * 2.1);
      float flicker = 0.92 + 0.08 * sin(coreTime * 5.3 + vCoreDistance * 14.0);
      vec3 coreColour = mix(vec3(0.1, 0.55, 1.0), vec3(0.55, 0.3, 1.0), 0.5 + 0.5 * sin(coreTime * 0.4));
      float seamGlow = seam * (0.22 + coreEnergy * 0.7) * (0.35 + coreFalloff);
      float innerGlow = vInward * coreFalloff * (0.18 + coreEnergy * 0.35);
      // A narrow glint sweeps across the metal every few seconds; hover adds one under the pointer.
      float sweepPosition = fract(coreTime / 6.0) * 2.6 - 0.8;
      float sweepOffset = (dot(vLogoUv, vec2(0.8, 0.45)) - sweepPosition) / 0.035;
      float sweep = exp(-sweepOffset * sweepOffset);
      float pointerGlint = exp(-dot(vLogoUv - corePointer, vLogoUv - corePointer) * 40.0) * coreHover;
      // Bevel slopes can mirror the dark room; lifting them keeps the lettering free of a dark outline.
      float bevelSlope = clamp(relief * (1.0 - relief) * 4.0, 0.0, 1.0) * vLogoFace;
      vec3 metalLight = bevelSlope * vec3(0.32, 0.38, 0.46)
        + mark * (vec3(0.24, 0.27, 0.32)
        + vec3(0.75, 0.88, 1.0) * (sweep * 0.85 + pointerGlint * 0.5) * (0.7 + brushed * 0.3)
        + coreColour * vInward * 0.2);
      totalEmissiveRadiance = coreColour * (seamGlow + innerGlow) * flicker * (1.0 - mark)
        + vec3(0.25, 0.65, 1.0) * lip * (0.12 + coreEnergy * 0.4)
        + deep * fresnel * mix(0.28, 0.08, ${PLATE})
        + coreColour * exp(-vCoreDistance * 1.6) * (0.04 + coreEnergy * 0.12) * (1.0 - mark) * (1.0 - ${PLATE})
        + metalLight;
      `,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <transmission_fragment>",
        THREE.ShaderChunk.transmission_fragment.replace(
          "material.transmission = transmission;",
          "material.transmission = mix(transmission, 0.0, mark);",
        ),
      );
    };
    material.customProgramCacheKey = () => `hugo-core-panels-v6-${PLATE}`;
    return material;
  }
  const glass = panelMaterial(false);
  const plate = panelMaterial(true);

  // Front and back span the whole face; the sides and caps fit between them for flush corners.
  const inner = SIZE - WALL * 2;
  function panelGeometry(width: number, height: number, depth: number, logo = false) {
    const geometry = new RoundedBoxGeometry(width, height, depth, 2, 0.018);
    const normals = geometry.getAttribute("normal");
    const faces = new Float32Array(normals.count);
    if (logo) for (let i = 0; i < normals.count; i++) faces[i] = normals.getZ(i) > 0.5 ? 1 : 0;
    geometry.setAttribute("logoFace", new THREE.BufferAttribute(faces, 1));
    return geometry;
  }
  const geometries = {
    front: panelGeometry(SIZE, SIZE, WALL, true),
    back: panelGeometry(SIZE, SIZE, WALL),
    side: panelGeometry(WALL, SIZE, inner),
    cap: panelGeometry(inner, WALL, inner),
  };
  const offset = SIZE / 2 - WALL / 2;
  const panels = (
    [
      [geometries.front, new THREE.Vector3(0, 0, 1)],
      [geometries.back, new THREE.Vector3(0, 0, -1)],
      [geometries.side, new THREE.Vector3(1, 0, 0)],
      [geometries.side, new THREE.Vector3(-1, 0, 0)],
      [geometries.cap, new THREE.Vector3(0, 1, 0)],
      [geometries.cap, new THREE.Vector3(0, -1, 0)],
    ] as const
  ).map(([geometry, normal], index) => {
    const mesh = new THREE.Mesh(geometry, index === 0 ? plate : glass);
    mesh.name = `Hugo_core_panel_${index}`;
    // Each panel's hover tilt hinges on an axis perpendicular to its travel.
    const hinge = new THREE.Vector3(normal.y, normal.z, normal.x);
    return { mesh, normal, hinge, delay: [0.55, 0.1, 0.3, 0.4, 0.2, 0.45][index]! };
  });

  const root = new THREE.Group();
  root.rotation.set(0.06, -0.32, -0.025);
  for (const panel of panels) root.add(panel.mesh);
  group.add(root);

  // Opaque core and cage are captured by the transmission pass, so each glass panel refracts them.
  const noiseShader = /* glsl */ `
    float coreHash(vec3 p) {
      p = fract(p * 0.3183099 + 0.1);
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }
    float coreNoise(vec3 x) {
      vec3 i = floor(x), f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(mix(coreHash(i), coreHash(i + vec3(1, 0, 0)), f.x),
          mix(coreHash(i + vec3(0, 1, 0)), coreHash(i + vec3(1, 1, 0)), f.x), f.y),
        mix(mix(coreHash(i + vec3(0, 0, 1)), coreHash(i + vec3(1, 0, 1)), f.x),
          mix(coreHash(i + vec3(0, 1, 1)), coreHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
    }
    float coreFbm(vec3 p) {
      float value = 0.0, amplitude = 0.5;
      for (int i = 0; i < 4; i++) {
        value += coreNoise(p) * amplitude;
        p = p * 2.03 + vec3(1.7, 9.2, 3.4);
        amplitude *= 0.5;
      }
      return value;
    }
  `;
  const coreGeometry = new THREE.IcosahedronGeometry(0.15, 6);
  const coreMaterial = new THREE.ShaderMaterial({
    uniforms: { time: uniforms.time, energy, formed: uniforms.coreFormed },
    vertexShader: /* glsl */ `
      uniform float time, energy;
      varying vec3 vNormal, vView, vObject;
      ${noiseShader}
      void main() {
        vObject = position / 0.15;
        // Slow, lumpy swell keeps the silhouette alive without reading as a wobble.
        float swell = coreFbm(vObject * 2.2 + vec3(0.0, time * 0.35, time * 0.2)) - 0.5;
        vec3 p = position * (1.0 + swell * (0.16 + energy * 0.12));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float time, energy, formed;
      varying vec3 vNormal, vView, vObject;
      ${noiseShader}
      // Deep navy, brand blue, cyan, violet, and a small warm amber accent at the hottest points.
      vec3 plasma(float x) {
        vec3 colour = mix(vec3(0.01, 0.03, 0.2), vec3(0.04, 0.3, 1.0), smoothstep(0.1, 0.38, x));
        colour = mix(colour, vec3(0.25, 0.85, 1.0), smoothstep(0.38, 0.55, x));
        colour = mix(colour, vec3(0.5, 0.22, 1.0), smoothstep(0.55, 0.7, x));
        return mix(colour, vec3(1.0, 0.58, 0.22), smoothstep(0.74, 0.9, x));
      }
      void main() {
        vec3 normal = normalize(vNormal);
        vec3 view = normalize(vView);
        float facing = max(dot(normal, view), 0.0);
        // Domain-warped noise: the surface churns like plasma rather than scrolling in bands.
        vec3 q = vObject * 2.4;
        vec3 warp = vec3(
          coreFbm(q + vec3(0.0, time * 0.22, 0.0)),
          coreFbm(q + vec3(5.2, 1.3, 2.8) - time * 0.17),
          coreFbm(q + vec3(1.7, 9.2, 3.1) + time * 0.12));
        float field = coreFbm(q + warp * 2.4 + time * 0.1);
        // Stretch the noise so deep navy gaps separate the hot regions instead of an even pastel.
        float heat = smoothstep(0.32, 0.72, field);
        float veins = pow(1.0 - abs(field * 2.0 - 1.0), 18.0);
        // A key light from the upper left gives the core a volume, not a flat disc.
        float shade = 0.3 + 0.7 * max(dot(normal, normalize(vec3(-0.5, 0.7, 0.6))), 0.0);
        float rim = pow(1.0 - facing, 3.0);
        float nucleus = pow(facing, 14.0);
        vec3 colour = plasma(heat * 0.95 + rim * 0.15) * shade * (0.12 + heat * heat * 2.6)
          + vec3(0.45, 0.8, 1.0) * veins * (1.0 + energy * 0.8)
          + vec3(0.12, 0.5, 1.0) * rim * (1.0 + energy * 0.6)
          + vec3(1.0, 0.9, 0.78) * nucleus * heat * (0.8 + energy * 0.8);
        gl_FragColor = vec4(colour * (0.6 + energy * 0.15) * formed, 1.0);
      }
    `,
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.name = "Hugo_core";
  root.add(core);

  // A counter-rotating geometric lattice, with light pulses travelling along its struts.
  const cageMaterial = new THREE.ShaderMaterial({
    uniforms: { time: uniforms.time, energy, formed: uniforms.coreFormed },
    vertexShader: /* glsl */ `
      varying vec3 vObject;
      void main() {
        vObject = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float time, energy, formed;
      varying vec3 vObject;
      void main() {
        float wave = fract(dot(vObject, vec3(0.6, 0.8, 0.3)) * 1.5 - time * 0.45);
        float pulse = exp(-wave * 14.0);
        vec3 colour = mix(vec3(0.08, 0.3, 0.9), vec3(0.55, 0.35, 1.0), 0.5 + 0.5 * vObject.y) * (0.35 + energy * 0.6)
          + vec3(0.75, 0.92, 1.0) * pulse * (1.6 + energy * 2.0);
        gl_FragColor = vec4(colour * formed, 1.0);
      }
    `,
  });
  const cageGeometries = [
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.27, 0)),
    new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.22, 0)),
  ];
  const cages = cageGeometries.map((geometry, index) => {
    const cage = new THREE.LineSegments(geometry, cageMaterial);
    cage.name = `Hugo_core_cage_${index}`;
    root.add(cage);
    return cage;
  });

  const light = new THREE.PointLight(0x4fb6ff, 0, 1.8, 2);
  root.add(light);

  const raycaster = new THREE.Raycaster();
  const rayPointer = new THREE.Vector2();
  const hits: THREE.Intersection[] = [];
  const localHit = new THREE.Vector3();
  const panelMeshes: THREE.Object3D[] = [...panels.map((panel) => panel.mesh), core];
  const frontPlate = panels[0]!.mesh;

  const stream = createWorldStream(small, uniforms);
  const outline = createCubeOutline(uniforms);
  stream.group.add(outline.mesh);

  // A screen-facing anamorphic flare, occluded by the courtyard through its depth texture.
  const flareMaterial = new THREE.ShaderMaterial({
    uniforms: {
      energy,
      formed: uniforms.coreFormed,
      hover: uniforms.glassHover,
      tDepth: uniforms.tDepth,
      resolution: uniforms.resolution,
      nearClip: uniforms.nearClip,
      farClip: uniforms.farClip,
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vDistance;
      varying vec4 vCentre;
      void main() {
        vUv = position.xy;
        vec4 centre = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        vDistance = -centre.z;
        vCentre = projectionMatrix * centre;
        gl_Position = projectionMatrix * (centre + vec4(position.x * 3.2, position.y * 1.4, 0.0, 0.0));
      }
    `,
    fragmentShader: /* glsl */ `
      #include <packing>
      uniform float energy, formed, hover, nearClip, farClip;
      uniform sampler2D tDepth;
      uniform vec2 resolution;
      varying vec2 vUv;
      varying float vDistance;
      varying vec4 vCentre;
      void main() {
        vec2 centreUv = vCentre.xy / vCentre.w * 0.5 + 0.5;
        float surface = -perspectiveDepthToViewZ(texture2D(tDepth, clamp(centreUv, 0.001, 0.999)).x, nearClip, farClip);
        float visible = 1.0 - smoothstep(0.6, 1.2, vDistance - surface);
        vec2 p = vUv * vec2(3.2, 1.4);
        float glow = exp(-dot(p, p) * 5.0);
        float streak = exp(-abs(p.y) * 60.0) * exp(-abs(p.x) * 1.4);
        float power = (0.02 + hover * 0.2 + energy * 0.1) * formed * visible;
        vec3 colour = vec3(0.1, 0.45, 1.0) * glow * 0.35 + vec3(0.45, 0.75, 1.0) * streak * 0.9;
        gl_FragColor = vec4(colour * power, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const flareGeometry = new THREE.PlaneGeometry(2, 2);
  const flare = new THREE.Mesh(flareGeometry, flareMaterial);
  flare.name = "Hugo_core_flare";
  flare.frustumCulled = false;
  stream.group.add(flare);

  const outlineScale = new THREE.Matrix4();
  // 0 shows the cube; 1 folds it into its core so an ingredient can take its place.
  let collapse = 0;
  let collapseTarget = 0;
  let started: number | null = null;
  let lastUpdate = 0;
  return {
    group,
    particles: stream.group,
    uniforms,
    assetsReady,
    cubeRotation: root.rotation,
    updateHover(
      camera: THREE.Camera,
      pointer: THREE.Vector2,
      active: boolean,
      reduced: boolean,
      delta: number,
    ) {
      hits.length = 0;
      if (active && !reduced && uniforms.formed.value > 0.5 && collapse < 0.1) {
        rayPointer.set(pointer.x, -pointer.y);
        raycaster.setFromCamera(rayPointer, camera);
        raycaster.intersectObjects(panelMeshes, false, hits);
      }
      const hit = hits[0];
      const ease = reduced ? 1 : 1 - Math.exp(-delta * 5);
      uniforms.glassHover.value = THREE.MathUtils.lerp(
        uniforms.glassHover.value,
        hit ? 1 : 0,
        ease,
      );
      if (hit) {
        root.worldToLocal(localHit.copy(hit.point)).divideScalar(SIZE);
        uniforms.glassPointer.value.lerp(rayPointer.set(localHit.x + 0.5, localHit.y + 0.5), ease);
      }
      if (reduced) uniforms.glassPointer.value.set(0.5, 0.5);
    },
    setEnvironment(texture: THREE.Texture) {
      for (const material of [glass, plate]) {
        material.envMap = texture;
        material.needsUpdate = true;
      }
    },
    setJourney(offset: THREE.Vector3, openness: number, presence = 1, scale = 1) {
      travelOffset.copy(offset);
      travelOpen = openness;
      travelPresence = presence;
      travelScale = scale;
    },
    update(time: number, ready: boolean, reduced: boolean, pointer: THREE.Vector2) {
      if (ready && started === null) started = time;
      const age = reduced ? 8 : started === null ? 0 : time - started;
      const hover = reduced ? 0 : uniforms.glassHover.value;
      const step = Math.min(Math.max(time - lastUpdate, 0), 0.05);
      collapse = reduced
        ? collapseTarget
        : THREE.MathUtils.clamp(collapse + (collapseTarget ? step / 0.7 : -step / 1.2), 0, 1);
      // Panels fold in first, the core flares as they meet, then the light itself goes out.
      const fold = THREE.MathUtils.smootherstep(collapse, 0, 0.65);
      // The core, cages, flare and light all share the panels' scroll disappearance.
      const fade = (1 - THREE.MathUtils.smoothstep(collapse, 0.45, 1)) * travelPresence;
      const flash = Math.sin(Math.min(collapse / 0.8, 1) * Math.PI) * (collapseTarget ? 1 : 0.4);
      uniforms.edgeTime.value += step * (1 + hover * 1.5);
      lastUpdate = time;
      uniforms.time.value = time;
      uniforms.age.value = age;
      // The core ignites first; the panels then arrive and seal around it.
      const ignition = THREE.MathUtils.smoothstep(age, 0.2, 1.4);
      const formed = THREE.MathUtils.smoothstep(age, 0.8, 3.2);
      uniforms.formed.value = Math.max(formed, ignition * 0.6) * fade;
      uniforms.coreFormed.value = uniforms.formed.value;
      glass.opacity = plate.opacity =
        THREE.MathUtils.smoothstep(age, 0.7, 1.7) * (1 - fold) * travelPresence;

      // A brief breath opens the seams every few seconds, so the light inside reads at rest.
      const cycle = reduced ? 1 : ((age - 4) % PULSE_EVERY) / PULSE_EVERY;
      const pulse = age > 4 ? Math.exp(-(((cycle - 0.08) / 0.045) ** 2)) : 0;
      energy.value = THREE.MathUtils.lerp(
        energy.value,
        pulse * 0.9 + hover * 0.6 + flash * 1.6 + travelOpen * 0.55,
        0.2,
      );
      const open = hover * 0.3 + pulse * 0.045 + Math.sin(time * 1.1) * 0.003 + travelOpen * 0.68;

      for (const panel of panels) {
        const lock = THREE.MathUtils.smootherstep(age, 0.9 + panel.delay, 2.5 + panel.delay);
        // Panels begin in the open, hover position and close in around the lit core.
        const away = 1 - lock;
        // The metal front plate holds still on hover; only the glass panels open.
        const front = panel.mesh === frontPlate;
        const panelOpen = front ? open - hover * 0.3 : open;
        panel.mesh.position.copy(panel.normal).multiplyScalar(offset + panelOpen + away * 0.32);
        // Front and back swing aside to open a passage through the light core.
        if (Math.abs(panel.normal.z) > 0.5)
          panel.mesh.position.x += panel.normal.z * travelOpen * 0.85;
        panel.mesh.quaternion.setFromAxisAngle(
          panel.hinge,
          ((front ? 0 : hover) + away) * 0.035 + travelOpen * (front ? -0.7 : 0.24),
        );
      }

      const px = reduced ? 0 : pointer.x;
      const py = reduced ? 0 : pointer.y;
      const hx = (uniforms.glassPointer.value.x - 0.5) * 2 * hover;
      const hy = (uniforms.glassPointer.value.y - 0.5) * 2 * hover;
      group.position.x = px * 0.12;
      group.position.y = 1.65 + Math.sin(time * 0.5) * 0.035 - py * 0.06 + hover * 0.06;
      group.position.z = py * 0.06 + Math.abs(px) * 0.035;
      group.position.add(travelOffset);
      group.scale.setScalar(travelScale);
      // On hover the cube turns towards its opened side, so the core shows past the fixed front plate.
      const turn = hover * hover * (3 - 2 * hover);
      root.rotation.set(
        0.06 + py * 0.27 - hy * 0.12 + turn * 0.14 + (1 - formed) * 0.08 + travelOpen * 0.28,
        -0.4 +
          Math.sin(time * 0.2) * 0.08 +
          px * 0.42 +
          hx * 0.18 -
          turn * 0.5 -
          (1 - formed) * 0.25 +
          travelOpen * 0.5,
        -0.025 - px * 0.05,
      );
      root.scale.setScalar(1 - fold * 0.9);
      // Hide the geometry, never the light: removing a light from the scene changes the light count
      // compiled into every lit shader, and the whole courtyard would recompile on the spot.
      for (const panel of panels) panel.mesh.visible = fade > 0;
      for (const object of [core, ...cages]) object.visible = fade > 0;
      core.scale.setScalar(
        (ignition * fade * (0.72 + energy.value * 0.2 + hover * 0.45)) / (1 - fold * 0.9),
      );
      core.rotation.y = time * 0.6;
      const cageSpeed = 0.35 + hover * 0.9;
      const cageScale = (ignition * fade * (0.85 + hover * 0.4)) / (1 - fold * 0.9);
      cages[0]!.rotation.set(time * cageSpeed * 0.6, -time * cageSpeed, 0.3);
      cages[1]!.rotation.set(-time * cageSpeed * 0.8, time * cageSpeed * 0.7, time * 0.2);
      for (const cage of cages) cage.scale.setScalar(cageScale);
      uniforms.lensPointer.value.set(px * 0.5 + 0.5, 0.5 - py * 0.5);
      light.intensity =
        ignition *
        fade *
        (uniforms.dark.value ? 2.5 : 1.5) *
        (0.95 + Math.sin(time * 5.3) * 0.05) *
        (1 + energy.value * 1.2);
      group.updateMatrixWorld(true);
      flare.position.copy(group.position);
      coreWorld.value.setFromMatrixPosition(root.matrixWorld);
      coreScale.value = group.scale.x;
      const spread = 1 + open / offset;
      uniforms.cubeMatrix.value.multiplyMatrices(
        root.matrixWorld,
        outlineScale.makeScale(spread, spread, spread),
      );
    },
    setDark(dark: boolean) {
      uniforms.dark.value = dark ? 1 : 0;
    },
    setCollapsed(value: boolean) {
      collapseTarget = value ? 1 : 0;
    },
    get collapse() {
      return collapse;
    },
    dispose() {
      disposed = true;
      Object.values(geometries).forEach((geometry) => geometry.dispose());
      glass.dispose();
      plate.dispose();
      logo.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      cageGeometries.forEach((geometry) => geometry.dispose());
      cageMaterial.dispose();
      flareGeometry.dispose();
      flareMaterial.dispose();
      stream.dispose();
      outline.dispose();
    },
  };
}

export type CoreInstallation = ReturnType<typeof createCoreInstallation>;
