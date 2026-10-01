import * as THREE from "three";
import { foregroundFocusShader } from "./focus";
import { createWorldLightPaths } from "./paths";

type StreamUniforms = {
  chapter: { value: number };
  /** The hand-off to Daylight: lines run hotter and wider as the scene dissolves. */
  boost: { value: number };
  journeyCenter: { value: THREE.Vector3 };
  time: { value: number };
  age: { value: number };
  pixelRatio: { value: number };
  tDepth: { value: THREE.DepthTexture | null };
  resolution: { value: THREE.Vector2 };
  nearClip: { value: number };
  farClip: { value: number };
  lensPointer: { value: THREE.Vector2 };
};

/** Flowing sparks and feathered filaments share routes, turbulence, and scene-depth occlusion. */
export function createWorldStream(small: boolean, shared: StreamUniforms) {
  const routes = createWorldLightPaths();
  const routeData = new Float32Array(256 * routes.length * 4);
  routes.forEach((curve, row) => {
    curve
      .getSpacedPoints(255)
      .forEach((p, i) => routeData.set([p.x, p.y, p.z, 1], (row * 256 + i) * 4));
  });
  const routeMap = new THREE.DataTexture(
    routeData,
    256,
    routes.length,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  routeMap.needsUpdate = true;
  const uniforms = { ...shared, routeMap: { value: routeMap } };
  const flowShader = /* glsl */ `
    uniform sampler2D routeMap;
    uniform float time, age, chapter, boost;
    uniform vec2 lensPointer;
    ${foregroundFocusShader}
    float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }
    vec3 routeAt(float t, float branch) {
      float index = clamp(t, 0.0, 1.0) * 255.0;
      float row = (branch + 0.5) / 4.0;
      vec3 a = texture2D(routeMap, vec2((floor(index) + 0.5) / 256.0, row)).xyz;
      vec3 b = texture2D(routeMap, vec2((min(floor(index) + 1.0, 255.0) + 0.5) / 256.0, row)).xyz;
      return mix(a, b, fract(index));
    }
    vec3 courtyardAt(float t, float seed, float branch) {
      vec3 p = routeAt(t, branch);
      vec3 tangent = normalize(routeAt(min(t + 0.006, 1.0), branch) - routeAt(max(t - 0.006, 0.0), branch));
      vec3 side = normalize(cross(tangent, vec3(0.0, 1.0, 0.0)));
      vec3 up = cross(side, tangent);
      float spread = (0.045 + hash(seed + 9.1) * 0.38) * (1.0 - smoothstep(0.2, 2.0, -p.z) * 0.88);
      float lateral = sin(t * 17.0 + seed * 51.0 - time * 0.36)
        + sin(t * 37.0 + seed * 31.0 + time * 0.27) * 0.22;
      float vertical = cos(t * 12.0 + seed * 67.0 + time * 0.24)
        + sin(t * 29.0 - seed * 17.0 - time * 0.31) * 0.25;
      return p + side * lateral * spread + up * vertical * spread * 0.65;
    }
    // The same hero filaments spread into broad, open currents with real depth.
    vec3 trailAt(float t, float seed, float branch) {
      vec3 p = routeAt(t, branch + 2.0);
      vec3 tangent = normalize(routeAt(min(t + 0.006, 1.0), branch + 2.0)
        - routeAt(max(t - 0.006, 0.0), branch + 2.0));
      vec3 side = normalize(cross(tangent, vec3(0.0, 1.0, 0.0)));
      vec3 up = cross(side, tangent);
      float spread = 0.13 + hash(seed + 9.1) * 0.48;
      float lateral = sin(t * 8.0 + seed * 51.0 - time * 0.2)
        + sin(t * 21.0 + seed * 31.0 + time * 0.15) * 0.12;
      float vertical = cos(t * 9.0 + seed * 67.0 + time * 0.16);
      return p + side * lateral * spread + up * vertical * spread * 0.65;
    }
    vec3 flowAt(float t, float seed, float branch) {
      if (chapter <= 0.0) return courtyardAt(t, seed, branch);
      if (chapter >= 0.9) return trailAt(t, seed, branch);
      float follow = smoothstep(0.1, 0.9, chapter);
      return mix(courtyardAt(t, seed, branch), trailAt(t, seed, branch), follow);
    }
    float flowVisibility(float t, vec3 p) {
      float head = smoothstep(0.05, 3.0, age);
      float courtyard = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.68, 0.98, t))
        * (1.0 - smoothstep(head - 0.1, head, t))
        * (1.0 - smoothstep(0.25, 3.4, -p.z));
      float passage = smoothstep(0.0, 0.025, t) * (1.0 - smoothstep(0.96, 1.0, t));
      return mix(courtyard, passage, smoothstep(0.04, 0.3, chapter));
    }
    float foregroundDefocus(vec2 uv, float aspect) {
      return foregroundSoftness(uv, aspect, lensPointer, time)
        * (1.0 - smoothstep(0.15, 0.75, chapter));
    }
    vec4 safeProjection(vec4 view) {
      return projectionMatrix * vec4(view.xy, min(view.z, -0.08), 1.0);
    }
  `;
  const depthShader = /* glsl */ `
    #include <packing>
    uniform sampler2D tDepth;
    uniform vec2 resolution;
    uniform float nearClip, farClip, chapter, boost;
    varying float vDistance;
    float depthVisibility() {
      float depth = texture2D(tDepth, gl_FragCoord.xy / resolution).x;
      float surface = -perspectiveDepthToViewZ(depth, nearClip, farClip);
      return 1.0 - smoothstep(0.015, 0.07, vDistance - surface);
    }
  `;
  let seed = 5721;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const count = small ? 1200 : 2500;
  const geometry = new THREE.BufferGeometry();
  const attributes = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    attributes.set([random(), random(), i % 2], i * 3);
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute("flow", new THREE.BufferAttribute(attributes, 3));
  const pointMaterial = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 flow;
      uniform float pixelRatio;
      uniform vec2 resolution;
      varying float vAlpha, vDistance, vSeed;
      ${flowShader}
      void main() {
        float trail = smoothstep(0.45, 0.95, chapter);
        float speed = mix(mix(0.045, 0.095, flow.y), mix(0.018, 0.038, flow.y), trail);
        float t = fract(flow.x + time * speed);
        vec3 p = flowAt(t, flow.y, flow.z);
        p += vec3(sin(time * 0.7 + flow.x * 183.0), cos(time * 0.9 + flow.x * 91.0), 0.0)
          * mix(0.045, 0.1, trail);
        vec4 view = viewMatrix * vec4(p, 1.0);
        vDistance = -view.z;
        vSeed = flow.y;
        float flicker = pow(0.5 + 0.5 * sin(time * 1.7 + flow.x * 131.0), 3.0);
        gl_Position = safeProjection(view);
        float defocus = foregroundDefocus(gl_Position.xy / gl_Position.w * 0.5 + 0.5, resolution.x / resolution.y);
        vAlpha = flowVisibility(t, p) * (0.18 + flicker * 0.72) * mix(1.0, 0.28, defocus);
        vAlpha *= smoothstep(0.2, 1.4, vDistance) * (1.0 - smoothstep(35.0, 50.0, vDistance));
        // Reuse the existing particles: a restrained but visible current follows both final routes.
        vAlpha *= mix(1.0, step(0.5, hash(flow.y * 91.0)) * 0.88, trail);
        float size = mix(0.9 + flow.y * 1.8, 1.3 + flow.y * 1.9, trail);
        gl_PointSize = clamp(size * pixelRatio * mix(8.0, 14.0, trail) / max(vDistance, 0.1),
          mix(1.0, 2.1 * pixelRatio, trail), 8.0);
        gl_PointSize += defocus * 18.0 * pixelRatio;
      }
    `,
    fragmentShader: /* glsl */ `
      ${depthShader}
      varying float vAlpha, vSeed;
      void main() {
        vec2 p = (gl_PointCoord - 0.5) * 2.0;
        float r = dot(p, p);
        if (r > 1.0) discard;
        float glow = exp(-r * 4.5) * (1.0 - smoothstep(0.6, 1.0, r));
        vec3 tint = mix(vec3(0.015, 0.21, 1.0), vec3(0.12, 0.58, 1.0), vSeed);
        tint = mix(tint, vec3(0.54, 0.78, 1.0), smoothstep(0.9, 1.0, vSeed));
        tint = mix(tint, vec3(0.5, 0.86, 1.0), smoothstep(0.45, 0.96, chapter) * 0.5);
        gl_FragColor = vec4(tint * 1.5 * (1.0 + boost * 1.5), glow * vAlpha * depthVisibility() * (1.0 + boost));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const points = new THREE.Points(geometry, pointMaterial);
  points.frustumCulled = false;
  points.name = "Courtyard_passing_sparks";

  // Screen-facing strips retain a fine core and a soft halo at every viewport size.
  const strands = small ? 16 : 27;
  const segments = small ? 240 : 384;
  const ribbonGeometry = new THREE.BufferGeometry();
  const ribbonFlow: number[] = [];
  const sides: number[] = [];
  const indices: number[] = [];
  for (let strand = 0; strand < strands; strand++) {
    const branch = strand % 2;
    const strandSeed = (strand + 0.5) / strands;
    const base = ribbonFlow.length / 3;
    for (let step = 0; step <= segments; step++) {
      for (const side of [-1, 1]) {
        ribbonFlow.push(step / segments, strandSeed, branch);
        sides.push(side);
      }
      if (step < segments) {
        const i = base + step * 2;
        indices.push(i, i + 1, i + 2, i + 1, i + 3, i + 2);
      }
    }
  }
  ribbonGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(new Float32Array(ribbonFlow.length), 3),
  );
  ribbonGeometry.setAttribute("flow", new THREE.Float32BufferAttribute(ribbonFlow, 3));
  ribbonGeometry.setAttribute("side", new THREE.Float32BufferAttribute(sides, 1));
  ribbonGeometry.setIndex(indices);
  const ribbonMaterial = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    forceSinglePass: true,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 flow;
      attribute float side;
      uniform vec2 resolution;
      uniform float pixelRatio;
      varying float vSide, vAlpha, vDistance, vEnergy, vDefocus, vPulse, vWidth;
      ${flowShader}
      void main() {
        vec3 p = flowAt(flow.x, flow.y, flow.z);
        vec3 ahead = flowAt(min(flow.x + 0.004, 1.0), flow.y, flow.z);
        vec3 behind = flowAt(max(flow.x - 0.004, 0.0), flow.y, flow.z);
        vec4 view = viewMatrix * vec4(p, 1.0);
        vec4 clip = safeProjection(view);
        vec4 a = safeProjection(viewMatrix * vec4(ahead, 1.0));
        vec4 b = safeProjection(viewMatrix * vec4(behind, 1.0));
        vec2 tangent = (a.xy / a.w - b.xy / b.w) * resolution;
        vec2 direction = tangent / max(length(tangent), 0.0001);
        vec2 normal = vec2(-direction.y, direction.x);
        float orbit = smoothstep(0.69, 0.96, chapter);
        float heroProminent = step(0.8, hash(flow.y * 17.0));
        // Alternate accents between both currents, including the smaller mobile strand count.
        float trailProminent = 1.0 - step(0.5, abs(mod(floor(flow.y * ${strands.toFixed(1)}), 7.0) - 2.0));
        float prominent = mix(heroProminent, trailProminent, smoothstep(0.45, 0.85, chapter));
        float phase = fract(time * (0.055 + flow.y * 0.04) + flow.y * 5.0);
        float travel = fract(flow.x - phase + 1.0);
        float pulse = exp(-pow((travel - 0.12) / 0.11, 2.0) * 2.0);
        // The strip is wider than the visible line so it carries a neon sheath and halo.
        float width = (mix(3.0, 12.0, prominent) + pulse * prominent * 3.0) * (1.0 + boost * 0.9);
        float slender = mix(3.5, 42.0, prominent) + pulse * prominent * 6.0;
        slender *= 0.8 + sin(flow.x * 44.0 + flow.y * 31.0 + time * 0.2) * 0.2;
        width = mix(width, slender, orbit);
        vDefocus = foregroundDefocus(clip.xy / clip.w * 0.5 + 0.5, resolution.x / resolution.y);
        float speedBlur = smoothstep(0.1, 0.34, chapter) * (1.0 - smoothstep(0.55, 0.88, chapter));
        vDefocus = max(vDefocus, speedBlur * smoothstep(0.08, 0.5, length(clip.xy / clip.w)) * 0.3);
        width += vDefocus * 15.0;
        clip.xy += normal * side * width * pixelRatio / resolution * clip.w;
        vSide = side;
        vWidth = width;
        vPulse = pulse;
        vEnergy = prominent;
        vAlpha = flowVisibility(flow.x, p) * mix(0.07 + pulse * 0.3, 0.4 + pulse * 0.6, prominent)
          * mix(1.0, 0.24, vDefocus);
        // Individual hairs remain legible; only a few travelling accents carry a hot core.
        float orbitalAlpha = mix(0.25 + pulse * 0.25, 0.55 + pulse * 0.55, prominent);
        float irregularity = mix(0.7, 0.86, prominent)
          + mix(0.3, 0.14, prominent) * sin(flow.x * 87.964594 + flow.y * 31.0 - time * 0.18);
        vAlpha = mix(vAlpha, flowVisibility(flow.x, p) * orbitalAlpha * irregularity, orbit);
        vDistance = -view.z;
        vAlpha *= smoothstep(0.2, 1.4, vDistance) * (1.0 - smoothstep(35.0, 50.0, vDistance));
        gl_Position = clip;
      }
    `,
    fragmentShader: /* glsl */ `
      ${depthShader}
      varying float vSide, vAlpha, vEnergy, vDefocus, vPulse, vWidth;
      void main() {
        // Neon layers matching the cube outline: a hot white-cyan filament, a saturated blue
        // sheath and a faint wide halo. Defocused foreground strands soften into the halo.
        float d2 = vSide * vSide;
        float sharp = 1.0 - vDefocus;
        float filament = exp(-d2 * mix(8.0, mix(90.0, 60.0, vEnergy), sharp)) * sharp;
        float sheath = exp(-d2 * mix(4.0, mix(14.0, 10.0, vEnergy), sharp));
        float halo = exp(-d2 * 2.2);
        vec3 light = vec3(0.45, 0.8, 1.0) * filament * (1.3 + vPulse * 1.6)
          + vec3(0.02, 0.32, 1.0) * sheath * (0.7 + vPulse * 0.5)
          + vec3(0.004, 0.12, 1.0) * halo * (0.16 + vPulse * 0.2);
        // Subpixel antialiasing keeps the final intertwined filaments thin and continuous.
        float across = abs(vSide * vWidth * 0.5);
        float aa = max(fwidth(across), 0.25) * 0.65;
        float coreWidth = mix(0.3, 0.62, vEnergy);
        float fine = 1.0 - smoothstep(coreWidth - aa, coreWidth + aa, across);
        float localGlow = exp(-across * across / 5.0);
        float scattering = exp(-across * across / 160.0)
          * (1.0 - smoothstep(0.55, 1.0, abs(vSide)));
        vec3 neon = mix(vec3(0.12, 0.48, 1.0), vec3(0.6, 0.9, 1.0), vEnergy)
          * fine * (1.25 + vPulse * 2.0)
          + vec3(0.01, 0.24, 1.0) * localGlow * (0.35 + vPulse * 0.4) * vEnergy
          + vec3(0.004, 0.09, 1.0) * scattering * 0.09 * vEnergy;
        light = mix(light, neon, smoothstep(0.69, 0.96, chapter));
        gl_FragColor = vec4(light * 1.4 * (1.0 + boost * 1.8), vAlpha * depthVisibility() * (1.0 + boost * 0.6));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const ribbons = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
  ribbons.frustumCulled = false;
  ribbons.name = "Courtyard_light_filaments";
  const group = new THREE.Group();
  group.add(ribbons, points);
  return {
    group,
    dispose() {
      geometry.dispose();
      pointMaterial.dispose();
      ribbonGeometry.dispose();
      ribbonMaterial.dispose();
      routeMap.dispose();
    },
  };
}
