import * as THREE from "three";
import { WORLD_FILMS } from "@/content/worldFilms";
import { createWorldJourneyRig, worldCameraFov } from "./journey";
import { WORLD_FLIGHT_END } from "./progress";
import { createWorldFilm } from "./filmTexture";

/** Curved screens share the world camera; the IDEA reference's velocity bend runs on the GPU. */
export function createWorldFilms(
  renderer: THREE.WebGLRenderer,
  depth: THREE.DepthTexture,
  mobile: boolean,
  wake: () => void,
) {
  const scene = new THREE.Scene();
  const anchor = new THREE.Group();
  scene.add(anchor);
  const geometry = new THREE.PlaneGeometry(1, 1, mobile ? 32 : 56, 24);
  const assets = WORLD_FILMS.map((film) => createWorldFilm(film, mobile, wake));
  const resolution = { value: new THREE.Vector2() };
  const view = new THREE.PerspectiveCamera();
  const rig = createWorldJourneyRig();
  const endPosition = new THREE.Vector3();
  const endTarget = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const localRay = new THREE.Ray();
  const inverseWorld = new THREE.Matrix4();
  const paperPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const pointerNdc = new THREE.Vector2();
  const pointerHit = new THREE.Vector3();
  const pointerTarget = new THREE.Vector2();
  let lastAspect = 0;
  let lastCompact = mobile;
  let visible = true;
  let paused = false;
  let previous = 0;
  let flex = 0;
  let active = 0;
  let width = 1;
  let height = 1;

  const panels = WORLD_FILMS.map((_, index) => {
    const film = index;
    const uniforms = {
      filmFlex: { value: 0 },
      filmOffset: { value: 0 },
      filmPeel: { value: 0 },
      filmTime: { value: 0 },
      filmMotion: { value: 0 },
      filmHover: { value: 0 },
      filmPointer: { value: new THREE.Vector2() },
      filmDefocus: { value: 0 },
      filmAspect: { value: 16 / 9 },
      filmShade: { value: 1 },
      filmDepth: { value: depth },
      filmResolution: resolution,
    };
    const material = new THREE.MeshBasicMaterial({
      map: assets[film]!.texture,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
      fog: false,
    });
    material.forceSinglePass = true;
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader =
        `uniform float filmFlex, filmOffset, filmPeel, filmTime, filmMotion, filmHover;
        uniform vec2 filmPointer;
        varying vec2 filmUv;\n${shader.vertexShader}`.replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
        filmUv = uv;
        float distanceToCentre = length(vec2(position.x * 1.6 + filmOffset * 0.35, position.y));
        float falloff = clamp(1.0 - distanceToCentre / 1.4, 0.0, 1.0);
        float bow = pow(sin(falloff * 1.5707963), 1.5);
        transformed.z -= position.x * position.x * 0.27 + bow * filmFlex * 0.16;
        // Broad, slow bends travel towards the free edges; the centre stays quiet.
        float edge = smoothstep(0.08, 0.5, max(abs(position.x), abs(position.y)));
        float ripple = sin(position.x * 3.2 + position.y * 2.4 - filmTime * 0.72) * 0.018
          + sin(position.y * 4.1 - position.x * 1.7 + filmTime * 0.49) * 0.01;
        float twist = sin(filmTime * 0.43) * position.x * position.y * 0.055;
        transformed.z += (ripple * edge + twist) * filmMotion;
        transformed.y += sin(filmTime * 0.65 + position.x * 3.1)
          * position.x * position.x * 0.018 * filmMotion;
        // A broad local lift follows the cursor, flexing whichever edge it approaches.
        vec2 toPointer = (position.xy - filmPointer) * vec2(1.0, 0.75);
        float pointerLift = exp(-dot(toPointer, toPointer) * 9.0);
        transformed.z += filmHover * (pointerLift * 0.095
          + position.x * position.y * filmPointer.x * 0.08);
        float corner = (position.x + 0.5) * (0.75 - position.y * 0.5);
        transformed.z += sin(corner * 3.141593) * filmPeel * 0.2;
        transformed.y -= corner * corner * filmPeel * 0.12;`,
        );
      shader.fragmentShader = `uniform float filmAspect, filmShade, filmDefocus;
        uniform sampler2D filmDepth;
        uniform vec2 filmResolution;
        varying vec2 filmUv;\n${shader.fragmentShader}`.replace(
        "#include <map_fragment>",
        `vec2 sampleUv = filmUv - 0.5;
          float coverRatio = filmAspect / (16.0 / 10.0);
          if (coverRatio > 1.0) sampleUv.x /= coverRatio;
          else sampleUv.y *= coverRatio;
          sampleUv += 0.5;
          vec4 sampledDiffuseColor = texture2D(map, sampleUv);
          if (filmDefocus > 0.0001) {
            sampledDiffuseColor *= 0.36;
            sampledDiffuseColor += texture2D(map, sampleUv + vec2(filmDefocus, 0.0)) * 0.16;
            sampledDiffuseColor += texture2D(map, sampleUv - vec2(filmDefocus, 0.0)) * 0.16;
            sampledDiffuseColor += texture2D(map, sampleUv + vec2(0.0, filmDefocus * 1.6)) * 0.16;
            sampledDiffuseColor += texture2D(map, sampleUv - vec2(0.0, filmDefocus * 1.6)) * 0.16;
          }
          #ifdef DECODE_VIDEO_TEXTURE
            sampledDiffuseColor = sRGBTransferEOTF(sampledDiffuseColor);
          #endif
          diffuseColor *= sampledDiffuseColor;
          diffuseColor.rgb *= filmShade;
          float sceneDepth = texture2D(filmDepth, gl_FragCoord.xy / filmResolution).x;
          diffuseColor.a *= smoothstep(-0.001, 0.0001, sceneDepth - gl_FragCoord.z);`,
      );
    };
    material.customProgramCacheKey = () => "world-paper-film-v3";
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    anchor.add(mesh);
    return { mesh, material, uniforms, index, film };
  });

  function stop() {
    assets.forEach((asset) => asset.setPlaying(false));
  }

  /** The hand-off to Daylight: the sheet on screen departs as it does between slides. */
  let leave = 0;
  return {
    setLeave(value: number) {
      leave = value;
    },
    setVisible(value: boolean) {
      visible = value;
      if (!value) stop();
    },
    setPaused(value: boolean) {
      paused = value;
      if (value) stop();
    },
    update(
      time: number,
      delta: number,
      chapter: number,
      position: number,
      reduced: boolean,
      camera: THREE.PerspectiveCamera,
      pointer: THREE.Vector2,
      pointerActive: boolean,
    ) {
      const compact = renderer.domElement.clientWidth < 768;
      if (lastAspect !== camera.aspect || lastCompact !== compact) {
        lastAspect = camera.aspect;
        lastCompact = compact;
        rig.update(WORLD_FLIGHT_END, compact, endPosition, endTarget);
        view.position.copy(endPosition);
        view.lookAt(endTarget);
        view.rotateZ(
          Math.sin(WORLD_FLIGHT_END * Math.PI * 2) * Math.sin(WORLD_FLIGHT_END * Math.PI) * 0.025,
        );
        anchor.position.copy(view.position);
        anchor.quaternion.copy(view.quaternion);
        height = 2 * Math.tan(THREE.MathUtils.degToRad(worldCameraFov(WORLD_FLIGHT_END) / 2)) * 6.3;
        width = height * camera.aspect;
      }
      const entering = THREE.MathUtils.smootherstep(chapter, 0.66, 1);
      anchor.visible = entering > 0.001;
      if (chapter > 0.42) assets.forEach((asset) => asset.warm());
      const velocity = delta > 0 ? (position - previous) / delta : 0;
      previous = position;
      flex = reduced
        ? 0
        : THREE.MathUtils.damp(flex, THREE.MathUtils.clamp(velocity * 0.65, -1.3, 1.3), 6, delta);
      active = Math.max(0, Math.min(assets.length - 1, Math.round(position)));
      assets.forEach((asset, index) =>
        asset.setPlaying(index === active && chapter > 0.72 && visible && !paused && !reduced),
      );
      if (!anchor.visible) return;
      const canHover = pointerActive && !reduced && visible && chapter > 0.97;
      if (canHover) {
        pointerNdc.set(pointer.x, -pointer.y);
        raycaster.setFromCamera(pointerNdc, camera);
      }
      const baseWidth = compact ? width * 0.82 : Math.min(width * 0.4, height * 1.2);
      for (const panel of panels) {
        const relative = position - panel.index;
        // Each sheet departs before the next finishes entering. At rest only one is visible.
        const arrival =
          panel.index === 0 ? entering : THREE.MathUtils.smootherstep(relative + 1, 0.22, 1);
        // Leaving the journey, the last sheet takes the same flight it takes between slides,
        // alongside the lettering and the first edge of paper.
        const flight = reduced ? 0 : THREE.MathUtils.clamp(leave * 1.35, 0, 1);
        const departure = Math.max(THREE.MathUtils.smootherstep(relative, 0.02, 0.96), flight);
        const fade = Math.min(
          1 - THREE.MathUtils.smoothstep(relative, 0.58, 0.96),
          1 - THREE.MathUtils.smoothstep(flight, 0.55, 1),
        );
        const size = THREE.MathUtils.lerp(1, 0.42, departure);
        const float = reduced ? 0 : Math.sin(time * 0.35 + panel.index * 1.8) * 0.028;
        panel.mesh.visible = arrival > 0.001 && fade > 0.001;
        panel.mesh.position.set(
          (1 - arrival) * width * 1.05 +
            width * (Math.sin(departure * Math.PI) * -0.23 + departure * 0.18),
          height * (compact ? 0.13 : 0.14) +
            float -
            Math.sin((1 - arrival) * Math.PI) * 0.3 -
            Math.sin(departure * Math.PI) * height * 0.28 +
            departure * height * 0.18,
          -6.3 - (1 - arrival) * 3.8 - departure * 12,
        );
        panel.mesh.rotation.set(
          -0.035 - departure * 0.95 + (1 - arrival) * 0.1,
          -(1 - arrival) * 0.55 + departure * 0.6 + flex * 0.06,
          (1 - arrival) * -0.08 - departure * 0.65,
        );
        panel.mesh.scale.set(baseWidth * size, (baseWidth * size) / 1.6, baseWidth * size);
        let hoverTarget = 0;
        if (canHover && panel.mesh.visible && panel.index === active) {
          // Use the unhovered sheet as the hit surface so the tilt cannot chase its own boundary.
          panel.mesh.updateWorldMatrix(true, false);
          inverseWorld.copy(panel.mesh.matrixWorld).invert();
          localRay.copy(raycaster.ray).applyMatrix4(inverseWorld);
          if (localRay.intersectPlane(paperPlane, pointerHit)) {
            const edge = Math.max(Math.abs(pointerHit.x), Math.abs(pointerHit.y));
            hoverTarget =
              (1 - THREE.MathUtils.smoothstep(edge, 0.49, 0.6)) *
              (1 - THREE.MathUtils.smoothstep(Math.abs(relative), 0.04, 0.18));
            if (hoverTarget > 0) {
              pointerTarget.set(
                THREE.MathUtils.clamp(pointerHit.x, -0.5, 0.5),
                THREE.MathUtils.clamp(pointerHit.y, -0.5, 0.5),
              );
              panel.uniforms.filmPointer.value.lerp(pointerTarget, 1 - Math.exp(-delta * 9));
            }
          }
        }
        const hover = reduced
          ? 0
          : THREE.MathUtils.damp(panel.uniforms.filmHover.value, hoverTarget, 7, delta);
        panel.uniforms.filmHover.value = hover;
        const localPointer = panel.uniforms.filmPointer.value;
        panel.mesh.position.x += localPointer.x * hover * 0.14;
        panel.mesh.position.y += localPointer.y * hover * 0.09;
        panel.mesh.position.z += hover * 0.11;
        panel.mesh.rotation.x += localPointer.y * hover * 0.18;
        panel.mesh.rotation.y -= localPointer.x * hover * 0.2;
        panel.mesh.rotation.z += localPointer.x * hover * 0.025;
        panel.material.opacity = THREE.MathUtils.smoothstep(arrival, 0, 0.25) * fade;
        const asset = assets[panel.film]!;
        if (panel.material.map !== asset.texture) {
          panel.material.map = asset.texture;
          panel.material.needsUpdate = true;
        }
        panel.uniforms.filmFlex.value = flex;
        panel.uniforms.filmOffset.value = relative;
        panel.uniforms.filmPeel.value = reduced ? 0 : Math.sin(departure * Math.PI) * 0.8;
        panel.uniforms.filmTime.value = time + panel.index * 2.6;
        panel.uniforms.filmMotion.value = reduced ? 0 : 1 + Math.min(Math.abs(flex), 0.7) * 0.4;
        panel.uniforms.filmDefocus.value = departure * departure * 0.008 + (1 - arrival) * 0.001;
        panel.uniforms.filmAspect.value = asset.aspect;
        panel.uniforms.filmShade.value =
          THREE.MathUtils.lerp(0.72, 1, arrival) * (1 - departure * 0.5);
        panel.mesh.renderOrder = Math.round(100 + panel.mesh.position.z * 3);
      }
    },
    render(camera: THREE.PerspectiveCamera) {
      if (!anchor.visible) return;
      renderer.getDrawingBufferSize(resolution.value);
      renderer.autoClear = false;
      renderer.render(scene, camera);
      renderer.autoClear = true;
    },
    get active() {
      return active;
    },
    get playing() {
      return assets.filter((asset) => asset.playing).length;
    },
    get bend() {
      return flex;
    },
    get hover() {
      return anchor.visible ? panels[active]!.uniforms.filmHover.value : 0;
    },
    get hoverPoint() {
      return panels[active]!.uniforms.filmPointer.value;
    },
    get visibleFrames() {
      return anchor.visible ? panels.filter((panel) => panel.mesh.visible).length : 0;
    },
    dispose() {
      stop();
      assets.forEach((asset) => asset.dispose());
      panels.forEach((panel) => panel.material.dispose());
      geometry.dispose();
    },
  };
}
