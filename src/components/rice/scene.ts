import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createRiceSurface } from "./surface";
import { grainGeometry } from "./grain";
import { ceramicFootGeometry, ceramicGeometry, ceramicMaps, riceBed, riceMaps } from "./vessel";
import {
  riceEntrance,
  ENTRANCE_DELAY,
  ENTRANCE_DURATION,
  bowlLift,
  bowlOutline,
  BRUSH_VIEW_START,
  brushRice,
  constrainRice,
  flightDuration,
  flightTravel,
  grainFlight,
  riceSurface,
  riceTransition,
  seededRandom,
  SETTLE_DURATION,
  smoothstep,
  stepCameraSpring,
  stepSpring,
  stepRiceBrush,
  TOSS_DURATION,
  type BrushStroke,
  type RiceBrushState,
} from "./motion";

export interface RiceScene {
  toss: () => void;
  setDark: (value: boolean) => void;
  setSlow: (value: boolean) => void;
  setReducedMotion: (value: boolean) => void;
  setScrollProgress: (value: number) => void;
  brushWithKey: (x: number, z: number) => void;
  dispose: () => void;
}

interface Grain {
  anchor: THREE.Vector2;
  landing: THREE.Vector2;
  depth: number;
  mobility: number;
  layer: number;
  rotation: THREE.Quaternion;
  landingRotation: THREE.Quaternion;
  launchPosition: THREE.Vector3;
  launchRotation: THREE.Quaternion;
  scale: THREE.Vector3;
  axis: THREE.Vector3;
  height: number;
  duration: number;
  delay: number;
  spin: number;
  launched: boolean;
  settled: boolean;
  brush: RiceBrushState;
}

function contactShadow() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(64, 64, 6, 64, 64, 64);
  gradient.addColorStop(0, "rgba(35, 24, 16, 0.28)");
  gradient.addColorStop(0.4, "rgba(35, 24, 16, 0.13)");
  gradient.addColorStop(1, "rgba(35, 24, 16, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.8), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0.1, -0.015, 0);
  return mesh;
}

export function createRiceScene(
  mount: HTMLElement,
  callbacks: {
    onReady?: () => void;
    onEntranceProgress?: (travel: number, opacity: number) => void;
    onPlaying: (playing: boolean) => void;
    onFailure: () => void;
    onCameraProgress: (progress: number) => void;
  },
  options: {
    viewport?: HTMLElement;
    heroScale?: number;
    heroElevation?: number;
    entrance?: boolean;
    sculptedLight?: boolean;
    surfaceTexture?: { src: string; fallback?: string };
  } = {},
): RiceScene {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.domElement.setAttribute("aria-hidden", "true");
  mount.appendChild(renderer.domElement);
  // Only the projected rice surface captures touch; the surrounding canvas still scrolls.
  const brushSurface = document.createElement("div");
  brushSurface.className = "rice-brush-surface";
  brushSurface.setAttribute("aria-hidden", "true");
  brushSurface.setAttribute("data-lenis-prevent-touch", "");
  brushSurface.hidden = true;
  mount.appendChild(brushSurface);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, options.entrance ? 140 : 60);
  camera.position.set(0.2, 3.8, 7.8);
  camera.lookAt(0, 1.25, 0);

  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.55;
  room.dispose();
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xfff5e5, 2.4);
  key.position.set(options.sculptedLight ? -4.5 : -3.5, 6, options.sculptedLight ? 2.8 : 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -4;
  key.shadow.camera.right = key.shadow.camera.top = 4;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 16;
  key.shadow.normalBias = 0.006;
  key.shadow.bias = -0.00008;
  key.shadow.radius = 3;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe5ecff, 0.55);
  fill.position.set(4, 3, 1);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffe4c3, 1.8);
  rim.position.set(1.2, 4.5, -4);
  scene.add(rim);

  const arrangement = new THREE.Group();
  arrangement.rotation.y = -0.16;
  scene.add(arrangement);
  const maps = ceramicMaps();
  maps.color.anisotropy = maps.bump.anisotropy = Math.min(
    8,
    renderer.capabilities.getMaxAnisotropy(),
  );
  const ceramic = new THREE.MeshPhysicalMaterial({
    color: 0xb2a499,
    map: maps.color,
    bumpMap: maps.bump,
    bumpScale: 0.019,
    roughness: 0.52,
    metalness: 0.025,
    clearcoat: 0.12,
    clearcoatRoughness: 0.4,
    envMapIntensity: 0.7,
  });
  const bowl = new THREE.Mesh(ceramicGeometry(), ceramic);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  arrangement.add(bowl);

  const footGeometry = ceramicFootGeometry();
  const foot = new THREE.Mesh(footGeometry, ceramic);
  foot.scale.set(1.5, 1, 0.85);
  foot.castShadow = true;
  foot.receiveShadow = true;
  arrangement.add(foot);

  const bed = riceBed();
  arrangement.add(bed);

  const riceTexture = riceMaps();
  const riceMaterial = new THREE.MeshPhysicalMaterial({
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
    envMapIntensity: 0.32,
  });
  const random = seededRandom(1121);
  const grains: Grain[] = [];
  const lowerLayerCount = window.matchMedia("(pointer: coarse)").matches ? 400 : 600;
  const topLayerCount = window.matchMedia("(pointer: coarse)").matches ? 1200 : 1800;
  const count = lowerLayerCount * 2 + topLayerCount;
  const rice = new THREE.InstancedMesh(grainGeometry(), riceMaterial, count);
  rice.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  rice.castShadow = true;
  rice.receiveShadow = true;
  // The known flight volume is larger than the settled instance bounds.
  rice.frustumCulled = false;
  const dummy = new THREE.Object3D();
  const up = new THREE.Vector3(0, 1, 0);
  const tint = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const layer = Math.min(2, Math.floor(i / lowerLayerCount));
    const radius = Math.sqrt(random()) * (0.76 + layer * 0.055);
    const angle = random() * Math.PI * 2;
    const yaw = random() * Math.PI * 2;
    const direction = new THREE.Vector3(
      Math.cos(yaw),
      (random() - 0.5) * 0.65,
      Math.sin(yaw),
    ).normalize();
    const rotation = new THREE.Quaternion().setFromUnitVectors(up, direction);
    const scale = 0.88 + random() * 0.25;
    const anchor = new THREE.Vector2(radius * Math.cos(angle), radius * Math.sin(angle));
    grains.push({
      anchor,
      landing: anchor.clone(),
      depth: -(2 - layer) * 0.065 + (random() - 0.5) * 0.034,
      mobility: (layer === 2 ? 0.75 : layer === 1 ? 0.25 : 0.06) * (0.8 + random() * 0.4),
      layer,
      rotation,
      landingRotation: rotation.clone(),
      launchPosition: new THREE.Vector3(),
      launchRotation: new THREE.Quaternion(),
      scale: new THREE.Vector3(
        scale * (0.92 + random() * 0.16),
        scale * (0.92 + random() * 0.2),
        scale,
      ),
      axis: new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize(),
      height: 0,
      duration: 0,
      delay: 0,
      spin: 0,
      launched: false,
      settled: true,
      brush: { velocityU: 0, velocityV: 0, yaw: 0, spin: 0, lift: 0 },
    });
    tint.setRGB(1, 0.95 + random() * 0.04, 0.82 + random() * 0.12, THREE.SRGBColorSpace);
    tint.multiplyScalar(0.66 + random() * 0.28);
    rice.setColorAt(i, tint);
  }
  // World-space kernels let gravity stay vertical while the dish tilts underneath.
  scene.add(rice);

  const shadow = contactShadow();
  scene.add(shadow);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.ShadowMaterial({ opacity: 0.025 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.025;
  ground.receiveShadow = true;
  ground.renderOrder = -1;
  scene.add(ground);
  const surface = options.surfaceTexture
    ? createRiceSurface(options.surfaceTexture.src, renderer, options.surfaceTexture.fallback)
    : null;
  let surfaceReady = !surface;
  if (surface) {
    scene.add(surface.mesh);
    mount.dataset.surface = "loading";
    void surface.ready.then((loaded) => {
      if (disposed) return;
      surfaceReady = true;
      mount.dataset.surface = loaded ? "ready" : "unavailable";
      wake();
    });
  }

  // A low-cost hit volume includes both the rim and the mound.
  const hitVolume = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 12),
    new THREE.MeshBasicMaterial({ visible: false }),
  );
  hitVolume.position.y = 0.85;
  hitVolume.scale.set(2.35, 0.8, 1.25);
  arrangement.add(hitVolume);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const spin = new THREE.Quaternion();
  const landingWorld = new THREE.Vector3();
  const landingWorldRotation = new THREE.Quaternion();
  const hitLocal = new THREE.Vector3();
  const goal = new THREE.Vector2();
  const hover = new THREE.Vector2();
  const cameraProgress = { value: 0, velocity: 0 };
  const driftX = { value: 0, velocity: 0 };
  const driftY = { value: 0, velocity: 0 };
  const driftGoal = new THREE.Vector2();
  const cameraViewport = options.viewport ?? mount;
  const riceShiftX = { value: 0, velocity: 0 };
  const riceShiftZ = { value: 0, velocity: 0 };
  const brushRotation = new THREE.Quaternion();
  const brushProjection = new THREE.Vector3();
  const previousBrush = new THREE.Vector2();
  const keyboardBrush = new THREE.Vector2(0, 0);
  const keyboardDirection = new THREE.Vector3();
  const keyboardFrame = new THREE.Quaternion();
  let hasBrushPoint = false;
  let brushPointer: number | null = null;
  let brushActive = false;
  let brushStrokes = 0;
  let brushTravel = 0;
  let hoverAmount = 0;
  let isOver = false;
  let focused = false;
  let frame = 0;
  let lastTime = 0;
  let animationTime = -1;
  let slow = false;
  let reduced = false;
  let visible = true;
  let disposed = false;
  let contextLost = false;
  let needsGrainUpdate = true;
  let firstFrame = true;
  let entranceProgress = options.entrance ? 0 : 1;
  let entranceStart: number | null = null;
  let entranceElapsed = 0;
  let entrance = riceEntrance(entranceProgress);
  let tossNumber = 0;
  let scrollProgress = 0;
  let scrollTarget = 0;
  let hasScrollTarget = false;
  let aspect = 1;
  let viewportWidth = 1;
  let transition = riceTransition(0);

  function updateBrushSurface() {
    brushSurface.hidden = scrollProgress < BRUSH_VIEW_START;
    if (brushSurface.hidden) return;
    camera.updateMatrixWorld(true);
    arrangement.updateMatrixWorld(true);
    const polygon: string[] = [];
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const edge = bowlOutline(angle, 0.86);
      brushProjection.set(edge.x, riceSurface(0.86, angle), edge.z);
      brushProjection.applyMatrix4(arrangement.matrixWorld).project(camera);
      polygon.push(
        `${((brushProjection.x + 1) * 50).toFixed(2)}% ${((1 - brushProjection.y) * 50).toFixed(2)}%`,
      );
    }
    brushSurface.style.clipPath = `polygon(${polygon.join(",")})`;
  }

  function updateCamera() {
    const compact = viewportWidth < 600;
    transition = riceTransition(scrollProgress, reduced, compact);
    const { targetY, progress } = transition;
    // Poleum's shallow, sprung drift, scaled to a close product shot. It ends before brushing.
    const driftWeight = reduced ? 0 : 1 - smoothstep((progress - 0.5) / 0.35);
    const arrivalArc = Math.sin(entrance.travel * Math.PI);
    const elevation =
      transition.elevation +
      ((options.heroElevation ?? 0) + entrance.remaining * 0.045 + arrivalArc * 0.09) *
        (1 - transition.rise) +
      driftY.value * 0.012 * driftWeight;
    const azimuth =
      transition.azimuth +
      entrance.remaining * -0.16 -
      arrivalArc * 0.32 +
      driftX.value * 0.018 * driftWeight;
    const heroHeight =
      Math.max(compact ? 3.2 : 4.65, (compact ? 6.9 : 5.55) / aspect) *
      (compact ? 1 : (options.heroScale ?? 1));
    const overheadHeight = Math.max(compact ? 3.2 : 5.6, (compact ? 6.6 : 8) / aspect);
    const viewHeight =
      THREE.MathUtils.lerp(heroHeight, overheadHeight, smoothstep(progress / 0.3)) *
      transition.framing *
      (1 + entrance.remaining * 2.2);
    // Dolly through a perspective scene. Account for the rice's height to retain the end framing.
    const distance =
      viewHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) +
      (1.25 - targetY) * Math.sin(elevation);
    const horizontal = progress >= BRUSH_VIEW_START ? 0 : Math.cos(elevation) * distance;
    camera.position.set(
      Math.sin(azimuth) * horizontal,
      targetY + Math.sin(elevation) * distance,
      Math.cos(azimuth) * horizontal,
    );
    camera.rotation.set(-elevation, azimuth, -driftX.value * 0.006 * driftWeight, "YXZ");
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    updateBrushSurface();
    callbacks.onCameraProgress(scrollProgress);
    callbacks.onEntranceProgress?.(entrance.travel, entrance.opacity);
  }

  function placeKernel(grain: Grain, anchor: THREE.Vector2, target: THREE.Vector3) {
    const edgeGrip = 1 - Math.pow(anchor.length() / 0.92, 3) * 0.5;
    const u = anchor.x + riceShiftX.value * grain.mobility * edgeGrip;
    const v = anchor.y + riceShiftZ.value * grain.mobility * edgeGrip;
    const radius = Math.min(0.865, Math.hypot(u, v));
    const angle = Math.atan2(v, u);
    const outline = bowlOutline(angle, radius);
    target.set(outline.x, riceSurface(radius, angle) + grain.depth + grain.brush.lift, outline.z);
    target.applyQuaternion(arrangement.quaternion).add(arrangement.position);
  }

  function updateGrains(time: number) {
    for (let i = 0; i < grains.length; i++) {
      const grain = grains[i]!;
      const elapsed = time - grain.delay;
      if (!grain.settled && elapsed >= grain.duration + SETTLE_DURATION) {
        grain.anchor.copy(grain.landing);
        grain.rotation.copy(grain.landingRotation);
        grain.settled = true;
      }
      placeKernel(grain, grain.anchor, dummy.position);
      brushRotation.setFromAxisAngle(up, grain.brush.yaw);
      dummy.quaternion
        .copy(arrangement.quaternion)
        .multiply(brushRotation)
        .multiply(grain.rotation);

      if (time >= 0 && elapsed >= 0 && grain.height > 0 && !grain.settled) {
        if (!grain.launched) {
          grain.launchPosition.copy(dummy.position);
          grain.launchRotation.copy(dummy.quaternion);
          grain.launched = true;
        }
        placeKernel(grain, grain.landing, landingWorld);
        const progress = Math.min(1, elapsed / grain.duration);
        dummy.position.lerpVectors(grain.launchPosition, landingWorld, flightTravel(progress));
        dummy.position.y += grainFlight(time, grain.height, grain.delay) * (reduced ? 0.055 : 1);
        // Angular velocity continues through the apex; only impact damps the tumble.
        spin.setFromAxisAngle(
          grain.axis,
          grain.spin * Math.min(elapsed, grain.duration) * (reduced ? 0.05 : 1),
        );
        dummy.quaternion.copy(grain.launchRotation).multiply(spin);
        if (elapsed > grain.duration) {
          landingWorldRotation.copy(arrangement.quaternion).multiply(grain.landingRotation);
          dummy.quaternion.slerp(
            landingWorldRotation,
            smoothstep((elapsed - grain.duration) / SETTLE_DURATION),
          );
        }
      }
      dummy.scale.copy(grain.scale);
      dummy.updateMatrix();
      rice.setMatrixAt(i, dummy.matrix);
    }
    rice.instanceMatrix.needsUpdate = true;
  }

  function render(now: number) {
    frame = 0;
    if (disposed || !visible || document.hidden || contextLost || !surfaceReady) return;
    const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.25) : 0;
    lastTime = now;
    const previousEntrance = entranceProgress;
    if (entranceProgress < 1) {
      // Begin after the first rendered frame; a cold shader compile must not skip the arrival.
      if (entranceStart !== null && now >= entranceStart)
        entranceElapsed += Math.min(delta, 1 / 15);
      entranceProgress =
        reduced || scrollTarget > 0
          ? 1
          : THREE.MathUtils.clamp(entranceElapsed / ENTRANCE_DURATION, 0, 1);
      entrance = riceEntrance(entranceProgress);
    }
    const previousProgress = scrollProgress;
    const previousDriftX = driftX.value;
    const previousDriftY = driftY.value;
    const cameraMoving = !reduced && stepCameraSpring(cameraProgress, scrollTarget, delta);
    const driftMovingX = !reduced && stepCameraSpring(driftX, driftGoal.x, delta, 3.2);
    const driftMovingY = !reduced && stepCameraSpring(driftY, driftGoal.y, delta, 3.2);
    scrollProgress = THREE.MathUtils.clamp(cameraProgress.value, 0, 1);
    if (
      previousEntrance !== entranceProgress ||
      previousProgress !== scrollProgress ||
      previousDriftX !== driftX.value ||
      previousDriftY !== driftY.value
    ) {
      updateCamera();
      if (previousProgress !== scrollProgress || previousEntrance !== entranceProgress)
        needsGrainUpdate = true;
    }
    const wanted =
      !reduced && (isOver || focused) ? 1 - smoothstep((scrollProgress - 0.6) / 0.3) : 0;
    const ease = 1 - Math.exp(-delta * 7);
    hoverAmount += (wanted - hoverAmount) * ease;
    hover.lerp(goal, ease);
    const tiltX = reduced ? 0 : hover.x * hoverAmount;
    const tiltZ = reduced ? 0 : hover.y * hoverAmount;
    const previousShiftX = riceShiftX.value;
    const previousShiftZ = riceShiftZ.value;
    stepSpring(
      riceShiftX,
      tiltX * 0.075 - transition.bowlBank * 0.45 + entrance.sway * 0.032,
      delta,
    );
    stepSpring(
      riceShiftZ,
      tiltZ * 0.05 + transition.bowlPitch * 0.4 - entrance.sway * 0.014,
      delta,
    );
    const shiftMoving = Math.abs(riceShiftX.velocity) + Math.abs(riceShiftZ.velocity) > 0.00005;
    const hoverMoving = Math.abs(wanted - hoverAmount) > 0.0001 || hover.distanceTo(goal) > 0.0001;
    if (reduced) {
      riceShiftX.value = riceShiftZ.value = riceShiftX.velocity = riceShiftZ.velocity = 0;
    }
    if (animationTime >= 0) {
      animationTime += delta * (slow ? 0.55 : 1) * (reduced ? 3 : 1);
      if (animationTime >= TOSS_DURATION) {
        animationTime = -1;
        callbacks.onPlaying(false);
      }
      needsGrainUpdate = true;
    }
    if (brushActive) {
      brushActive = false;
      for (const grain of grains) {
        const previousU = grain.anchor.x;
        const previousV = grain.anchor.y;
        if (stepRiceBrush(grain.brush, grain.anchor, delta * (slow ? 0.55 : 1))) {
          brushActive = true;
          brushTravel += Math.hypot(grain.anchor.x - previousU, grain.anchor.y - previousV);
          needsGrainUpdate = true;
        }
      }
    }
    const impulse = reduced ? 0 : bowlLift(animationTime);
    arrangement.position.y =
      hoverAmount * 0.12 + Math.abs(tiltX) * 0.026 + impulse + transition.bowlLift;
    arrangement.rotation.z = -tiltX * 0.13 + transition.bowlBank + entrance.sway * 0.022;
    arrangement.rotation.x = tiltZ * 0.07 + transition.bowlPitch - entrance.sway * 0.012;
    bed.position.x = riceShiftX.value * 0.9;
    bed.position.z = riceShiftZ.value * 0.75;
    if (
      hoverMoving ||
      shiftMoving ||
      previousShiftX !== riceShiftX.value ||
      previousShiftZ !== riceShiftZ.value
    )
      needsGrainUpdate = true;
    if (needsGrainUpdate) {
      updateGrains(animationTime);
      needsGrainUpdate = false;
    }
    shadow.material.opacity = 1 - Math.max(0, arrangement.position.y) * 1.1;
    shadow.scale.setScalar(1 + Math.max(0, arrangement.position.y) * 0.4);
    renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    if (firstFrame) {
      firstFrame = false;
      entranceStart = performance.now() + ENTRANCE_DELAY * 1000;
      callbacks.onReady?.();
    }
    mount.dataset.motion = animationTime >= 0 ? "tossing" : brushActive ? "brushing" : "resting";
    mount.dataset.brushStrokes = String(brushStrokes);
    mount.dataset.brushTravel = brushTravel.toFixed(4);
    mount.dataset.tilt = arrangement.rotation.z.toFixed(4);
    mount.dataset.riceShift = riceShiftX.value.toFixed(4);
    mount.dataset.view =
      scrollProgress === 1 ? "overhead" : scrollProgress === 0 ? "hero" : "orbit";
    mount.dataset.cameraProgress = scrollProgress.toFixed(4);
    mount.dataset.cameraTarget = scrollTarget.toFixed(4);
    mount.dataset.cameraDrift = (
      Math.hypot(driftX.value, driftY.value) *
      (reduced ? 0 : 1 - smoothstep((scrollProgress - 0.5) / 0.35))
    ).toFixed(4);
    mount.dataset.cameraDistance = Math.hypot(
      camera.position.x,
      camera.position.y - transition.targetY,
      camera.position.z,
    ).toFixed(4);
    mount.dataset.cameraSweep = (transition.azimuth - Math.atan2(0.2, 7.8)).toFixed(4);
    mount.dataset.cameraHeading = Math.atan2(
      -camera.matrixWorld.elements[2]!,
      camera.matrixWorld.elements[0]!,
    ).toFixed(4);
    mount.dataset.cameraElevation = (-camera.rotation.x).toFixed(4);
    mount.dataset.entranceProgress = entranceProgress.toFixed(4);
    mount.dataset.cameraFraming = transition.framing.toFixed(4);
    if (
      entranceProgress < 1 ||
      animationTime >= 0 ||
      hoverMoving ||
      shiftMoving ||
      brushActive ||
      cameraMoving ||
      driftMovingX ||
      driftMovingY
    )
      wake();
  }

  function wake() {
    if (!frame && !disposed && visible && !document.hidden && !contextLost)
      frame = requestAnimationFrame(render);
  }

  function resize() {
    const { width, height } = mount.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    surface?.resize();
    aspect = width / height;
    viewportWidth = width;
    updateCamera();
    wake();
  }

  function hit(event: PointerEvent) {
    const rect = mount.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);
    const intersection = raycaster.intersectObject(
      scrollProgress >= BRUSH_VIEW_START ? bed : hitVolume,
      false,
    )[0];
    if (intersection) {
      hitLocal.copy(intersection.point);
      arrangement.worldToLocal(hitLocal);
    }
    return Boolean(intersection);
  }

  function pointerMove(event: PointerEvent) {
    if (!event.isPrimary) return;
    if (scrollProgress >= BRUSH_VIEW_START) {
      if (event.pointerType !== "mouse" && event.pointerId !== brushPointer) return;
      const onRice = hit(event);
      mount.style.cursor = onRice ? "grab" : "default";
      if (onRice) {
        if (hasBrushPoint)
          sweep({
            fromX: previousBrush.x,
            fromZ: previousBrush.y,
            toX: hitLocal.x,
            toZ: hitLocal.z,
          });
        previousBrush.set(hitLocal.x, hitLocal.z);
      }
      hasBrushPoint = onRice;
      return;
    }
    if (event.pointerType === "touch") return;
    isOver = hit(event);
    goal.set(
      isOver ? THREE.MathUtils.clamp(hitLocal.x / 1.75, -1, 1) : 0,
      isOver ? THREE.MathUtils.clamp(hitLocal.z / 1.15, -1, 1) : 0,
    );
    mount.style.cursor = isOver ? "pointer" : "default";
    wake();
  }
  function driftPointer(event: PointerEvent) {
    if (event.pointerType !== "mouse" || reduced || scrollProgress >= BRUSH_VIEW_START) return;
    const rect = cameraViewport.getBoundingClientRect();
    driftGoal.set(
      THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1),
      THREE.MathUtils.clamp(1 - ((event.clientY - rect.top) / rect.height) * 2, -1, 1),
    );
    if (!frame) lastTime = performance.now();
    wake();
  }
  function driftLeave() {
    driftGoal.set(0, 0);
    if (!frame) lastTime = performance.now();
    wake();
  }
  function leave() {
    if (brushPointer === null) hasBrushPoint = false;
    isOver = false;
    goal.set(0, 0);
    mount.style.cursor = "default";
    wake();
  }
  let pressed: { x: number; y: number } | null = null;
  function sweep(stroke: BrushStroke) {
    if (scrollProgress < BRUSH_VIEW_START || animationTime >= 0 || disposed || contextLost) return;
    let affected = false;
    for (const grain of grains) {
      if (grain.layer === 0) continue;
      if (brushRice(grain.brush, grain.anchor, stroke, grain.mobility, reduced ? 0.22 : 1))
        affected = true;
    }
    if (!affected) return;
    if (!brushActive) lastTime = performance.now();
    brushActive = true;
    brushStrokes++;
    wake();
  }
  function pointerDown(event: PointerEvent) {
    if (!event.isPrimary) return;
    if (scrollProgress >= BRUSH_VIEW_START) {
      pressed = null;
      hasBrushPoint = hit(event);
      if (hasBrushPoint) {
        previousBrush.set(hitLocal.x, hitLocal.z);
        brushPointer = event.pointerId;
        mount.setPointerCapture(event.pointerId);
      }
      return;
    }
    pressed = hit(event) ? { x: event.clientX, y: event.clientY } : null;
  }
  function pointerUp(event: PointerEvent) {
    if (event.pointerId === brushPointer) {
      endBrush();
      return;
    }
    if (
      scrollProgress < BRUSH_VIEW_START &&
      pressed &&
      Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) < 12 &&
      hit(event)
    )
      toss();
    pressed = null;
  }
  function cancelPointer() {
    pressed = null;
    endBrush();
    leave();
  }
  function endBrush() {
    const id = brushPointer;
    brushPointer = null;
    hasBrushPoint = false;
    if (id !== null && mount.hasPointerCapture(id)) mount.releasePointerCapture(id);
  }
  function focus() {
    focused = mount.matches(":focus-visible");
    wake();
  }
  function blur() {
    focused = false;
    keyboardBrush.set(0, 0);
    wake();
  }
  function toss() {
    if (scrollProgress >= BRUSH_VIEW_START || animationTime >= 0 || disposed || contextLost) return;
    brushActive = false;
    const random = seededRandom(7319 + tossNumber++ * 193);
    for (const grain of grains) {
      brushRotation.setFromAxisAngle(up, grain.brush.yaw);
      grain.rotation.premultiply(brushRotation);
      grain.brush.velocityU =
        grain.brush.velocityV =
        grain.brush.yaw =
        grain.brush.spin =
        grain.brush.lift =
          0;
      const radius = grain.anchor.length();
      const inWave = grain.layer === 2 && random() < 0.28 * (1 - radius * 0.45);
      grain.height = inWave
        ? 0.18 + (1 - radius * radius) * (0.24 + random() ** 1.6 * 0.8)
        : grain.layer > 0
          ? random() * 0.028
          : 0;
      grain.duration = flightDuration(grain.height);
      grain.delay = 0.23 + (grain.anchor.x + 0.87) * 0.065 + random() * 0.065;
      grain.spin = (random() - 0.5) * (inWave ? 4.6 : 0.18);
      const scatter = inWave && !reduced ? 0.052 : 0;
      const landing = constrainRice(
        grain.anchor.x + (random() - 0.5) * scatter + riceShiftX.value * 0.18,
        grain.anchor.y + (random() - 0.5) * scatter + riceShiftZ.value * 0.18,
      );
      grain.landing.set(landing.u, landing.v);
      // A new, mostly horizontal resting pose; no rewind of the airborne rotation.
      spin.setFromAxisAngle(up, (random() - 0.5) * (inWave && !reduced ? 0.8 : 0));
      grain.landingRotation.copy(spin).multiply(grain.rotation);
      grain.launched = false;
      grain.settled = grain.height === 0;
    }
    animationTime = 0;
    callbacks.onPlaying(true);
    lastTime = 0;
    wake();
  }
  function visibility() {
    lastTime = 0;
    if (document.hidden) {
      cancelPointer();
      cancelAnimationFrame(frame);
      frame = 0;
    } else wake();
  }
  function lost(event: Event) {
    event.preventDefault();
    contextLost = true;
    cancelAnimationFrame(frame);
    frame = 0;
    callbacks.onFailure();
  }
  function restored() {
    contextLost = false;
    animationTime = -1;
    needsGrainUpdate = true;
    lastTime = 0;
    callbacks.onPlaying(false);
    wake();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(mount);
  const intersection = new IntersectionObserver(
    ([entry]) => {
      visible = entry?.isIntersecting ?? false;
      if (!visible) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        lastTime = 0;
        wake();
      }
    },
    { threshold: 0 },
  );
  // The homepage viewport owns visibility throughout the entrance and scroll transition.
  intersection.observe(options.viewport ?? mount);
  mount.addEventListener("pointermove", pointerMove, { passive: true });
  mount.addEventListener("pointerleave", leave);
  mount.addEventListener("pointerdown", pointerDown, { passive: true });
  mount.addEventListener("pointerup", pointerUp);
  mount.addEventListener("pointercancel", cancelPointer);
  mount.addEventListener("lostpointercapture", cancelPointer);
  mount.addEventListener("focus", focus);
  mount.addEventListener("blur", blur);
  cameraViewport.addEventListener("pointermove", driftPointer, { passive: true, capture: true });
  cameraViewport.addEventListener("pointerleave", driftLeave);
  document.addEventListener("visibilitychange", visibility);
  renderer.domElement.addEventListener("webglcontextlost", lost);
  renderer.domElement.addEventListener("webglcontextrestored", restored);
  resize();

  return {
    toss,
    brushWithKey(x, z) {
      // Arrow keys follow screen directions even when the orbit ends at another heading.
      keyboardFrame.copy(arrangement.quaternion).invert();
      keyboardDirection
        .set(x, -z, 0)
        .applyQuaternion(camera.quaternion)
        .applyQuaternion(keyboardFrame);
      const nextX = THREE.MathUtils.clamp(keyboardBrush.x + keyboardDirection.x * 0.2, -1.3, 1.3);
      const nextZ = THREE.MathUtils.clamp(keyboardBrush.y + keyboardDirection.z * 0.2, -0.55, 0.55);
      sweep({ fromX: keyboardBrush.x, fromZ: keyboardBrush.y, toX: nextX, toZ: nextZ });
      keyboardBrush.set(nextX, nextZ);
    },
    setDark(value) {
      scene.environmentIntensity = options.sculptedLight
        ? value
          ? 0.46
          : 0.42
        : value
          ? 0.72
          : 0.55;
      key.intensity = options.sculptedLight ? (value ? 2.65 : 2.45) : 2.4;
      fill.intensity = options.sculptedLight ? (value ? 0.22 : 0.32) : 0.55;
      rim.intensity = options.sculptedLight ? (value ? 1.75 : 1.4) : value ? 2.5 : 1.8;
      ground.material.opacity = options.sculptedLight ? (value ? 0.1 : 0.07) : value ? 0.08 : 0.025;
      surface?.setDark(value);
      wake();
    },
    setSlow(value) {
      slow = value;
    },
    setReducedMotion(value) {
      reduced = value;
      if (value) {
        entranceProgress = 1;
        entrance = riceEntrance(1);
      }
      goal.set(0, 0);
      driftGoal.set(0, 0);
      driftX.value = driftY.value = driftX.velocity = driftY.velocity = 0;
      cameraProgress.value = scrollProgress = scrollTarget;
      cameraProgress.velocity = 0;
      updateCamera();
      needsGrainUpdate = true;
      wake();
    },
    setScrollProgress(value) {
      const next = THREE.MathUtils.clamp(value, 0, 1);
      if (hasScrollTarget && next === scrollTarget) return;
      scrollTarget = next;
      if (!hasScrollTarget || reduced) {
        cameraProgress.value = scrollProgress = next;
        cameraProgress.velocity = 0;
        updateCamera();
      }
      hasScrollTarget = true;
      if (!frame) lastTime = performance.now();
      // A scroll must not leave an old pointer hit tilting the overhead composition.
      cancelPointer();
      needsGrainUpdate = true;
      wake();
    },
    dispose() {
      disposed = true;
      endBrush();
      cancelAnimationFrame(frame);
      observer.disconnect();
      intersection.disconnect();
      mount.removeEventListener("pointermove", pointerMove);
      mount.removeEventListener("pointerleave", leave);
      mount.removeEventListener("pointerdown", pointerDown);
      mount.removeEventListener("pointerup", pointerUp);
      mount.removeEventListener("pointercancel", cancelPointer);
      mount.removeEventListener("lostpointercapture", cancelPointer);
      mount.removeEventListener("focus", focus);
      mount.removeEventListener("blur", blur);
      cameraViewport.removeEventListener("pointermove", driftPointer, true);
      cameraViewport.removeEventListener("pointerleave", driftLeave);
      document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.domElement.removeEventListener("webglcontextrestored", restored);
      surface?.dispose();
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material])
            materials.add(material);
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      maps.color.dispose();
      maps.bump.dispose();
      riceTexture.color.dispose();
      riceTexture.bump.dispose();
      shadow.material.map?.dispose();
      bed.material.map?.dispose();
      environment.dispose();
      key.shadow.dispose();
      rice.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      brushSurface.remove();
    },
  };
}
