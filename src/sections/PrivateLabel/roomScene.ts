import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createPalaceDoor } from "@/components/hall/palaceDoor";
import { createRoomAtmosphere } from "./roomAtmosphere";
import { createPackStream } from "./packStream";
import { createRoomStonework } from "./stonework";
import { createLabelPack } from "./pack";
import type { LabelRoomScene, PackFinish } from "./types";

/** One dark waterfront room, shared by all five scroll chapters. */
export function createLabelRoom(
  mount: HTMLElement,
  options: { reduced: boolean; onReady: () => void; onError: () => void },
): LabelRoomScene {
  let small = matchMedia("(width < 48rem)").matches;
  let compact = matchMedia("(height < 45rem)").matches;
  let disposed = false,
    reduced = options.reduced,
    visible = true,
    frame = 0,
    previous = 0,
    time = 0;
  let target = 0,
    progress = 0,
    intro = 0,
    hover = 0,
    hoverTarget = 0,
    yaw = 0,
    yawTarget = 0,
    entry = 0;
  let entering = false,
    onEntered: (() => void) | undefined;
  let ready = false,
    frames = 0,
    drag: { id: number; x: number; yaw: number } | null = null;
  const abort = new AbortController();
  const signal = abort.signal;
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.25 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.info.autoReset = false;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.domElement.setAttribute("aria-hidden", "true");
  mount.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070e19);
  scene.fog = new THREE.FogExp2(0x0a1420, 0.03);
  const camera = new THREE.PerspectiveCamera(small ? 57 : 48, 1, 0.1, 180);
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>(),
    textures = new Set<THREE.Texture>();
  const own = <T extends THREE.BufferGeometry | THREE.Material | THREE.Texture>(v: T): T => {
    if (v instanceof THREE.BufferGeometry) geometries.add(v);
    else if (v instanceof THREE.Material) materials.add(v);
    else textures.add(v);
    return v;
  };
  const textureLoader = new THREE.TextureLoader();
  const assets: Promise<unknown>[] = [];
  function texture(file: string, repeat: number) {
    let done = () => {};
    assets.push(
      new Promise<void>((resolve) => {
        done = resolve;
      }),
    );
    const t = own(
      textureLoader.load(
        `/textures/palace/${file}.webp`,
        (loaded) => {
          if (disposed) loaded.dispose();
          done();
        },
        undefined,
        done,
      ),
    );
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return t;
  }
  const floorMap = texture("worn-floor", 9),
    stoneMap = texture("aged-limestone", 1),
    masonryMap = texture("weathered-masonry", 1);
  const stone = own(
    new THREE.MeshStandardMaterial({
      map: stoneMap,
      bumpMap: stoneMap,
      bumpScale: 0.075,
      color: 0x727b82,
      roughness: 0.96,
      envMapIntensity: 0.1,
    }),
  );
  const darker = own(
    new THREE.MeshStandardMaterial({
      map: stoneMap,
      bumpMap: stoneMap,
      bumpScale: 0.065,
      color: 0x39434c,
      roughness: 0.98,
      envMapIntensity: 0.06,
    }),
  );
  const floorMat = own(
    new THREE.MeshStandardMaterial({
      map: floorMap,
      bumpMap: floorMap,
      bumpScale: 0.065,
      color: 0x747a7e,
      roughness: 0.98,
      metalness: 0,
      envMapIntensity: 0.06,
    }),
  );
  const masonry = own(
    new THREE.MeshStandardMaterial({
      map: masonryMap,
      bumpMap: masonryMap,
      bumpScale: 0.09,
      color: 0x626b74,
      roughness: 0.98,
      envMapIntensity: 0.08,
    }),
  );
  // World-sized texture coordinates keep the reused stone detailed on large walls and stairs.
  for (const material of [stone, darker, floorMat, masonry])
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        "#include <uv_vertex>",
        `#include <uv_vertex>
      vec3 materialPoint=(modelMatrix*vec4(position,1.)).xyz;
      vec3 materialNormal=normalize(mat3(modelMatrix)*normal);
      vec2 stoneUv=abs(materialNormal.y)>.5?materialPoint.xz:abs(materialNormal.z)>.5?materialPoint.xy:materialPoint.zy;
      vMapUv=stoneUv*.32;vBumpMapUv=vMapUv;`,
      );
    };
  const metal = own(
    new THREE.MeshStandardMaterial({ color: 0x294354, metalness: 0.8, roughness: 0.32 }),
  );
  const boxGeometry = own(new THREE.BoxGeometry(1, 1, 1));
  function box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material = stone,
  ) {
    const mesh = new THREE.Mesh(boxGeometry, material);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }
  const pmrem = new THREE.PMREMGenerator(renderer),
    room = new RoomEnvironment(),
    environment = pmrem.fromScene(room, 0.07);
  pmrem.dispose();
  room.dispose();
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.07;
  scene.add(new THREE.HemisphereLight(0xb8cee5, 0x080d16, 0.2));
  const moon = new THREE.DirectionalLight(0xb4c7dd, 0.42);
  moon.position.set(-15, 22, -38);
  scene.add(moon);
  const key = new THREE.SpotLight(0xe1e4e9, 180, 22, 0.3, 0.7, 2);
  key.position.set(-1.5, 8, -3.5);
  key.target.position.set(2, 3, -8);
  key.castShadow = true;
  key.shadow.mapSize.setScalar(1024);
  key.shadow.bias = -0.00015;
  key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const rim = new THREE.SpotLight(0x8aaedb, 210, 23, 0.35, 0.8, 2);
  rim.position.set(6, 8, -14);
  rim.target.position.set(2, 2, -8);
  scene.add(rim, rim.target);
  const glowLight = new THREE.PointLight(0x679bd5, 2.5, 5, 2);
  glowLight.position.set(2, 2.5, -8);
  scene.add(glowLight);
  box(27, 0.55, 39, 0, -0.3, -5, floorMat);
  // Floor inlays and a clear stepped approach draw the eye through the doorway.
  for (const x of [-6.6, 6.6]) box(0.025, 0.008, 35, x, 0.01, -5, metal);
  const stonework = createRoomStonework(stone);
  scene.add(stonework.group);
  assets.push(stonework.ready);
  // Deep monumental arch, open to the water rather than a back wall.
  const archShape = new THREE.Shape();
  archShape.absarc(0, 0, 10.4, 0, Math.PI, false);
  archShape.lineTo(-9.35, 0);
  archShape.absarc(0, 0, 9.35, Math.PI, 0, true);
  archShape.closePath();
  const archG = own(
    new THREE.ExtrudeGeometry(archShape, { depth: 1.15, bevelEnabled: false, curveSegments: 56 }),
  );
  for (const z of [-16, -5]) {
    const arch = new THREE.Mesh(archG, stone);
    arch.position.set(0, 9.65, z - 0.5);
    scene.add(arch);
  }
  for (const x of [-11.5, 11.5]) {
    box(1.5, 14, 29, x, 7, -6, masonry);
    box(1.9, 0.4, 29, x, 14, -6, stone);
  }
  box(23, 0.65, 8, 0, 15.8, 4, darker);
  // Low waterfront balustrades leave an uninterrupted harbour horizon.
  for (const x of [-8.5, 8.5]) {
    box(7, 0.32, 0.75, x, 0.75, -23, stone);
    for (let i = 0; i < 5; i++) box(0.24, 0.65, 0.3, x - 2.5 + i * 1.25, 0.36, -23, darker);
  }
  const pack = createLabelPack();
  const finishes: PackFinish[] = ["midnight", "blue", "natural"];
  let finishIndex = 0;
  pack.setFinish(finishes[finishIndex]!, true);
  mount.dataset.finish = finishes[finishIndex];
  function cycleFinish() {
    finishIndex = (finishIndex + 1) % finishes.length;
    pack.setFinish(finishes[finishIndex]!, reduced);
    mount.dataset.finish = finishes[finishIndex];
    wake();
  }
  const packPivot = new THREE.Group();
  packPivot.position.set(2, 3.3, -8);
  packPivot.rotation.y = -0.42;
  pack.group.position.y = -1.25;
  pack.body.castShadow = false;
  packPivot.add(pack.group);
  scene.add(packPivot);
  // The floating pack has a soft ground shadow, without a moving shadow-map pass.
  const contactMat = own(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { opacity: { value: 0.28 } },
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform float opacity;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.;float a=exp(-dot(p,p)*3.5)*opacity;gl_FragColor=vec4(.006,.01,.018,a);}`,
    }),
  );
  const contact = new THREE.Mesh(own(new THREE.PlaneGeometry(2.3, 1.7)), contactMat);
  contact.rotation.x = -Math.PI / 2;
  contact.position.set(2, 1.417, -8);
  scene.add(contact);
  const haloG = own(new THREE.CylinderGeometry(0.13, 2.3, 10.5, 40, 1, true));
  const haloMat = own(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec2 vUv;void main(){float edge=pow(abs(cos(vUv.x*6.283185)),4.);float a=edge*pow(1.-vUv.y,1.3)*.006;gl_FragColor=vec4(.24,.5,.95,a);}`,
    }),
  );
  const beam = new THREE.Mesh(haloG, haloMat);
  beam.position.set(2, 6.8, -8);
  scene.add(beam);
  // Looking back reveals the other side of the wholesale doorway.
  box(24, 0.55, 10, 0, -0.3, 16, floorMat);
  const doorPale = own(
    new THREE.MeshStandardMaterial({
      map: stoneMap,
      bumpMap: stoneMap,
      bumpScale: 0.028,
      color: 0xb1aaa0,
      roughness: 0.85,
      envMapIntensity: 0.2,
    }),
  );
  const doorTrim = own(
    new THREE.MeshStandardMaterial({
      map: stoneMap,
      bumpMap: stoneMap,
      bumpScale: 0.025,
      color: 0x969a9b,
      roughness: 0.85,
      envMapIntensity: 0.2,
    }),
  );
  const doorMetal = own(
    new THREE.MeshStandardMaterial({ color: 0x303f4b, metalness: 0.72, roughness: 0.44 }),
  );
  const doorway = createPalaceDoor({
    walls: masonry,
    pale: doorPale,
    trim: doorTrim,
    bronze: doorMetal,
  });
  doorway.group.position.z = 18;
  doorway.group.rotation.y = Math.PI;
  scene.add(doorway.group);
  const doorLight = new THREE.PointLight(0xc8d9ef, 35, 14, 2);
  doorLight.position.set(0, 3.4, 16.9);
  scene.add(doorLight);
  const waterG = own(new THREE.PlaneGeometry(180, 150, 60, 70));
  waterG.rotateX(-Math.PI / 2);
  const waterMat = own(
    new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `uniform float time;varying vec3 vWorld;varying float vWave;void main(){vec3 p=position;float w=sin(p.x*.65+time*.5+p.z*.13)*.05+sin(p.z*1.7-time*.75)*.018;p.y+=w;vWave=w;vec4 world=modelMatrix*vec4(p,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,
      fragmentShader: `uniform float time;varying vec3 vWorld;varying float vWave;void main(){float lines=pow(.5+.5*sin(vWorld.z*4.+vWorld.x*.25+time*.6),12.);float reflection=exp(-pow((vWorld.x+8.)/(3.+abs(vWorld.z)*.06),2.));vec3 col=mix(vec3(.003,.007,.014),vec3(.02,.044,.073),reflection*.38);col+=vec3(.06,.12,.2)*reflection*lines*.18;col+=vWave*.035;float fog=1.-exp(-length(vWorld.xz)*.018);col=mix(col,vec3(.006,.012,.021),fog*.85);gl_FragColor=vec4(col,1.);}`,
    }),
  );
  const water = new THREE.Mesh(waterG, waterMat);
  water.position.set(0, -0.33, -94);
  scene.add(water);
  // A restrained cargo-ship silhouette, distant enough to suggest the supply journey.
  const ship = new THREE.Group();
  ship.position.set(-20, 0.35, -94);
  ship.rotation.y = -0.16;
  ship.scale.setScalar(0.7);
  scene.add(ship);
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-10, 0.8);
  hullShape.lineTo(10, 0.8);
  hullShape.lineTo(8, -0.7);
  hullShape.lineTo(-8, -0.7);
  hullShape.closePath();
  const hullG = own(new THREE.ExtrudeGeometry(hullShape, { depth: 3, bevelEnabled: false }));
  const shipMat = own(new THREE.MeshStandardMaterial({ color: 0x08121e, roughness: 0.95 }));
  const hull = new THREE.Mesh(hullG, shipMat);
  hull.position.z = -1.5;
  ship.add(hull);
  for (let i = 0; i < 7; i++)
    for (let j = 0; j < 2; j++) {
      const cargo = new THREE.Mesh(boxGeometry, shipMat);
      cargo.scale.set(2.25, 0.8, 2.7);
      cargo.position.set(-7 + i * 2.35, 1.25 + j * 0.85, 0);
      ship.add(cargo);
    }
  const bridge = new THREE.Mesh(boxGeometry, shipMat);
  bridge.scale.set(2.4, 3.2, 2.5);
  bridge.position.set(6.5, 3.1, 0);
  ship.add(bridge);
  const bridgeWindow = new THREE.Mesh(
    boxGeometry,
    own(new THREE.MeshBasicMaterial({ color: 0x121f2f })),
  );
  bridgeWindow.scale.set(2.48, 0.18, 2.52);
  bridgeWindow.position.set(6.5, 3.75, 0);
  ship.add(bridgeWindow);
  for (const x of [-25, 24, 35]) {
    box(0.25, 12, 0.25, x, 5, -82, metal);
    const arm = box(9, 0.25, 0.25, x + 3, 11, -82, metal);
    arm.rotation.z = 0.15;
    box(0.045, 7, 0.045, x + 7, 7.5, -82, metal);
  }
  // Fixed GPU particle buffers; the shader moves dust and soft glints without new objects.
  const count = small ? 70 : 140;
  const positions = new Float32Array(count * 3),
    seeds = new Float32Array(count);
  const random = (n: number) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (random(i * 4) - 0.5) * 22;
    positions[i * 3 + 1] = random(i * 4 + 1) * 11;
    positions[i * 3 + 2] = 12 - random(i * 4 + 2) * 44;
    seeds[i] = random(i * 4 + 3);
  }
  const dustG = own(new THREE.BufferGeometry());
  dustG.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  dustG.setAttribute("seed", new THREE.BufferAttribute(seeds, 1));
  const dustMat = own(
    new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, ratio: { value: renderer.getPixelRatio() } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `uniform float time,ratio;attribute float seed;varying float vAlpha;void main(){vec3 p=position;p.x+=sin(time*.13+seed*21.)*.3;p.y+=sin(time*.19+seed*12.)*.2;vec4 view=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*view;gl_PointSize=clamp((4.+seed*12.)*ratio/max(1.,-view.z*.12),1.,18.);vAlpha=(.12+.2*pow(sin(time*.4+seed*90.),6.))*smoothstep(.5,3.,-view.z);}`,
      fragmentShader: `varying float vAlpha;void main(){vec2 p=gl_PointCoord-.5;float a=exp(-dot(p,p)*28.)*vAlpha;gl_FragColor=vec4(.5,.74,1.,a);}`,
    }),
  );
  scene.add(new THREE.Points(dustG, dustMat));
  const atmosphere = createRoomAtmosphere(small);
  const stream = createPackStream(small, atmosphere.depth);
  const focusPoint = new THREE.Vector3();
  let focusDistance = 18;
  const pointer = new THREE.Vector2(),
    pointerTarget = new THREE.Vector2(),
    ray = new THREE.Raycaster(),
    ndc = new THREE.Vector2(),
    packPointer = new THREE.Vector2(),
    packPointerTarget = new THREE.Vector2(),
    projectedPack = new THREE.Vector3(),
    hoverSphere = new THREE.Sphere(new THREE.Vector3(), 1.45);
  let tap: { id: number; x: number; y: number } | null = null;
  function overBag(event: PointerEvent) {
    const r = mount.getBoundingClientRect();
    ndc.set(
      ((event.clientX - r.left) / r.width) * 2 - 1,
      1 - ((event.clientY - r.top) / r.height) * 2,
    );
    ray.setFromCamera(ndc, camera);
    hoverSphere.center.copy(packPivot.position);
    const hit =
      ray.intersectObject(pack.body).length > 0 ||
      (hoverTarget > 0 && ray.ray.intersectsSphere(hoverSphere));
    if (hit) {
      projectedPack.copy(packPivot.position).project(camera);
      const height =
        1.25 /
        (Math.tan((camera.fov * Math.PI) / 360) * camera.position.distanceTo(packPivot.position));
      packPointerTarget.set(
        THREE.MathUtils.clamp((ndc.x - projectedPack.x) / (height / camera.aspect), -1, 1),
        THREE.MathUtils.clamp((ndc.y - projectedPack.y) / height, -1, 1),
      );
    }
    return hit;
  }
  mount.addEventListener(
    "pointermove",
    (event) => {
      if (tap && Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > 8) tap = null;
      const r = mount.getBoundingClientRect();
      pointerTarget.set(
        (event.clientX - r.left) / r.width - 0.5,
        (event.clientY - r.top) / r.height - 0.5,
      );
      if (drag) {
        yawTarget = drag.yaw + (event.clientX - drag.x) * 0.009;
        wake();
        return;
      }
      hoverTarget = event.pointerType !== "touch" && overBag(event) ? 1 : 0;
      mount.dataset.interactive = String(hoverTarget > 0);
      wake();
    },
    { signal },
  );
  mount.addEventListener(
    "pointerleave",
    () => {
      if (!drag) {
        pointerTarget.set(0, 0);
        hoverTarget = 0;
      }
      wake();
    },
    { signal },
  );
  mount.addEventListener(
    "pointerdown",
    (event) => {
      if (event.button !== 0 || !overBag(event)) return;
      tap = { id: event.pointerId, x: event.clientX, y: event.clientY };
      if (event.pointerType === "touch") return;
      drag = { id: event.pointerId, x: event.clientX, yaw: yawTarget };
      mount.setPointerCapture(event.pointerId);
    },
    { signal },
  );
  const endDrag = (event: PointerEvent) => {
    if (
      event.type === "pointerup" &&
      tap?.id === event.pointerId &&
      Math.hypot(event.clientX - tap.x, event.clientY - tap.y) < 10
    ) {
      cycleFinish();
    }
    tap = null;
    drag = null;
  };
  mount.addEventListener("pointerup", endDrag, { signal });
  mount.addEventListener("pointercancel", endDrag, { signal });
  mount.addEventListener("lostpointercapture", endDrag, { signal });
  const eye = new THREE.Vector3(),
    look = new THREE.Vector3();
  const lerp = THREE.MathUtils.lerp;
  function pose() {
    const journey = Math.min(1, progress / 0.8);
    const close = THREE.MathUtils.smoothstep(journey, 0.12, 0.62),
      horizon = THREE.MathUtils.smoothstep(journey, 0.73, 1);
    eye.set(
      lerp(-1.1, -0.5, close) + horizon * 5.5,
      lerp(2.75, 3.65, close) + horizon * 0.5,
      lerp(13, 1.5, close) + horizon * 2.5,
    );
    look.set(
      lerp(0, 1.6, close) - horizon * 5,
      lerp(3.4, 2.9, close) + horizon * 0.15,
      -8 - horizon * 14,
    );
    if (small) {
      // Keep the pack above the mobile copy as we approach its pedestal.
      eye.z += lerp(-4, 3.5, close);
      eye.x = 1.6 + horizon * 4;
      look.x = 2 - horizon * 12;
      look.y = lerp(-1.1, 0.1, close) + horizon * 1.2;
      if (compact) {
        eye.z += 3 * close;
        look.y -= 1.2 * close;
      }
    }
    const returning = THREE.MathUtils.smoothstep(progress, 0.8, 0.985);
    if (returning > 0) {
      const turn = returning * Math.PI;
      const arcX = Math.sin(turn) * 2.5;
      eye.x = lerp(eye.x, small ? -0.8 : -2.1, returning) + arcX;
      eye.y = lerp(eye.y, small ? 2.9 : 2.8, returning);
      eye.z = lerp(eye.z, small ? (compact ? -1 : 1) : 6, returning) - Math.sin(turn) * 2.4;
      look.x = lerp(look.x, 0, returning);
      look.y = lerp(look.y, small ? -0.1 : 2.6, returning);
      look.z = lerp(look.z, 18, returning);
    }
    if (entry > 0) {
      const through = entry * entry * (3 - 2 * entry);
      eye.x = lerp(eye.x, 0, through);
      eye.y = lerp(eye.y, 2.5, through);
      eye.z = lerp(eye.z, 19, through);
      look.set(0, lerp(look.y, 2.8, through), 24);
    }
    if (!reduced) {
      eye.z += (1 - intro) * 3.5;
      eye.x += (1 - intro) * -0.9;
      eye.x += pointer.x * 0.36;
      eye.y -= pointer.y * 0.2;
    }
    camera.position.copy(eye);
    camera.lookAt(look);
    camera.updateMatrixWorld();
    focusPoint.set(2 * (1 - returning), lerp(3.3, 2.6, returning), lerp(-8, 18, returning));
    focusDistance = Math.max(3, -focusPoint.applyMatrix4(camera.matrixWorldInverse).z);
  }
  function render(now: number) {
    frame = 0;
    if (disposed || document.hidden || !visible) return;
    const moving =
      Math.abs(progress - target) > 0.0001 ||
      Math.abs(yaw - yawTarget) > 0.001 ||
      Math.abs(hover - hoverTarget) > 0.001 ||
      pointer.distanceToSquared(pointerTarget) > 0.0001 ||
      packPointer.distanceToSquared(packPointerTarget) > 0.0001 ||
      intro < 1 ||
      (entering && entry < 1);
    if (!reduced && previous && now - previous < (moving ? 16 : 33) - 1) {
      wake();
      return;
    }
    const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    previous = now;
    if (!reduced) time += dt;
    const ease = reduced ? 1 : 1 - Math.exp(-dt * 5);
    progress += (target - progress) * ease;
    intro = reduced ? 1 : Math.min(1, intro + dt / 0.95);
    hover += (hoverTarget - hover) * ease;
    pointer.lerp(pointerTarget, ease);
    yaw += (yawTarget - yaw) * ease;
    packPointer.lerp(packPointerTarget, ease);
    pack.update(dt, reduced);
    const hoverMotion = reduced ? 0 : hover;
    packPivot.rotation.set(
      -hoverMotion * packPointer.y * 0.16 + (reduced ? 0 : Math.sin(time * 0.43) * 0.012),
      -0.42 + yaw + hoverMotion * (0.36 + packPointer.x * 0.52),
      -hoverMotion * packPointer.x * 0.08 + (reduced ? 0 : Math.sin(time * 0.56) * 0.016),
    );
    const floatY = 2.05 + hoverMotion * 0.14 + (reduced ? 0 : Math.sin(time * 0.72) * 0.095);
    packPivot.position.y = floatY + 1.25;
    contactMat.uniforms.opacity!.value = 0.28 - (floatY - 2.05) * 0.14;
    mount.dataset.floatY = floatY.toFixed(3);
    mount.dataset.packRotation = packPivot.rotation.y.toFixed(3);
    mount.dataset.hover = hover.toFixed(3);
    if (entering && progress > 0.982) entry = Math.min(1, entry + dt / 2.15);
    for (const { hinge, side } of doorway.leaves) hinge.rotation.y = side * (0.04 + entry * 1.4);
    doorLight.intensity = 35 * (1 - entry * 0.8);
    if (entry > 0.76 && onEntered) {
      const done = onEntered;
      onEntered = undefined;
      done();
    }
    pose();
    stream.update(time, hoverMotion);
    mount.dataset.entry = entry.toFixed(3);
    waterMat.uniforms.time!.value = time;
    dustMat.uniforms.time!.value = time;
    renderer.info.reset();
    atmosphere.render(renderer, scene, camera, focusDistance, stream.scene);
    mount.dataset.frames = String(++frames);
    mount.dataset.progress = progress.toFixed(4);
    mount.dataset.yaw = yaw.toFixed(3);
    mount.dataset.geometries = String(renderer.info.memory.geometries);
    mount.dataset.textures = String(renderer.info.memory.textures);
    mount.dataset.calls = String(renderer.info.render.calls);
    if (
      !reduced ||
      (entering && entry < 1) ||
      Math.abs(progress - target) > 0.001 ||
      Math.abs(yaw - yawTarget) > 0.001
    )
      wake();
    else previous = 0;
  }
  function wake() {
    if (ready && !frame && !disposed && !document.hidden && visible)
      frame = requestAnimationFrame(render);
  }
  function resize() {
    const { width, height } = mount.getBoundingClientRect();
    if (!width || !height) return;
    small = width < 768;
    compact = height < 720;
    renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.25 : 1.5));
    renderer.setSize(width, height);
    stream.resize(width, height, renderer.getPixelRatio());
    dustMat.uniforms.ratio!.value = renderer.getPixelRatio();
    atmosphere.resize(width, height, renderer.getPixelRatio());
    camera.fov = small ? 57 : 48;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    wake();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(mount);
  resize();
  const intersection = new IntersectionObserver(
    (entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible) wake();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
        previous = 0;
      }
    },
    { threshold: 0 },
  );
  intersection.observe(mount);
  document.addEventListener(
    "visibilitychange",
    () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      drag = null;
      tap = null;
      hoverTarget = 0;
      if (!document.hidden) wake();
    },
    { signal },
  );
  renderer.domElement.addEventListener(
    "webglcontextlost",
    (event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      frame = 0;
      options.onError();
    },
    { signal },
  );
  void Promise.allSettled(assets)
    .then(async () => {
      if (disposed) return;
      pose();
      await renderer.compileAsync(scene, camera);
      if (disposed) return;
      renderer.shadowMap.needsUpdate = true;
      ready = true;
      mount.dataset.ready = "true";
      options.onReady();
      wake();
    })
    .catch(() => {
      if (!disposed) options.onError();
    });
  return {
    setProgress(value) {
      if (!entering) target = THREE.MathUtils.clamp(value, 0, 1);
      wake();
    },
    enterDoor(done) {
      if (entering) return;
      entering = true;
      target = 1;
      onEntered = done;
      wake();
    },
    cycleFinish,
    turnPack(direction = 1) {
      yawTarget += direction * Math.PI * 0.32;
      wake();
    },
    setReducedMotion(value) {
      reduced = value;
      previous = 0;
      wake();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      abort.abort();
      observer.disconnect();
      intersection.disconnect();
      pack.dispose();
      stream.dispose();
      doorway.dispose();
      stonework.dispose();
      atmosphere.dispose();
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      environment.dispose();
      key.shadow.map?.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      mount.dataset.disposed = "true";
    },
  };
}
