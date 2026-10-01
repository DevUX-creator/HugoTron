import * as THREE from "three";

type OutlineUniforms = {
  time: { value: number };
  edgeTime: { value: number };
  glassHover: { value: number };
  cubeMatrix: { value: THREE.Matrix4 };
  formed: { value: number };
  pixelRatio: { value: number };
  tDepth: { value: THREE.DepthTexture | null };
  resolution: { value: THREE.Vector2 };
  nearClip: { value: number };
  farClip: { value: number };
};

/** Fine, tapering currents drift along the cube edges, with restrained blue glow. */
export function createCubeOutline(uniforms: OutlineUniforms) {
  const positions: number[] = [];
  const starts: number[] = [];
  const ends: number[] = [];
  const motion: number[] = [];
  const indices: number[] = [];
  const half = 0.524;
  const corners = [
    [-half, half],
    [half, half],
    [half, -half],
    [-half, -half],
  ] as const;
  function edge(a: number[], b: number[], phase: number, speed: number) {
    const base = positions.length / 3;
    for (const [along, side] of [
      [0, -1],
      [1, -1],
      [0, 1],
      [1, 1],
    ] as const) {
      positions.push(along, side, 0);
      starts.push(...a);
      ends.push(...b);
      motion.push(phase, speed);
    }
    indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
  }
  for (let i = 0; i < 4; i++) {
    const [x, z] = corners[i]!;
    const [nextX, nextZ] = corners[(i + 1) % 4]!;
    edge([x, half, z], [nextX, half, nextZ], i, 0.4);
    edge([nextX, -half, nextZ], [x, -half, z], 3 - i + 1.6, 0.34);
    edge([x, -half, z], [x, half, z], i + 0.65, 0.46);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("edgeStart", new THREE.Float32BufferAttribute(starts, 3));
  geometry.setAttribute("edgeEnd", new THREE.Float32BufferAttribute(ends, 3));
  geometry.setAttribute("edgeMotion", new THREE.Float32BufferAttribute(motion, 2));
  geometry.setIndex(indices);
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    forceSinglePass: true,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 edgeStart, edgeEnd;
      attribute vec2 edgeMotion;
      uniform mat4 cubeMatrix;
      uniform vec2 resolution;
      uniform float pixelRatio;
      varying float vAcross, vAlong, vLength;
      varying vec2 vMotion, vStartUv, vEndUv, vDepthEnds;
      void main() {
        vec4 aView = viewMatrix * cubeMatrix * vec4(edgeStart, 1.0);
        vec4 bView = viewMatrix * cubeMatrix * vec4(edgeEnd, 1.0);
        vec4 a = projectionMatrix * aView;
        vec4 b = projectionMatrix * bView;
        vec4 clip = mix(a, b, position.x);
        vec2 line = (b.xy / b.w - a.xy / a.w) * resolution * 0.5;
        float pixels = max(length(line), 1.0);
        vec2 direction = line / pixels;
        vec2 normal = vec2(-direction.y, direction.x);
        float padding = 22.0 * pixelRatio;
        vec2 offset = (normal * position.y + direction * (position.x * 2.0 - 1.0)) * padding * 2.0 / resolution;
        vStartUv = a.xy / a.w * 0.5 + 0.5;
        vEndUv = b.xy / b.w * 0.5 + 0.5;
        vDepthEnds = vec2(-aView.z, -bView.z);
        vAcross = position.y * 22.0;
        vAlong = mix(-padding / pixels, 1.0 + padding / pixels, position.x);
        vLength = pixels / pixelRatio;
        vMotion = edgeMotion;
        // Screen-space interpolation keeps the padded glow and depth samples on the same segment.
        gl_Position = vec4(clip.xy / clip.w + offset, clip.z / clip.w, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      #include <packing>
      uniform sampler2D tDepth;
      uniform vec2 resolution;
      uniform float nearClip, farClip, formed, time, edgeTime, glassHover;
      varying float vAcross, vAlong, vLength;
      varying vec2 vMotion, vStartUv, vEndUv, vDepthEnds;
      float depthAt(vec2 uv) {
        return -perspectiveDepthToViewZ(texture2D(tDepth, clamp(uv, 0.001, 0.999)).x, nearClip, farClip);
      }
      void main() {
        float along = clamp(vAlong, 0.0, 1.0);
        vec2 centerUv = mix(vStartUv, vEndUv, along);
        float distance = 1.0 / mix(1.0 / vDepthEnds.x, 1.0 / vDepthEnds.y, along);
        float centerSurface = depthAt(centerUv);
        float surface = depthAt(gl_FragCoord.xy / resolution);
        // Test the line centre so hidden rear edges cannot leak a halo outside the silhouette.
        float visible = (1.0 - smoothstep(0.025, 0.08, distance - centerSurface))
          * (1.0 - smoothstep(0.08, 0.22, distance - surface));
        float travel = mod(edgeTime * vMotion.y - vMotion.x - along + 8.0, 4.0);
        float head = exp(-pow(min(travel, 4.0 - travel) / 0.15, 2.0));
        float tail = exp(-travel * 4.0);
        float secondary = exp(-pow((travel - 2.05) / 0.3, 2.0)) * 0.28;
        float charge = head + secondary;
        float wave = 0.5 + 0.5 * sin(along * 8.0 - time * 0.48 + vMotion.x * 2.3);
        float grain = 0.5 + 0.5 * sin(along * 21.0 + time * 0.35 + vMotion.x * 4.1);
        // The thin base thread swells and tapers locally, like the longer filaments in the scene.
        float width = 0.17 + wave * wave * 0.22 + grain * 0.08 + tail * 0.3 + charge * 0.24;
        float bend = sin(along * 3.14159265) * (sin(along * 10.0 - time * 0.55 + vMotion.x) * 0.75
          + sin(along * 24.0 + time * 0.75) * 0.2);
        float across = vAcross - bend;
        float cap = max(max(-vAlong, vAlong - 1.0), 0.0) * vLength;
        float radius2 = across * across + cap * cap;
        float aa = max(fwidth(vAcross) * 0.5, 0.25);
        float core = exp(-radius2 / max(width * width, aa * aa)) * min(1.0, width / aa);
        float sheath = exp(-radius2 / pow(width + 0.6, 2.0));
        float halo = exp(-radius2 / (12.0 + wave * 9.0 + charge * 8.0));
        float aura = exp(-radius2 / 80.0);
        float strand = exp(-pow((across - 0.8 - wave * 0.35) / 0.3, 2.0) - cap * cap) * tail;
        float energy = (0.28 + tail * 0.32 + charge * (0.65 + glassHover * 0.1)) * (0.65 + wave * 0.35);
        vec3 light = vec3(0.3, 0.68, 1.0) * core * energy
          + vec3(0.025, 0.34, 1.0) * sheath * energy * 0.48
          + vec3(0.003, 0.16, 1.0) * halo * (0.085 + charge * 0.12)
          + vec3(0.001, 0.07, 0.5) * aura * (0.045 + charge * 0.06)
          + vec3(0.1, 0.45, 1.0) * strand * 0.22;
        gl_FragColor = vec4(light, visible * formed * formed);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "Hugo_neon_blue_edges";
  mesh.frustumCulled = false;
  return {
    mesh,
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
