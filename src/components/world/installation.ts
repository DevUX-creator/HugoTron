import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createWorldStream } from "./stream";
import { createCubeOutline } from "./outline";

/** Clear tinted glass, silver engraving and animated electric edges. */
export function createWorldInstallation(small: boolean, pixelRatio: number) {
  const group = new THREE.Group();
  group.name = "Hugo_light_cube";
  group.position.set(0, 1.65, 0);
  const travelOffset = new THREE.Vector3();
  let travelPresence = 1;
  let travelScale = 1;
  const uniforms = {
    chapter: { value: 0 },
    journeyCenter: { value: new THREE.Vector3(0, 1.65, 0) },
    time: { value: 0 },
    edgeTime: { value: 0 },
    age: { value: 0 },
    formed: { value: 0 },
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
  let disposed = false;
  let resolveAssets: () => void;
  const assetsReady = new Promise<void>((resolve) => {
    resolveAssets = resolve;
  });
  const assetDone = () => resolveAssets();
  const logo = new THREE.TextureLoader().load(
    "/brand/logo.png",
    (texture) => {
      if (disposed) texture.dispose();
      assetDone();
    },
    undefined,
    assetDone,
  );
  logo.colorSpace = THREE.SRGBColorSpace;
  logo.anisotropy = 4;
  const body = new THREE.MeshPhysicalMaterial({
    color: 0x1755a9,
    map: logo,
    metalness: 0,
    roughness: 0.08,
    clearcoat: 0.12,
    clearcoatRoughness: 0.035,
    ior: 1.46,
    transmission: 0.96,
    thickness: 0.32,
    attenuationColor: 0xa5c7ff,
    attenuationDistance: 1.6,
    envMapIntensity: 0.6,
    emissive: 0x168fbb,
    transparent: true,
    opacity: 0,
  });
  body.onBeforeCompile = (shader) => {
    shader.uniforms.sculptureTime = uniforms.time;
    shader.uniforms.brandBlue = { value: new THREE.Color(0x1755a9) };
    shader.uniforms.glassHover = uniforms.glassHover;
    shader.uniforms.glassPointer = uniforms.glassPointer;
    shader.vertexShader =
      "attribute float logoFace; varying float vLogoFace; varying vec3 vPanelView, vPanelNormal;\n" +
      shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\nvLogoFace = logoFace; vPanelNormal = normal;",
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      "#include <project_vertex>\nvPanelView = transpose(mat3(modelViewMatrix)) * -mvPosition.xyz;",
    );
    shader.fragmentShader =
      "uniform float sculptureTime, glassHover; uniform vec2 glassPointer; uniform vec3 brandBlue; varying float vLogoFace; varying vec3 vPanelView, vPanelNormal;\n" +
      shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_pars_fragment>",
      `#include <map_pars_fragment>
      float panelHash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      float panelGrain(vec2 p) {
        vec2 cell = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(panelHash(cell), panelHash(cell + vec2(1.0, 0.0)), f.x),
          mix(panelHash(cell + vec2(0.0, 1.0)), panelHash(cell + 1.0), f.x), f.y);
      }
      float logoMask(vec2 uv) {
        vec3 ink = texture2D(map, uv).rgb;
        return smoothstep(0.45, 0.9, min(ink.r, min(ink.g, ink.b))) * vLogoFace;
      }
      float recessedMask(vec2 uv) {
        // A small bevel around the original artwork, without changing the letter shapes.
        vec2 radius = vec2(0.0036);
        return (logoMask(uv) * 4.0
          + logoMask(uv + vec2(radius.x, 0.0)) + logoMask(uv - vec2(radius.x, 0.0))
          + logoMask(uv + vec2(0.0, radius.y)) + logoMask(uv - vec2(0.0, radius.y))) / 8.0;
      }
      `,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      `
      float mark = logoMask(vMapUv);
      float cut = recessedMask(vMapUv);
      vec2 viewOffset = vPanelView.xy / max(abs(vPanelView.z), 0.25) * 0.01 * vLogoFace;
      float cavityFloor = logoMask(vMapUv + viewOffset);
      float innerWall = mark * (1.0 - cavityFloor);
      float grain = panelGrain(vMapUv * 180.0);
      vec2 edgeUv = min(vMapUv, 1.0 - vMapUv);
      float edgeDistance = min(edgeUv.x, edgeUv.y);
      float edge = 1.0 - smoothstep(0.006, 0.019, edgeDistance);
      float rim = 1.0 - smoothstep(0.013, 0.031, edgeDistance);
      // Polished glass retains a small amount of surface variation.
      float diagonal = vMapUv.x * 0.7 + vMapUv.y * 0.55;
      float frost = smoothstep(0.12, 0.4, diagonal) * (1.0 - smoothstep(0.8, 1.18, diagonal));
      float surfaceHeight = (grain - 0.5) * 0.000035 * frost * (1.0 - mark) - cut * 0.009;
      float sheenPosition = dot(glassPointer, vec2(0.65, 0.8)) + sin(sculptureTime * 0.8) * 0.035;
      float sheenDistance = (dot(vMapUv, vec2(0.65, 0.8)) - sheenPosition) / 0.095;
      float sheen = exp(-sheenDistance * sheenDistance) * glassHover;
      surfaceHeight += (sheen * 0.0012 + sin(diagonal * 9.0 - sculptureTime * 0.8) * glassHover * 0.00035) * (1.0 - mark);
      float pulse = 0.96 + 0.04 * sin(sculptureTime * 0.65);
      vec3 viewDirection = normalize(vPanelView);
      vec3 panelNormal = normalize(vPanelNormal);
      float fresnel = pow(1.0 - max(dot(viewDirection, panelNormal), 0.0), 3.0);
      float gradient = smoothstep(0.1, 1.2, diagonal + glassHover * (glassPointer.x - 0.5) * 0.35);
      float proximity = exp(-dot(vMapUv - glassPointer, vMapUv - glassPointer) * 6.0) * glassHover;
      vec3 panel = mix(vec3(0.075, 0.22, 0.58), vec3(0.26, 0.09, 0.48), gradient * 0.75);
      vec3 hoverTint = mix(vec3(0.12, 0.48, 0.62), vec3(0.43, 0.22, 0.62), glassPointer.x);
      panel = mix(panel, hoverTint, proximity * 0.78);
      panel = mix(panel, vec3(0.38, 0.6, 0.85), rim * 0.25);
      // Pale silver-blue cut floors retain the recessed bevels without turning the brand black.
      vec3 clearGlass = mix(vec3(0.68, 0.8, 0.95), panel, 0.3);
      diffuseColor.rgb = mix(clearGlass, vec3(0.52, 0.72, 0.9) * (1.0 - innerWall * 0.16), mark);
      `,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <roughnessmap_fragment>",
      "#include <roughnessmap_fragment>\nroughnessFactor = mix(0.035, 0.08, frost) - rim * 0.01 + (grain - 0.5) * 0.003; roughnessFactor = mix(roughnessFactor, 0.24, mark);",
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <metalnessmap_fragment>",
      "#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, 0.5, mark);",
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <normal_fragment_maps>",
      `#include <normal_fragment_maps>
      // World-height derivatives make the engraving concave, so its bevels respond to scene light and tilt.
      vec3 surfaceX = dFdx(-vViewPosition), surfaceY = dFdy(-vViewPosition);
      vec3 reliefX = cross(surfaceY, normal), reliefY = cross(normal, surfaceX);
      float determinant = dot(surfaceX, reliefX) * faceDirection;
      vec3 reliefGradient = sign(determinant) * (dFdx(surfaceHeight) * reliefX + dFdy(surfaceHeight) * reliefY);
      normal = normalize(max(abs(determinant), 0.00000001) * normal - reliefGradient);
      // Keep the fine satin finish stable while the glass catches moving reflections.
      float normalVariance = max(length(dFdx(normal)), length(dFdy(normal)));
      roughnessFactor = min(0.96, roughnessFactor + min(0.18, normalVariance * 0.22));
      `,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `
      float bevelLight = max(0.0, cut - recessedMask(vMapUv + vec2(-0.004, 0.004)));
      float bevelShade = max(0.0, cut - recessedMask(vMapUv - vec2(-0.004, 0.004)));
      float edgeBleed = exp(-edgeDistance * 29.0);
      float current = 0.85 + 0.15 * sin(sculptureTime * 1.9 + vMapUv.x * 9.0 + vMapUv.y * 6.0);
      totalEmissiveRadiance = (panel * (0.065 + frost * 0.01 + proximity * 0.085) + brandBlue * fresnel * 0.065
        + mix(vec3(0.08, 0.48, 0.65), vec3(0.38, 0.2, 0.7), glassPointer.x) * sheen * 0.2
        + vec3(0.008, 0.12, 0.54) * (edgeBleed * current * 0.24 + edge * 0.12)) * (1.0 - mark)
        + vec3(0.3, 0.52, 0.76) * mark * (0.3 - innerWall * 0.05)
        + vec3(0.2, 0.55, 0.9) * bevelLight * 0.7;
      totalEmissiveRadiance *= pulse * (1.0 - bevelShade * 0.2);
      `,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <transmission_fragment>",
      THREE.ShaderChunk.transmission_fragment
        .replace(
          "material.transmission = transmission;",
          "material.transmission = mix(min(1.0, transmission + rim * 0.04), 0.0, mark);",
        )
        .replace(
          "material.thickness = thickness;",
          "material.thickness = thickness * (0.6 + rim * 0.65);",
        )
        .replace(
          "material.attenuationColor = attenuationColor;",
          "material.attenuationColor = mix(attenuationColor, normalize(panel), 0.4);",
        ),
    );
  };
  body.customProgramCacheKey = () => "hugo-clear-gradient-glass-hover-v10";
  const cubeGeometry = new RoundedBoxGeometry(1.05, 1.05, 1.05, 2, 0.025);
  const logoFaces = new Float32Array(cubeGeometry.getAttribute("position").count);
  // Box face 4 is +Z. A vertex attribute keeps the brand on that face in a single draw call.
  for (const face of cubeGeometry.groups) {
    if (face.materialIndex === 4) logoFaces.fill(1, face.start, face.start + face.count);
  }
  cubeGeometry.setAttribute("logoFace", new THREE.BufferAttribute(logoFaces, 1));
  cubeGeometry.clearGroups();
  const cube = new THREE.Mesh(cubeGeometry, body);
  cube.name = "Hugo_logo_cube";
  cube.rotation.set(0.06, -0.32, -0.025);
  group.add(cube);
  const raycaster = new THREE.Raycaster();
  const rayPointer = new THREE.Vector2();
  const hits: THREE.Intersection[] = [];
  const light = new THREE.PointLight(0x43bfff, 0, 5.5, 2);
  light.position.set(0, -0.15, 0.25);
  group.add(light);

  const stream = createWorldStream(small, uniforms);
  const outline = createCubeOutline(uniforms);
  stream.group.add(outline.mesh);
  let collapsed = false;
  let started: number | null = null;
  let lastUpdate = 0;
  return {
    group,
    particles: stream.group,
    uniforms,
    assetsReady,
    cubeRotation: cube.rotation,
    updateHover(
      camera: THREE.Camera,
      pointer: THREE.Vector2,
      active: boolean,
      reduced: boolean,
      delta: number,
    ) {
      hits.length = 0;
      if (active && !reduced && cube.visible) {
        rayPointer.set(pointer.x, -pointer.y);
        raycaster.setFromCamera(rayPointer, camera);
        raycaster.intersectObject(cube, false, hits);
      }
      const hit = hits[0];
      const ease = reduced ? 1 : 1 - Math.exp(-delta * 7);
      uniforms.glassHover.value = THREE.MathUtils.lerp(
        uniforms.glassHover.value,
        hit ? 1 : 0,
        ease,
      );
      if (hit?.uv) uniforms.glassPointer.value.lerp(hit.uv, ease);
      if (reduced) uniforms.glassPointer.value.set(0.5, 0.5);
    },
    setEnvironment(texture: THREE.Texture) {
      // An explicit map avoids Three's scene.environmentIntensity override on this luminous object.
      body.envMap = texture;
      body.needsUpdate = true;
    },
    setJourney(offset: THREE.Vector3, _openness: number, presence = 1, scale = 1) {
      travelOffset.copy(offset);
      travelPresence = presence;
      travelScale = scale;
    },
    update(time: number, ready: boolean, reduced: boolean, pointer: THREE.Vector2) {
      if (ready && started === null) started = time;
      const age = reduced ? 8 : started === null ? 0 : time - started;
      const hover = reduced ? 0 : uniforms.glassHover.value;
      const hx = (uniforms.glassPointer.value.x - 0.5) * 2 * hover;
      const hy = (uniforms.glassPointer.value.y - 0.5) * 2 * hover;
      uniforms.edgeTime.value += Math.min(Math.max(time - lastUpdate, 0), 0.05) * (1 + hover * 0.8);
      lastUpdate = time;
      uniforms.time.value = time;
      uniforms.age.value = age;
      const formed = THREE.MathUtils.smoothstep(age, 1.2, 2.8) * travelPresence;
      // An ingredient replaces the cube instantly here; the core cube has its own fold.
      uniforms.formed.value = collapsed ? 0 : formed;
      uniforms.coreFormed.value = uniforms.formed.value;
      body.opacity = formed;
      cube.visible = formed > 0 && !collapsed;
      const px = reduced ? 0 : pointer.x;
      const py = reduced ? 0 : pointer.y;
      group.position.x = px * 0.12;
      group.position.y = 1.65 + Math.sin(time * 0.5) * 0.035 - py * 0.06 + hover * 0.065;
      group.position.z = py * 0.06 + Math.abs(px) * 0.035 + hover * 0.04;
      group.position.add(travelOffset);
      group.scale.setScalar((1 + hover * 0.025) * travelScale);
      cube.rotation.set(
        0.06 + py * 0.27 - hy * 0.1,
        -0.4 + Math.sin(time * 0.2) * 0.08 + px * 0.42 + hx * 0.14,
        -0.025 - px * 0.05 + hx * 0.025,
      );
      uniforms.lensPointer.value.set(px * 0.5 + 0.5, 0.5 - py * 0.5);
      light.intensity =
        uniforms.formed.value *
        (uniforms.dark.value ? 12 : 5) *
        (0.97 + Math.sin(time * 0.9) * 0.03) *
        (1 + hover * 0.14);
      group.updateMatrixWorld(true);
      uniforms.cubeMatrix.value.copy(cube.matrixWorld);
    },
    setCollapsed(value: boolean) {
      collapsed = value;
    },
    get collapse(): number {
      return collapsed ? 1 : 0;
    },
    setDark(dark: boolean) {
      uniforms.dark.value = dark ? 1 : 0;
    },
    dispose() {
      disposed = true;
      cubeGeometry.dispose();
      body.dispose();
      logo.dispose();
      stream.dispose();
      outline.dispose();
    },
  };
}

export type WorldInstallation = ReturnType<typeof createWorldInstallation>;
