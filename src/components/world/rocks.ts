import * as THREE from "three";
import { createWorldLightPaths } from "./paths";

/** One instanced field: each stone revolves around, and travels along, a light current. */
export function createWorldRocks(
  small: boolean,
  options: {
    paths?: readonly THREE.Curve<THREE.Vector3>[];
    count?: number;
    sizeScale?: number;
    orbitScale?: number;
  } = {},
) {
  const group = new THREE.Group();
  group.name = "Orbiting_trail_rocks";
  group.visible = false;
  const paths = options.paths ?? createWorldLightPaths().slice(2);
  const geometry = new THREE.IcosahedronGeometry(1, small ? 2 : 3);
  const vertices = geometry.getAttribute("position");
  const vertex = new THREE.Vector3();
  for (let i = 0; i < vertices.count; i++) {
    vertex.fromBufferAttribute(vertices, i);
    const shape =
      1 +
      Math.sin(vertex.x * 8.3 + vertex.z * 5.1) * 0.15 +
      Math.cos(vertex.y * 12.7 - vertex.x * 4.6) * 0.075;
    vertex.multiplyScalar(shape);
    vertices.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color: 0x626876,
    roughness: 0.96,
    metalness: 0.04,
    alphaHash: true,
    opacity: 0,
  });
  // Object-space mineral grain has no UV seams and remains attached as each stone rotates.
  // It shares the existing material and draw call, without a texture download.
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = `varying vec3 vStonePosition;\n${shader.vertexShader}`.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\nvStonePosition = position;",
    );
    shader.fragmentShader =
      /* glsl */ `
      varying vec3 vStonePosition;
      float stoneHash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1) * 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float stoneNoise(vec3 p) {
        vec3 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(stoneHash(i), stoneHash(i + vec3(1,0,0)), f.x),
            mix(stoneHash(i + vec3(0,1,0)), stoneHash(i + vec3(1,1,0)), f.x), f.y),
          mix(mix(stoneHash(i + vec3(0,0,1)), stoneHash(i + vec3(1,0,1)), f.x),
            mix(stoneHash(i + vec3(0,1,1)), stoneHash(i + vec3(1,1,1)), f.x), f.y), f.z);
      }
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <map_fragment>",
      /* glsl */ `#include <map_fragment>
        float mineral = stoneNoise(vStonePosition * 2.8);
        float footprint = max(length(dFdx(vStonePosition)), length(dFdy(vStonePosition)));
        float pores = mix(stoneNoise(vStonePosition * 18.0), 0.5,
          smoothstep(0.4, 1.8, footprint * 18.0));
        float grit = mix(stoneNoise(vStonePosition * 60.0), 0.5,
          smoothstep(0.25, 0.9, footprint * 60.0));
        diffuseColor.rgb *= mix(0.78, 1.06, mineral)
          * (1.0 - smoothstep(0.72, 0.9, pores) * 0.16);
      `,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <roughnessmap_fragment>",
      "#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor + (pores - 0.5) * 0.12, 0.85, 1.0);",
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <normal_fragment_maps>",
      /* glsl */ `#include <normal_fragment_maps>
        vec3 surfaceX = dFdx(-vViewPosition), surfaceY = dFdy(-vViewPosition);
        float stoneScale = length(surfaceX) / max(length(dFdx(vStonePosition)), 0.0001);
        float grainHeight = (pores * 0.015 + grit * 0.003) * stoneScale;
        vec3 reliefX = cross(surfaceY, normal), reliefY = cross(normal, surfaceX);
        float determinant = dot(surfaceX, reliefX) * faceDirection;
        if (abs(determinant) > 1e-8) {
          vec3 gradient = sign(determinant)
            * (dFdx(grainHeight) * reliefX + dFdy(grainHeight) * reliefY);
          normal = normalize(normal - gradient / abs(determinant));
        }
      `,
    );
  };
  material.customProgramCacheKey = () => "hugo-mineral-grain-v1";
  const count = options.count ?? (small ? 34 : 64);
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = "Floating_mineral_fragments";
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  group.add(mesh);
  let seed = 92147;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const stones = Array.from({ length: count }, (_, index) => ({
    path: paths[index % paths.length]!,
    phase: random(),
    speed: 0.006 + random() * 0.007,
    orbit: random() * Math.PI * 2,
    orbitSpeed: (index % 2 ? 1 : -1) * (0.055 + random() * 0.09),
    radius: (0.45 + random() * 1.15) * (options.orbitScale ?? 1),
    size:
      (index % 10 === 0 ? 0.25 + random() * 0.16 : 0.035 + random() ** 2 * 0.17) *
      (options.sizeScale ?? 1),
    spin: random() * Math.PI * 2,
    shape: new THREE.Vector3(0.7 + random() * 0.5, 0.7 + random() * 0.5, 0.7 + random() * 0.5),
  }));
  const dummy = new THREE.Object3D();
  const tangent = new THREE.Vector3();
  const side = new THREE.Vector3();
  const up = new THREE.Vector3();
  const vertical = new THREE.Vector3(0, 1, 0);
  const tint = new THREE.Color();
  stones.forEach((_, i) => mesh.setColorAt(i, tint.setScalar(0.6 + random() * 0.4)));

  return {
    group,
    prepare() {
      group.visible = true;
    },
    update(time: number, progress: number) {
      group.visible = progress > 0.28;
      if (!group.visible) return;
      material.opacity = THREE.MathUtils.smoothstep(progress, 0.28, 0.64);
      for (let i = 0; i < stones.length; i++) {
        const stone = stones[i]!;
        const t = (stone.phase + time * stone.speed) % 1;
        stone.path.getPointAt(t, dummy.position);
        stone.path.getTangentAt(t, tangent);
        side.crossVectors(tangent, vertical).normalize();
        up.crossVectors(side, tangent).normalize();
        const angle = stone.orbit + time * stone.orbitSpeed;
        dummy.position
          .addScaledVector(side, Math.cos(angle) * stone.radius)
          .addScaledVector(up, Math.sin(angle) * stone.radius * 0.75);
        dummy.rotation.set(stone.spin + time * 0.07, stone.spin - time * 0.1, time * 0.04);
        // Both ends lie beyond the composition; taper the wrap so nothing teleports into view.
        const visible =
          THREE.MathUtils.smoothstep(t, 0, 0.06) * (1 - THREE.MathUtils.smoothstep(t, 0.93, 1));
        dummy.scale.copy(stone.shape).multiplyScalar(stone.size * visible);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      mesh.dispose();
    },
  };
}
