import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createWorldAtmosphere } from "./atmosphere";
import { createCoreInstallation } from "./installationCore";
import { createSpecimen, type SpecimenId } from "./specimen";
import { createCubeEnvironment } from "./cubeEnvironment";
import { WORLD_DEPTH, createWorldJourneyRig, worldCameraFov } from "./journey";
import { createWorldRocks } from "./rocks";
import { worldFlightProgress } from "./progress";
import { createWorldFilms } from "./films";
import { WORLD_FILMS } from "@/content/worldFilms";

export type WorldScene = {
  setChapterProgress: (progress: number) => void;
  /** The hand-off to Daylight, 0–1: lines run hotter, the image streaks as in the dive, the sheet flies away. */
  setLeave: (value: number) => void;
  setFilmPosition: (position: number) => void;
  setFilmsPaused: (paused: boolean) => void;
  setCategory: (id: SpecimenId | null) => void;
  setDark: (dark: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  dispose: () => void;
};

type Options = {
  dark: boolean;
  reduced: boolean;
  onProgress: (value: number) => void;
  onReady: () => void;
  onError: () => void;
  onHover?: () => void;
  onChapterProgress?: (value: number) => void;
  onFilmProgress?: (value: number) => void;
};

/** A single renderer, with a capped ambient loop that rests offscreen or with reduced motion. */
export function createWorldScene(mount: HTMLElement, options: Options): WorldScene {
  let disposed = false;
  let ready = false;
  let visible = true;
  let covered = false;
  let reduced = options.reduced;
  let dark = options.dark;
  let frame = 0;
  let lastTime = 0;
  let motionTime = 0;
  let lastDiagnostics = -Infinity;
  let arrival = reduced ? 1 : 0;
  let pointerActive = false;
  let cubeHovered = false;
  let chapterTarget = 0;
  let chapterProgress = 0;
  let publishedChapter = -1;
  let filmTarget = 0;
  let filmPosition = 0;
  let publishedFilm = -1;
  let category: SpecimenId | null = null;
  let visibleCategory: SpecimenId | null = null;
  let width = mount.clientWidth;
  let height = mount.clientHeight;
  const abort = new AbortController();
  const small = matchMedia("(max-width: 47.999rem)").matches;
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.25 : 1.5));
  // The cube's thin, polished panels need a sharp refraction buffer on desktop.
  renderer.transmissionResolutionScale = small ? 0.6 : 1;
  renderer.setSize(width, height);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.info.autoReset = false;
  renderer.domElement.setAttribute("aria-hidden", "true");
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(43, width / height, 0.1, 80);
  const background = new THREE.Color();
  const heroBackground = new THREE.Color();
  const orbitBackground = new THREE.Color(0x070f24);
  scene.background = background;
  scene.fog = new THREE.Fog(background, 13, 30);
  const ambient = new THREE.HemisphereLight(0xc5d9ff, 0x28374d, 0.1);
  scene.add(ambient);
  // The visible shafts share their source and aim with these actual scene lights.
  const key = new THREE.SpotLight(0xe5efff, 260, 28, Math.PI * 0.16, 0.62, 2);
  key.position.set(-3.6, 6.8, -2.4);
  key.target.position.set(0, 0.4, 0.7);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(small ? 1024 : 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 28;
  key.shadow.normalBias = 0.025;
  key.shadow.bias = -0.00008;
  key.shadow.radius = 3;
  const fill = new THREE.SpotLight(0xaecaff, 70, 28, Math.PI * 0.18, 1, 2);
  fill.position.set(3.8, 5.6, -2.8);
  fill.target.position.set(0, 0.7, 0);
  scene.add(key, key.target, fill, fill.target);
  // Soft overhead bounce gathers light around the centre without flattening the front pillars.
  const bounce = new THREE.SpotLight(0xd3e4ff, 15, 14, Math.PI * 0.15, 1, 2);
  bounce.position.set(-0.4, 4.1, -0.2);
  bounce.target.position.set(0, 0, 0.8);
  scene.add(bounce, bounce.target);
  // A tight, steady accent catches the rear branch without another shadow pass.
  // A soft wash on the rear tree, aimed a little left of the branch with a wide, feathered edge.
  const treeLight = new THREE.SpotLight(0xe1edff, 40, 9, Math.PI * 0.05, 0.7, 2);
  treeLight.position.set(1.1, 5.8, -3.2);
  treeLight.target.position.set(-1.35, 2.9, -4.13);
  scene.add(treeLight, treeLight.target);
  const courtyard = new THREE.Group();
  courtyard.name = "Courtyard_architecture";
  scene.add(courtyard);
  const installation = createCoreInstallation(small, renderer.getPixelRatio());
  scene.add(installation.group);
  const journeyRig = createWorldJourneyRig();
  const rocks = createWorldRocks(small);
  scene.add(rocks.group);
  const trailLight = new THREE.PointLight(0xb9d3ff, 0, 32, 2);
  trailLight.position.set(-2, 8, 3 - WORLD_DEPTH);
  scene.add(trailLight);
  const atmosphere = createWorldAtmosphere(renderer, small, [key, fill, treeLight], installation);
  const films = createWorldFilms(renderer, atmosphere.renderTarget.depthTexture!, small, wake);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.05);
  scene.environment = environment.texture;
  const cubeEnvironment = createCubeEnvironment(renderer);
  installation.setEnvironment(cubeEnvironment.texture);
  // Ingredient clouds take the cube's place and share its parallax and float.
  const specimen = createSpecimen(small);
  specimen.setEnvironment(cubeEnvironment.texture);
  installation.group.add(specimen.group);
  scene.environmentIntensity = 0.4;
  room.dispose();
  pmrem.dispose();

  const pointer = new THREE.Vector2();
  const smoothed = new THREE.Vector2();
  const cameraPointer = new THREE.Vector2();
  const orbit = new THREE.Spherical();
  const orbitOffset = new THREE.Vector3();
  const target = new THREE.Vector3();
  const position = new THREE.Vector3();
  const focusPoint = new THREE.Vector3();
  const travelOffset = new THREE.Vector3();
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const materialBases = new Map<THREE.MeshStandardMaterial, THREE.Color>();
  const stoneFinish = { value: dark ? 1 : 0 };

  function gradeMaterials() {
    for (const [material, base] of materialBases) {
      const stone = material.name === "lambert7";
      const floor = material.name === "floor";
      const carpet = material.name === "lambert3";
      material.color
        .copy(base)
        .multiplyScalar(dark ? (stone ? 1 : floor ? 0.62 : carpet ? 0.6 : 0.92) : 1);
      if (stone) {
        material.roughness = dark ? 0.4 : 0.48;
        material.envMapIntensity = dark ? 0.65 : 1;
      }
    }
  }

  function theme() {
    const style = getComputedStyle(mount);
    heroBackground.set(style.getPropertyValue("--world-backdrop").trim());
    background.copy(heroBackground);
    (scene.fog as THREE.Fog).color.copy(background);
    renderer.toneMappingExposure = dark ? 0.88 : 1.0;
    ambient.intensity = dark ? 0.04 : 0.65;
    scene.environmentIntensity = dark ? 0.08 : 0.35;
    stoneFinish.value = dark ? 1 : 0;
    gradeMaterials();
    installation.setDark(dark);
    atmosphere.setDark(dark);
    renderer.shadowMap.needsUpdate = true;
  }

  function render(time: number) {
    frame = 0;
    if (disposed || !visible || covered || document.hidden) return;
    // Use 60 fps while the pointer settles; the ambient scene returns to 30 fps at rest.
    const travelling =
      Math.abs(chapterTarget - chapterProgress) > 0.0001 ||
      Math.abs(filmTarget - filmPosition) > 0.0001;
    const interacting = cameraPointer.distanceToSquared(pointer) > 0.00001 || travelling;
    const interval = ready && (arrival < 1 || interacting) ? 1000 / 60 : 1000 / 30;
    if (!reduced && time - lastTime < interval - 1) {
      wake();
      return;
    }
    const delta = Math.min((time - (lastTime || time)) / 1000, 0.05);
    lastTime = time;
    if (!reduced) motionTime += delta;
    // Fast wheel/trackpad gestures still leave time to see the dive. Native scroll
    // remains free; the camera and its copy settle together, at a bounded speed.
    chapterProgress = reduced
      ? chapterTarget
      : chapterProgress +
        THREE.MathUtils.clamp(
          THREE.MathUtils.damp(chapterProgress, chapterTarget, 7, delta) - chapterProgress,
          -delta / 1.8,
          delta / 1.8,
        );
    if (Math.abs(chapterTarget - chapterProgress) < 0.0001) chapterProgress = chapterTarget;
    const filmDestination = chapterProgress > 0.995 ? filmTarget : 0;
    filmPosition = reduced
      ? filmDestination
      : filmPosition +
        THREE.MathUtils.clamp(
          THREE.MathUtils.damp(filmPosition, filmDestination, 7, delta) - filmPosition,
          -delta / 0.7,
          delta / 0.7,
        );
    if (Math.abs(filmDestination - filmPosition) < 0.0001) filmPosition = filmDestination;
    // The chapter ends inside the original flight, preserving its lines, lighting and blur.
    const chapter = worldFlightProgress(chapterProgress);
    installation.uniforms.chapter.value = chapter;
    const nextCategory = chapterProgress > 0.025 ? null : category;
    if (nextCategory !== visibleCategory) {
      visibleCategory = nextCategory;
      specimen.select(nextCategory);
      installation.setCollapsed(nextCategory !== null);
    }
    // The atmosphere is already alive while the model streams; the approach starts once it is ready.
    arrival = reduced || chapterTarget > 0.01 ? 1 : ready ? Math.min(1, arrival + delta / 2.8) : 0;
    const ease = THREE.MathUtils.smootherstep(arrival, 0, 1);
    smoothed.lerp(pointer, reduced ? 1 : 1 - Math.exp(-delta * 5));
    cameraPointer.lerp(pointer, reduced ? 1 : 1 - Math.exp(-delta * 3.2));
    const mobile = width < 768;
    const driftX = reduced ? 0 : cameraPointer.x;
    const driftY = reduced ? 0 : cameraPointer.y;
    position.set(
      THREE.MathUtils.lerp(mobile ? 0.15 : 0.65, 0.1, ease) + Math.sin(ease * Math.PI) * 0.85,
      THREE.MathUtils.lerp(mobile ? 4.5 : 3.8, mobile ? 3.06 : 2.65, ease),
      THREE.MathUtils.lerp(mobile ? 18.5 : 12.2, mobile ? 11.48 : 7.13, ease),
    );
    target.set(0, THREE.MathUtils.lerp(mobile ? 1.75 : 1.4, mobile ? 1.45 : 1.3, ease), 0);
    // Follow the hero trails and hold their low, forward-facing composition.
    const sweep = Math.sin(chapter * Math.PI);
    journeyRig.update(chapter, mobile, position, target);
    camera.fov = worldCameraFov(chapter);
    camera.updateProjectionMatrix();
    // A small orbit plus dolly reveals real depth between pillars, the cube and foreground trails.
    // The slower camera damping and faster cube tilt keep the layers from moving as one flat image.
    const response = ease * (mobile ? 0.55 : 1) * (1 - sweep * 0.95);
    orbit.setFromVector3(orbitOffset.copy(position).sub(target));
    orbit.theta += driftX * 0.145 * response;
    orbit.phi += driftY * 0.12 * response;
    orbit.radius += (driftY * 0.58 + (driftX * driftX + driftY * driftY) * 0.18) * response;
    position.copy(orbitOffset.setFromSpherical(orbit)).add(target);
    target.x += driftX * 0.08 * response;
    target.y -= driftY * 0.09 * response;
    camera.position.copy(position);
    camera.lookAt(target);
    const roll = -driftX * 0.018 * response + Math.sin(chapter * Math.PI * 2) * sweep * 0.025;
    camera.rotateZ(roll);
    // Focus follows the light sculpture throughout the curved camera arrival.
    camera.updateMatrixWorld();
    const opening =
      THREE.MathUtils.smoothstep(chapter, 0.03, 0.27) *
      (1 - THREE.MathUtils.smoothstep(chapter, 0.7, 0.98));
    // Cube, core and glow leave together; only the trails continue into the next scene.
    const cubePresence = 1 - THREE.MathUtils.smoothstep(chapter, 0.23, 0.38);
    installation.uniforms.journeyCenter.value.copy(journeyRig.focus);
    installation.setJourney(travelOffset, opening, cubePresence);
    installation.update(motionTime, ready, reduced, smoothed);
    rocks.update(motionTime, chapter);
    trailLight.intensity = THREE.MathUtils.smoothstep(chapter, 0.28, 0.7) * 80;
    // Fade the old architecture into defocus before crossing its rear wall.
    // Hashed coverage also removes its depth, so it cannot hide the travelling sculpture.
    const courtyardPresence = 1 - THREE.MathUtils.smoothstep(chapter, 0.09, 0.32);
    const withdrawal = THREE.MathUtils.smoothstep(chapter, 0.08, 0.35);
    courtyard.scale.set(1 + withdrawal * 1.6, 1, 1);
    courtyard.position.z = -withdrawal * 4;
    courtyard.visible = courtyardPresence > 0;
    for (const material of materialBases.keys()) material.opacity = courtyardPresence;
    specimen.update(motionTime, delta, reduced, installation.collapse < 0.75);
    specimen.group.rotation.set(smoothed.y * 0.25, smoothed.x * 0.45, 0);
    installation.updateHover(
      camera,
      pointer,
      pointerActive && opening < 0.05 && cubePresence > 0.99,
      reduced,
      delta,
    );
    const hoverAmount = installation.uniforms.glassHover.value;
    if (!cubeHovered && hoverAmount > 0.3 && installation.collapse < 0.1) {
      cubeHovered = true;
      options.onHover?.();
    } else if (hoverAmount < 0.1) cubeHovered = false;
    focusPoint
      .copy(installation.group.position)
      .lerp(journeyRig.focus, THREE.MathUtils.smoothstep(chapter, 0.1, 0.35))
      .applyMatrix4(camera.matrixWorldInverse);
    const focusDistance = Math.max(0.8, -focusPoint.z - 0.7);
    // Keep the same atmospheric depth when the mobile camera sits further away.
    const fog = scene.fog as THREE.Fog;
    background.copy(heroBackground).lerp(orbitBackground, chapter);
    fog.color.copy(background);
    fog.near = focusDistance + THREE.MathUtils.lerp(1.3, 4.2, chapter);
    fog.far = focusDistance + 24;
    ambient.intensity = THREE.MathUtils.lerp(dark ? 0.04 : 0.65, 0.38, chapter);
    // Both beams stay aimed at the product space; only the softer unshadowed source drifts.
    key.intensity =
      THREE.MathUtils.lerp(dark ? 260 : 400, 55, chapter) *
      (0.97 + Math.sin(motionTime * 0.32) * 0.06);
    key.shadow.intensity = 1 - chapter;
    fill.position.x = 3.8 + Math.sin(motionTime * 0.18) * 0.18 + driftX * 0.16;
    fill.position.y = 5.6 - driftY * 0.1;
    fill.intensity =
      THREE.MathUtils.lerp(dark ? 70 : 180, 24, chapter) *
      (0.96 + Math.sin(motionTime * 0.26 + 1.4) * 0.08);
    bounce.intensity = dark ? 8 : 45;
    treeLight.intensity = ready ? (dark ? 40 : 30) * (1 - chapter) : 0;
    atmosphere.render(scene, camera, focusDistance, motionTime, arrival);
    films.update(
      motionTime,
      delta,
      chapterProgress,
      filmPosition,
      reduced,
      camera,
      pointer,
      pointerActive,
    );
    films.render(camera);
    // Inspection attributes are telemetry, not animation state. Avoid allocating and
    // rewriting thirty DOM attributes on every frame, including unchanged values.
    if (reduced || time - lastDiagnostics >= 250) {
      lastDiagnostics = time;
      const diagnostics = {
        drawCalls: String(renderer.info.render.calls),
        triangles: String(renderer.info.render.triangles),
        arrival: arrival.toFixed(3),
        chapter: chapterProgress.toFixed(3),
        flight: chapter.toFixed(3),
        film: filmPosition.toFixed(3),
        filmActive: WORLD_FILMS[films.active]?.id ?? "",
        filmsPlaying: String(films.playing),
        filmBend: films.bend.toFixed(3),
        filmFrames: String(films.visibleFrames),
        filmHover: films.hover.toFixed(3),
        filmPointerX: films.hoverPoint.x.toFixed(3),
        filmPointerY: films.hoverPoint.y.toFixed(3),
        courtyardVisible: String(courtyard.visible),
        cameraX: position.x.toFixed(3),
        cameraY: position.y.toFixed(3),
        cameraZ: position.z.toFixed(2),
        cameraRoll: roll.toFixed(4),
        cubeFormation: installation.uniforms.formed.value.toFixed(3),
        cubeYaw: installation.cubeRotation.y.toFixed(3),
        cubePitch: installation.cubeRotation.x.toFixed(3),
        cubeHover: installation.uniforms.glassHover.value.toFixed(3),
        cubeLift: installation.group.position.y.toFixed(3),
        cubeScale: installation.group.scale.x.toFixed(3),
        cubeOpen: opening.toFixed(3),
        cubeZ: installation.group.position.z.toFixed(3),
        cubePresence: cubePresence.toFixed(3),
        corePresence: installation.uniforms.coreFormed.value.toFixed(3),
        rocksVisible: String(rocks.group.visible),
        cameraFov: camera.fov.toFixed(2),
      };
      for (const [key, value] of Object.entries(diagnostics)) {
        if (mount.dataset[key] !== value) mount.dataset[key] = value;
      }
    }
    // Loading must not make fallback content inert if the scene cannot become ready.
    if (ready && publishedChapter !== chapterProgress) {
      publishedChapter = chapterProgress;
      options.onChapterProgress?.(chapterProgress);
    }
    if (ready && publishedFilm !== filmPosition) {
      publishedFilm = filmPosition;
      options.onFilmProgress?.(filmPosition);
    }
    if (!reduced) wake();
  }
  function wake() {
    if (!frame && !disposed && visible && !covered && !document.hidden)
      frame = requestAnimationFrame(render);
  }
  function resize() {
    width = mount.clientWidth;
    height = mount.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    atmosphere.resize(width, height);
    wake();
  }
  function move(event: PointerEvent) {
    if (event.pointerType === "touch" || reduced) return;
    const box = mount.getBoundingClientRect();
    pointerActive = true;
    pointer.set(
      THREE.MathUtils.clamp(((event.clientX - box.left) / width) * 2 - 1, -1, 1),
      THREE.MathUtils.clamp(((event.clientY - box.top) / height) * 2 - 1, -1, 1),
    );
    wake();
  }
  function leave() {
    pointerActive = false;
    pointer.set(0, 0);
    wake();
  }
  function visibility() {
    lastTime = 0;
    films.setVisible(visible && !covered && !document.hidden);
    if (document.hidden) {
      pointer.set(0, 0);
      pointerActive = false;
    }
    if (!document.hidden) wake();
  }
  function contextLost(event: Event) {
    event.preventDefault();
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    ready = false;
    options.onError();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(mount);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    films.setVisible(visible && !covered && !document.hidden);
    lastTime = 0;
    if (visible) wake();
  });
  observer.observe(mount);
  mount.addEventListener("pointermove", move, { passive: true });
  mount.addEventListener("pointerleave", leave);
  window.addEventListener("blur", leave);
  document.addEventListener("visibilitychange", visibility);
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  theme();
  resize();

  async function load() {
    const response = await fetch(
      small ? "/models/world/hugo-world-mobile.glb" : "/models/world/hugo-world.glb",
      { signal: abort.signal },
    );
    if (!response.ok) throw new Error("World model unavailable");
    const total = Number(response.headers.get("content-length"));
    let bytes: ArrayBuffer;
    if (response.body && total > 0) {
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        length += value.byteLength;
        if (!disposed) options.onProgress(Math.min(85, (length / total) * 85));
      }
      const result = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.byteLength;
      }
      bytes = result.buffer;
    } else bytes = await response.arrayBuffer();
    if (disposed) return;
    const gltf = await new GLTFLoader().parseAsync(bytes, "/models/world/");
    gltf.scene.scale.setScalar(0.01);
    gltf.scene.updateMatrixWorld(true);
    const groups = new Map<THREE.Material, THREE.BufferGeometry[]>();
    gltf.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const material = object.material as THREE.Material;
      if (material instanceof THREE.MeshStandardMaterial && !materialBases.has(material)) {
        materialBases.set(material, material.color.clone());
        material.alphaHash = true;
        if (material.name === "lambert7") {
          // Regrade the original UV atlas into charcoal marble, retaining its veins and normal detail.
          material.onBeforeCompile = (shader) => {
            shader.uniforms.worldStoneFinish = stoneFinish;
            shader.fragmentShader = "uniform float worldStoneFinish;\n" + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <map_fragment>",
              `#include <map_fragment>
              float mineral = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
              vec3 charcoal = vec3(0.88, 0.97, 1.10) * (0.006 + mineral * 0.2);
              diffuseColor.rgb = mix(diffuseColor.rgb, charcoal, worldStoneFinish);`,
            );
          };
          material.customProgramCacheKey = () => "world-charcoal-marble-v1";
        }
        if (material.name === "floor") {
          material.normalScale.setScalar(0.75);
          // Retain the authored soil maps, with a dry, broad response instead of wet-looking sparkles.
          material.onBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <roughnessmap_fragment>",
              "#include <roughnessmap_fragment>\nroughnessFactor = mix(0.55, 0.94, roughnessFactor);",
            );
          };
          material.customProgramCacheKey = () => "world-soil-roughness-v1";
        }
        if (material.name === "lambert3") {
          material.onBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <map_fragment>",
              "#include <map_fragment>\ndiffuseColor.rgb = mix(vec3(dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722))), diffuseColor.rgb, 0.5);",
            );
          };
          material.customProgramCacheKey = () => "world-textile-colour-v1";
        }
      }
      materials.add(material);
      for (const value of Object.values(material))
        if (value instanceof THREE.Texture) textures.add(value);
      if (
        !object.name.endsWith("_orb_0") &&
        object.name !== "polySurface101_wire_0" &&
        object.name !== "polySurface101_pottery_0"
      ) {
        const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
        const group = groups.get(material) ?? [];
        group.push(geometry);
        groups.set(material, group);
      }
      object.geometry.dispose();
    });
    if (disposed) {
      for (const group of groups.values()) group.forEach((geometry) => geometry.dispose());
      releaseAssets();
      return;
    }
    // Merge the static architecture by material; the hanging bowl and its wire are excluded.
    for (const [material, group] of groups) {
      const merged = mergeGeometries(group, false);
      const results = merged ? [merged] : group;
      if (merged) group.forEach((geometry) => geometry.dispose());
      for (const geometry of results) {
        geometries.add(geometry);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = `courtyard_${material.name}`;
        mesh.castShadow = material.name !== "ivy12";
        mesh.receiveShadow = true;
        courtyard.add(mesh);
      }
    }
    options.onProgress(92);
    gradeMaterials();
    resize();
    camera.position.set(0.65, 3.8, 12.2);
    camera.lookAt(0, 1.4, 0);
    await installation.assetsReady;
    if (disposed) return;
    // Ingredients are built, uploaded and compiled here, behind the loader, so the first
    // selection never stalls. Compilation gathers its objects synchronously, so they are
    // revealed only for the length of that call.
    for (const texture of specimen.prepare()) renderer.initTexture(texture);
    // The scene renders into the atmosphere's target, untoned; programs differ from the canvas's.
    specimen.reveal(true);
    rocks.prepare();
    renderer.setRenderTarget(atmosphere.renderTarget);
    const compiling = renderer.compileAsync(scene, camera);
    renderer.setRenderTarget(null);
    specimen.reveal(false);
    rocks.update(motionTime, worldFlightProgress(chapterProgress));
    await compiling;
    if (disposed) return;
    ready = true;
    renderer.shadowMap.needsUpdate = true;
    // The loading atmosphere already owns a scheduled frame. Calling render()
    // directly here would lose that handle and start a second permanent loop.
    options.onProgress(100);
    options.onReady();
    wake();
  }
  function releaseAssets() {
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => {
      texture.dispose();
      const bitmap = texture.source.data;
      if (typeof ImageBitmap !== "undefined" && bitmap instanceof ImageBitmap) bitmap.close();
    });
    geometries.clear();
    materials.clear();
    materialBases.clear();
    textures.clear();
  }
  void load().catch(() => {
    if (!disposed) options.onError();
  });
  return {
    setChapterProgress(value) {
      chapterTarget = THREE.MathUtils.clamp(value, 0, 1);
      publishedChapter = -1;
      wake();
    },
    setLeave(value) {
      const leave = THREE.MathUtils.clamp(value, 0, 1);
      installation.uniforms.boost.value = leave;
      atmosphere.setLeave(leave);
      films.setLeave(leave);
      covered = leave >= 1;
      mount.dataset.covered = String(covered);
      films.setVisible(visible && !covered && !document.hidden);
      if (covered && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      wake();
    },
    setFilmPosition(value) {
      filmTarget = THREE.MathUtils.clamp(value, 0, WORLD_FILMS.length - 1);
      publishedFilm = -1;
      wake();
    },
    setFilmsPaused(value) {
      films.setPaused(value);
      wake();
    },
    setDark(value) {
      dark = value;
      theme();
      wake();
    },
    setCategory(id) {
      category = id;
      wake();
    },
    setReducedMotion(value) {
      reduced = value;
      if (value) {
        pointerActive = false;
        pointer.set(0, 0);
        smoothed.set(0, 0);
        cameraPointer.set(0, 0);
      }
      wake();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      abort.abort();
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      observer.disconnect();
      mount.removeEventListener("pointermove", move);
      mount.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      releaseAssets();
      atmosphere.dispose();
      films.dispose();
      installation.dispose();
      rocks.dispose();
      specimen.dispose();
      environment.dispose();
      cubeEnvironment.dispose();
      key.shadow.dispose();
      renderer.dispose();
      // This canvas is never reused. Release its drawing buffer and internal
      // transmission targets now instead of waiting for browser context GC.
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
