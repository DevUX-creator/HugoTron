import * as THREE from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import type { CoreInstallation } from "./installationCore";
import { foregroundFocusShader } from "./focus";

/** One model render with depth blur, terrain dissolve, haze and occluded light motes. */
export function createWorldAtmosphere(
  renderer: THREE.WebGLRenderer,
  small: boolean,
  beams: readonly [THREE.SpotLight, THREE.SpotLight, THREE.SpotLight],
  installation: CoreInstallation,
) {
  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    samples: small ? 0 : 2,
    depthTexture: new THREE.DepthTexture(1, 1, THREE.UnsignedIntType),
  });
  const uniforms = {
    tColor: { value: target.texture },
    tDepth: { value: target.depthTexture },
    resolution: { value: new THREE.Vector2() },
    focus: { value: 11 },
    nearClip: { value: 0.1 },
    farClip: { value: 80 },
    dark: { value: 1 },
    time: { value: 0 },
    arrival: { value: 1 },
    chapter: installation.uniforms.chapter,
    inverseProjection: { value: new THREE.Matrix4() },
    cameraWorld: { value: new THREE.Matrix4() },
    cubeInverse: { value: new THREE.Matrix4() },
    backgroundColor: { value: new THREE.Color() },
    beamFromA: { value: new THREE.Vector2() },
    beamFromB: { value: new THREE.Vector2() },
    beamToA: { value: new THREE.Vector2() },
    beamToB: { value: new THREE.Vector2() },
    beamPower: { value: new THREE.Vector2() },
    treeBeamFrom: { value: new THREE.Vector3() },
    treeBeamTo: { value: new THREE.Vector3() },
    treeBeamPower: { value: 0 },
    core: { value: new THREE.Vector3() },
    coreRadius: { value: 0.1 },
    coreStrength: installation.uniforms.coreFormed,
    lensPointer: installation.uniforms.lensPointer,
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <packing>
      #include <dithering_pars_fragment>
      uniform sampler2D tColor;
      uniform sampler2D tDepth;
      uniform vec2 resolution;
      uniform vec2 lensPointer;
      uniform float focus, nearClip, farClip, dark, time, arrival, chapter;
      uniform mat4 inverseProjection, cameraWorld, cubeInverse;
      uniform vec3 backgroundColor;
      uniform vec2 beamFromA, beamFromB, beamToA, beamToB, beamPower;
      uniform vec3 treeBeamFrom, treeBeamTo;
      uniform float treeBeamPower;
      uniform vec3 core;
      uniform float coreRadius, coreStrength;
      varying vec2 vUv;

      ${foregroundFocusShader}

      float distanceAt(vec2 uv) {
        return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, nearClip, farClip);
      }

      float lightShaft(vec2 source, vec2 aim, vec2 widths, float definition, float phase) {
        vec2 aspect = vec2(resolution.x / resolution.y, 1.0);
        vec2 axis = (aim - source) * aspect;
        vec2 relative = (vUv - source) * aspect;
        float along = dot(relative, axis) / max(dot(axis, axis), 0.001);
        float across = length(relative - axis * along);
        float spread = mix(widths.x, widths.y, clamp(along, 0.0, 1.0));
        float cone = exp(-pow(across / spread, 2.0) * definition);
        float thread = 0.94 + 0.06 * sin(along * 3.0 + time * 0.18 + phase);
        return cone * thread * smoothstep(-0.05, 0.15, along)
          * (1.0 - smoothstep(0.65, 1.5, along));
      }

      // A narrow rear shaft with a defined edge and real depth occlusion.
      // It stops at the branch, instead of adding another diffuse screen glow.
      float treeShaft(float sceneDistance) {
        vec2 aspect = vec2(resolution.x / resolution.y, 1.0);
        vec2 axis = (treeBeamTo.xy - treeBeamFrom.xy) * aspect;
        vec2 offset = (vUv - treeBeamFrom.xy) * aspect;
        float along = dot(offset, axis) / max(dot(axis, axis), 0.0001);
        float travel = clamp(along, 0.0, 1.0);
        float across = length(offset - axis * along);
        // A broad, feathered falloff rather than a hard-edged ray.
        float width = mix(0.01, 0.045, travel);
        float edge = exp(-pow(across / width, 2.0) * 1.6);
        float beamDepth = 1.0 / mix(1.0 / treeBeamFrom.z, 1.0 / treeBeamTo.z, travel);
        float visible = smoothstep(-0.08, 0.12, sceneDistance - beamDepth);
        return edge * visible * smoothstep(0.0, 0.16, along)
          * (1.0 - smoothstep(0.88, 1.04, along));
      }

      void main() {
        float depth = texture2D(tDepth, vUv).x;
        float distance = -perspectiveDepthToViewZ(depth, nearClip, farClip);
        vec4 view = inverseProjection * vec4(vUv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
        vec3 world = (cameraWorld * vec4(view.xyz / view.w, 1.0)).xyz;
        // Protect the actual cube surfaces, not a circular clear patch over the background.
        // The full-screen entrance blur still runs afterwards, so the focus pull is preserved.
        ${
          small
            ? `vec3 cubeLocal = abs((cubeInverse * vec4(world, 1.0)).xyz);
        float cubeFocus = (1.0 - smoothstep(0.54, 0.61, max(cubeLocal.x, max(cubeLocal.y, cubeLocal.z))))
          * coreStrength * (1.0 - smoothstep(0.03, 0.23, chapter));`
            : "float cubeFocus = 0.0;"
        }
        // Rear depth blur plus a feathered near-field lens at the bottom of the viewport.
        float rearBlur = smoothstep(mix(0.4, 1.5, chapter), mix(4.8, 6.0, chapter), distance - focus) * 7.5;
        float nearField = 1.0 - smoothstep(focus - 1.5, focus + 0.1, distance);
        float aspect = resolution.x / resolution.y;
        float veil = foregroundVeil(vUv, time) * foregroundClear(vUv, aspect, lensPointer) * nearField;
        float flightForeground = sin(chapter * 3.141593)
          * (1.0 - smoothstep(focus - 3.0, focus - 1.5, distance)) * 32.0;
        float foregroundBlur = max(foregroundSoftness(vUv, aspect, lensPointer, time) * nearField * 15.0,
          flightForeground);
        float blur = max(rearBlur, foregroundBlur) * (1.0 - cubeFocus);
        veil *= 1.0 - cubeFocus;
        vec3 color = texture2D(tColor, vUv).rgb;
        float weight = 1.0;
        if (blur > 0.15) {
          for (int i = 0; i < 16; i++) {
            float fi = float(i) + 0.5;
            float angle = fi * 2.39996323;
            vec2 offset = vec2(cos(angle), sin(angle)) * sqrt(fi / 16.0);
            vec2 sampleUv = clamp(vUv + offset * blur / resolution, 0.001, 0.999);
            // Reject nearer silhouettes so a blurred background never smears over a pillar.
            float sampleWeight = smoothstep(-1.0, -0.15, distanceAt(sampleUv) - distance);
            sampleWeight = mix(sampleWeight, 1.0, step(rearBlur + 0.01, foregroundBlur));
            color += texture2D(tColor, sampleUv).rgb * sampleWeight;
            weight += sampleWeight;
          }
        }
        color /= weight;
        // A light, broken foreground veil remains after arrival; its clear gaps preserve depth.
        color = mix(color, color * vec3(0.88, 0.97, 1.08) + vec3(0.0015, 0.003, 0.006), veil * 0.35);

        // Dissolve the finite terrain in world space, independent of screen size and camera angle.
        float radius = length(world.xz);
        float lowGround = 1.0 - smoothstep(0.55, 1.6, world.y);
        float terrainFade = smoothstep(2.8, 5.65, radius) * lowGround;
        float outerFade = smoothstep(4.7, 6.15, radius);
        float presence = mix((1.0 - terrainFade) * (1.0 - outerFade), 1.0, smoothstep(0.08, 0.22, chapter))
          * smoothstep(0.0, 0.42, arrival);
        vec2 p = vUv - vec2(0.5, 0.48);
        p.x *= resolution.x / resolution.y;
        // Wide, feathered scattering from the same sources as the scene lights.
        float beamA = lightShaft(beamFromA, beamToA, vec2(0.026, 0.21), 2.1, 0.0) * beamPower.x;
        float beamB = lightShaft(beamFromB, beamToB, vec2(0.07, 0.28), 1.4, 2.0) * beamPower.y;
        float beam = beamA + beamB * 0.3;
        vec2 air = p - vec2(sin(time * 0.12) * 0.14, -0.14 + sin(time * 0.15) * 0.035);
        float haze = exp(-dot(air * vec2(0.72, 1.8), air * vec2(0.72, 1.8)) * 1.4);
        float wisps = 0.78 + 0.12 * sin(p.x * 5.0 + p.y * 8.0 - time * 0.27)
          + 0.1 * sin(p.x * 8.0 - p.y * 4.0 + time * 0.19);
        vec3 airColor = backgroundColor + mix(vec3(0.0028, 0.0038, 0.0062),
          vec3(0.002, 0.006, 0.018), chapter) * haze * wisps * dark;
        float pathLength = min(distance, focus + 7.0);
        float airDepth = 1.0 - exp(-max(pathLength - focus * 0.4, 0.0) * 0.045);
        // One shared air colour across surfaces and empty space removes the pasted-on silhouette.
        color = mix(color, airColor, airDepth * haze * mix(0.16, 0.42, dark) * mix(1.0, 0.15, cubeFocus));
        color = mix(airColor, color, presence);
        // Let unlit peripheral geometry merge into the navy air, without outlining the model's limits.
        float peripheral = smoothstep(0.38, 0.76, abs(p.x));
        float unlit = 1.0 - smoothstep(0.002, 0.015, dot(color, vec3(0.2126, 0.7152, 0.0722)));
        color = mix(color, airColor, peripheral * unlit * dark * 0.9);
        // Most mist sits within and behind the courtyard, leaving foreground stone richly shaded.
        float scattering = 1.0 - exp(-max(pathLength - focus * 0.75, 0.0) * 0.12);
        color += vec3(0.085, 0.099, 0.122) * beam * scattering * mix(0.2, 1.0, dark) * (1.0 - chapter);
        color += vec3(0.025, 0.034, 0.052) * treeShaft(distance) * treeBeamPower
          * smoothstep(0.15, 0.8, arrival);
        float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
        color = mix(vec3(luminance), color, mix(0.96, 0.86, dark));
        // A local optical halo belongs to the luminous cube; nearer columns occlude it.
        vec2 haloUv = (vUv - core.xy) * vec2(resolution.x / resolution.y, 1.0);
        float halo = exp(-dot(haloUv, haloUv) / max(coreRadius * coreRadius, 0.0001) * 2.2);
        float haloVisibility = smoothstep(-0.65, 0.4, distance - core.z);
        float corePulse = 0.97 + 0.03 * sin(time * 0.9);
        color += vec3(0.002, 0.045, 0.12) * halo * haloVisibility * coreStrength * corePulse * mix(0.2, 1.0, dark);
        color *= 1.0 - smoothstep(0.35, 1.3, length(p)) * mix(0.06, 0.27, dark);
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <dithering_fragment>
      }
    `,
    dithering: true,
  });
  const quad = new FullScreenQuad(material);
  // Only during arrival, blur the complete composite so silhouettes soften as well as textures.
  // A half-resolution target is released as soon as focus lands; idle rendering has no extra pass.
  let openingTarget: THREE.WebGLRenderTarget | null = null;
  const openingUniforms = {
    tColor: { value: null as THREE.Texture | null },
    resolution: uniforms.resolution,
    radius: { value: 0 },
    travel: { value: 0 },
    center: uniforms.core,
  };
  /** The hand-off to Daylight reuses the dive's streaking blur, so both transitions match. */
  let leave = 0;
  const openingMaterial = new THREE.ShaderMaterial({
    uniforms: openingUniforms,
    depthTest: false,
    depthWrite: false,
    vertexShader: material.vertexShader,
    fragmentShader: /* glsl */ `
      uniform sampler2D tColor;
      uniform vec2 resolution;
      uniform float radius, travel;
      uniform vec3 center;
      varying vec2 vUv;
      void main() {
        vec3 color = texture2D(tColor, vUv).rgb;
        float weight = 1.0;
        vec2 fromCenter = vUv - center.xy;
        float edge = smoothstep(0.2, 0.65, length(fromCenter * vec2(resolution.x / resolution.y, 1.0)));
        float softness = radius * mix(1.0, edge, travel);
        for (int i = 0; i < 16; i++) {
          float fi = float(i) + 0.5;
          float r = sqrt(fi / 16.0);
          vec2 offset = vec2(cos(fi * 2.39996323), sin(fi * 2.39996323)) * r;
          float w = exp(-r * r * 2.0);
          vec2 streak = fromCenter * r * travel * edge * 0.13;
          color += texture2D(tColor, clamp(vUv + offset * softness / resolution - streak, 0.001, 0.999)).rgb * w;
          weight += w;
        }
        gl_FragColor = vec4(color / weight, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const openingQuad = new FullScreenQuad(openingMaterial);

  // Seeded, sparse points with intrinsic soft bokeh: no texture download or bloom pyramid.
  const ambientCount = small ? 230 : 560;
  const foregroundCount = small ? 10 : 18;
  const count = ambientCount + foregroundCount;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const foreground = new Float32Array(count);
  let seed = 4187;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < ambientCount; i++) {
    positions[i * 3] = (random() - 0.5) * 24;
    positions[i * 3 + 1] = 0.2 + random() ** 1.7 * 6.0;
    positions[i * 3 + 2] = (random() - 0.5) * 18;
    seeds[i] = random();
  }
  // Sparse, very soft lens lights stay near the lower edge, below the crisp product space.
  for (let i = ambientCount; i < count; i++) {
    positions[i * 3] = 0.04 + random() * 0.92;
    positions[i * 3 + 1] = 0.015 + random() * 0.22;
    seeds[i] = random();
    foreground[i] = 1;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("foreground", new THREE.BufferAttribute(foreground, 1));
  const pixelRatio = { value: renderer.getPixelRatio() };
  const particleResolution = { value: new THREE.Vector2() };
  const dustOffset = { value: new THREE.Vector3() };
  const dustMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: uniforms.time,
      focus: uniforms.focus,
      dark: uniforms.dark,
      arrival: uniforms.arrival,
      pixelRatio,
      tDepth: uniforms.tDepth,
      resolution: particleResolution,
      nearClip: uniforms.nearClip,
      farClip: uniforms.farClip,
      lensPointer: uniforms.lensPointer,
      worldOffset: dustOffset,
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float seed, foreground;
      uniform float time, focus, pixelRatio, arrival;
      uniform vec2 lensPointer, resolution;
      uniform vec3 worldOffset;
      varying float vAlpha, vSoft, vFlash, vDistance;
      void main() {
        if (foreground > 0.5) {
          vec2 uv = position.xy + vec2(sin(time * 0.13 + seed * 41.0), cos(time * 0.17 + seed * 29.0)) * 0.012;
          uv -= (lensPointer - 0.5) * vec2(0.014, 0.008);
          float clear = smoothstep(0.08, 0.3, length((uv - lensPointer) * vec2(resolution.x / resolution.y, 1.0)));
          vDistance = 0.5;
          vSoft = 1.0;
          vFlash = 0.0;
          vAlpha = (0.035 + seed * 0.05) * (0.75 + sin(time * 0.4 + seed * 23.0) * 0.25) * clear;
          gl_PointSize = (48.0 + seed * seed * 95.0) * pixelRatio;
          gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
          return;
        }
        vec3 p = position;
        p.x = mod(p.x + 12.0 + time * (0.15 + seed * 0.13), 24.0) - 12.0;
        p.x += sin(time * 0.23 + seed * 31.0) * 0.35;
        p.y += sin(time * 0.31 + seed * 19.0 + p.x * 0.35) * 0.42;
        p.z += cos(time * 0.18 + seed * 23.0) * 0.48;
        p.xz += worldOffset.xz;
        vec4 view = modelViewMatrix * vec4(p, 1.0);
        vDistance = -view.z;
        vSoft = smoothstep(1.0, 6.5, abs(vDistance - focus));
        float openingBokeh = 1.0 - smoothstep(0.1, 0.85, arrival);
        vSoft = max(vSoft, openingBokeh);
        // A third of the motes are brief glints with separate periods and phases, fully dark between pulses.
        float phase = fract(time / mix(3.8, 8.5, seed) + seed * 17.7);
        float pulse = smoothstep(0.015, 0.055, phase) * (1.0 - smoothstep(0.07, 0.24, phase));
        float glint = step(0.67, seed);
        vFlash = pulse * glint;
        vAlpha = mix((0.14 + seed * 0.25) * (0.8 + 0.2 * sin(time * 0.5 + seed * 29.0)), pulse, glint);
        vAlpha *= 1.0 - smoothstep(9.5, 12.0, abs(p.x));
        vAlpha *= 1.0 - openingBokeh * 0.35;
        float bokeh = vSoft * mix(2.0, 7.0, step(0.78, seed));
        bokeh += openingBokeh * 45.0 * smoothstep(0.65, 1.0, seed);
        bokeh += vFlash * 4.0;
        gl_PointSize = clamp((1.1 + seed * 1.5 + bokeh) * pixelRatio * 12.0 / max(vDistance, 0.1), 1.0, 64.0);
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: /* glsl */ `
      #include <packing>
      uniform sampler2D tDepth;
      uniform vec2 resolution;
      uniform float dark, nearClip, farClip;
      varying float vAlpha, vSoft, vFlash, vDistance;
      void main() {
        float sceneDepth = texture2D(tDepth, gl_FragCoord.xy / resolution).x;
        float surfaceDistance = -perspectiveDepthToViewZ(sceneDepth, nearClip, farClip);
        if (vDistance > surfaceDistance + 0.03) discard;
        vec2 p = (gl_PointCoord - 0.5) * 2.0;
        float radius = length(p);
        if (radius > 1.0) discard;
        float glow = exp(-radius * radius * mix(12.0, 4.5, vSoft));
        glow *= 1.0 - smoothstep(0.6, 1.0, radius);
        float star = exp(-abs(p.x) * 42.0 - abs(p.y) * 6.0)
          + exp(-abs(p.y) * 42.0 - abs(p.x) * 6.0);
        glow += star * vFlash * (1.0 - vSoft) * 0.25;
        vec3 tint = mix(vec3(0.2, 0.58, 1.0), vec3(0.8, 0.94, 1.0), vFlash) * (1.05 + vFlash * 2.1);
        gl_FragColor = vec4(tint, glow * vAlpha * mix(0.25, 0.95, dark));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const dust = new THREE.Points(geometry, dustMaterial);
  dust.name = "Atmospheric_light_motes";
  dust.frustumCulled = false;
  const particleScene = new THREE.Scene();
  particleScene.add(dust);
  particleScene.add(installation.particles);
  installation.uniforms.tDepth.value = target.depthTexture;
  const projected = new THREE.Vector3();
  const coreView = new THREE.Vector3();
  const coreEdge = new THREE.Vector3();

  function projectPoint(point: THREE.Vector3, output: THREE.Vector2, camera: THREE.Camera) {
    projected.copy(point).project(camera);
    output.set(projected.x * 0.5 + 0.5, projected.y * 0.5 + 0.5);
  }

  function projectWithDepth(point: THREE.Vector3, output: THREE.Vector3, camera: THREE.Camera) {
    projected.copy(point).applyMatrix4(camera.matrixWorldInverse);
    const depth = -projected.z;
    projected.copy(point).project(camera);
    output.set(projected.x * 0.5 + 0.5, projected.y * 0.5 + 0.5, depth);
  }

  return {
    /** The scene's own target: shaders must be compiled against it, not the canvas. */
    renderTarget: target,
    setDark(value: boolean) {
      uniforms.dark.value = value ? 1 : 0;
    },
    resize(width: number, height: number) {
      const ratio = renderer.getPixelRatio();
      renderer.getDrawingBufferSize(particleResolution.value);
      target.setSize(particleResolution.value.x, particleResolution.value.y);
      openingTarget?.setSize(Math.round(width * 0.5), Math.round(height * 0.5));
      // Blur radius stays consistent in CSS pixels across displays.
      uniforms.resolution.value.set(width, height);
      installation.uniforms.resolution.value.copy(particleResolution.value);
      installation.uniforms.pixelRatio.value = ratio;
      pixelRatio.value = ratio;
    },
    setLeave(value: number) {
      leave = value;
    },
    render(
      scene: THREE.Scene,
      camera: THREE.PerspectiveCamera,
      focus: number,
      time: number,
      arrival: number,
    ) {
      uniforms.focus.value = focus;
      uniforms.time.value = time;
      uniforms.arrival.value = arrival;
      uniforms.nearClip.value = camera.near;
      uniforms.farClip.value = camera.far;
      uniforms.inverseProjection.value.copy(camera.projectionMatrixInverse);
      uniforms.cameraWorld.value.copy(camera.matrixWorld);
      uniforms.cubeInverse.value.copy(installation.uniforms.cubeMatrix.value).invert();
      uniforms.backgroundColor.value.copy(scene.background as THREE.Color);
      // Keep air continuous throughout the forward flight along the light trails.
      dustOffset.value.set(camera.position.x * 0.25, 0, Math.min(0, camera.position.z - 7.13));
      projectPoint(beams[0].position, uniforms.beamFromA.value, camera);
      projectPoint(beams[0].target.position, uniforms.beamToA.value, camera);
      projectPoint(beams[1].position, uniforms.beamFromB.value, camera);
      projectPoint(beams[1].target.position, uniforms.beamToB.value, camera);
      uniforms.beamPower.value.set(beams[0].intensity / 620, beams[1].intensity / 190);
      projectWithDepth(beams[2].position, uniforms.treeBeamFrom.value, camera);
      projectWithDepth(beams[2].target.position, uniforms.treeBeamTo.value, camera);
      uniforms.treeBeamPower.value = beams[2].intensity / 90;
      coreView.copy(installation.group.position).applyMatrix4(camera.matrixWorldInverse);
      if (coreView.z < -camera.near && installation.uniforms.coreFormed.value > 0.01) {
        projected.copy(installation.group.position).project(camera);
        uniforms.core.value.set(projected.x * 0.5 + 0.5, projected.y * 0.5 + 0.5, -coreView.z);
        coreEdge.copy(installation.group.position);
        coreEdge.x += 1.65;
        coreEdge.project(camera);
        uniforms.coreRadius.value = Math.min(
          0.4,
          Math.abs(coreEdge.x - projected.x) * 0.5 * camera.aspect,
        );
      } else {
        // The core has disappeared. The blur follows the trails, with no residual central halo.
        projectWithDepth(installation.uniforms.journeyCenter.value, uniforms.core.value, camera);
        uniforms.coreRadius.value = 0.08;
      }
      installation.uniforms.nearClip.value = camera.near;
      installation.uniforms.farClip.value = camera.far;
      renderer.info.reset();
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      const focusPull = 1 - THREE.MathUtils.smoothstep(arrival, 0.08, 0.86);
      const travelBlur = Math.max(
        THREE.MathUtils.smoothstep(uniforms.chapter.value, 0.06, 0.3) *
          (1 - THREE.MathUtils.smoothstep(uniforms.chapter.value, 0.52, 0.88)),
        leave,
      );
      if (focusPull > 0 || travelBlur > 0.001) {
        if (!openingTarget) {
          openingTarget = new THREE.WebGLRenderTarget(
            Math.round(uniforms.resolution.value.x * 0.5),
            Math.round(uniforms.resolution.value.y * 0.5),
            { type: THREE.HalfFloatType, depthBuffer: false },
          );
          openingUniforms.tColor.value = openingTarget.texture;
        }
        renderer.setRenderTarget(openingTarget);
        quad.render(renderer);
        openingUniforms.radius.value = Math.max(focusPull * 26, travelBlur * 14);
        openingUniforms.travel.value = travelBlur;
        renderer.setRenderTarget(null);
        openingQuad.render(renderer);
      } else {
        if (openingTarget) {
          openingTarget.dispose();
          openingTarget = null;
          openingUniforms.tColor.value = null;
        }
        renderer.setRenderTarget(null);
        quad.render(renderer);
      }
      // Render motes after the terrain dissolve, using its depth texture for real occlusion.
      // This keeps foreground bokeh alive above the ground as it fades into the atmosphere.
      renderer.autoClear = false;
      renderer.render(particleScene, camera);
      renderer.autoClear = true;
    },
    dispose() {
      target.dispose();
      openingTarget?.dispose();
      openingMaterial.dispose();
      openingQuad.dispose();
      material.dispose();
      quad.dispose();
      geometry.dispose();
      dustMaterial.dispose();
    },
  };
}
