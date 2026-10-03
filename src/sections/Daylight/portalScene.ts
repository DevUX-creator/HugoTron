import * as THREE from "three";
import { createCoreInstallation } from "@/components/world/installationCore";
import { createCubeEnvironment } from "@/components/world/cubeEnvironment";
import { PAPER_NOISE } from "./paperNoise";
import { createWorldRocks } from "@/components/world/rocks";
import { WORLD_DEPTH } from "@/components/world/journey";

/** Reuses the brand object, never the GLB landscape or the full World render pipeline. */
export async function createPortalScene(element: HTMLElement, reduced: boolean) {
  const host = element.querySelector<HTMLElement>(".paper-portal__canvas")!;
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.88;
  renderer.transmissionResolutionScale = 1;
  renderer.setClearColor(0x030a16);
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 30);
  camera.position.set(0.3, 2.1, 4.8);
  camera.lookAt(-0.3, 1.65, 0);
  const sculpture = createCoreInstallation(true, renderer.getPixelRatio());
  element.dataset.cube = sculpture.group.name;
  scene.add(sculpture.group);
  // Reuse the hero's sparks and flowing, tapering filaments, including its cube outline.
  scene.add(sculpture.particles);
  // The shared electric outline expects scene depth. A small depth-only pass preserves
  // its sharp front edges and keeps the rear edges behind the glass.
  const depth = new THREE.WebGLRenderTarget(1, 1);
  const depthTexture = new THREE.DepthTexture(1, 1);
  depth.depthTexture = depthTexture;
  const depthMaterial = new THREE.MeshDepthMaterial();
  depthMaterial.colorWrite = false;
  sculpture.uniforms.tDepth.value = depth.depthTexture;
  const environment = createCubeEnvironment(renderer);
  sculpture.setEnvironment(environment.texture);
  scene.add(new THREE.HemisphereLight(0xc5d9ff, 0x28374d, 0.04));
  const key = new THREE.SpotLight(0xe5efff, 260, 28, Math.PI * 0.16, 0.62, 2);
  key.position.set(-3.6, 6.8, -2.4);
  key.target.position.set(0, 0.4, 0.7);
  const fill = new THREE.SpotLight(0xaecaff, 70, 28, Math.PI * 0.18, 1, 2);
  fill.position.set(3.8, 5.6, -2.8);
  fill.target.position.set(0, 0.7, 0);
  scene.add(key, key.target, fill, fill.target);
  // The same fibrous paper front as the World → source transition, reversed into
  // an opening from the right edge. The scene stays in place behind the paper.
  const paperScene = new THREE.Scene();
  const paperCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const paperUniforms = {
    uProgress: { value: 0 },
    uMobile: { value: 0 },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uColor: {
      value: new THREE.Color(
        getComputedStyle(element).getPropertyValue("--color-world-paper").trim(),
      ).convertLinearToSRGB(),
    },
  };
  const paperMaterial = new THREE.ShaderMaterial({
    uniforms: paperUniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: `
      uniform float uProgress, uTime, uMobile;
      uniform vec2 uResolution;
      uniform vec3 uColor;
      varying vec2 vUv;
      ${PAPER_NOISE}
      void main() {
        vec2 centred = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
        // A broad torn opening with a lower-left tail, inspired by the supplied
        // silhouette. It reaches the screen edge, but retains its irregular
        // perimeter even after the mobile reveal finishes.
        vec2 p = vUv - vec2(0.68, 0.55);
        p = mat2(0.96, -0.28, 0.28, 0.96) * p;
        float body = length(p / vec2(mix(0.45, 0.51, uMobile), 0.39)) - 1.0;
        float tail = length((vUv - vec2(0.24, 0.23)) / vec2(0.29, 0.18)) - 1.0;
        float join = max(0.36 - abs(body - tail), 0.0) / 0.36;
        float outline = min(body, tail) - join * join * 0.09;
        outline += (fbm(vUv * 11.0) - 0.44) * 0.36;
        outline += (noise(vUv * 47.0) - 0.5) * 0.065;
        float front = 1.15 - uProgress * 1.4 - vUv.x;
        float edge = max(outline, front);
        float pixel = 1.0 / uResolution.y;
        vec2 paper = vUv * uResolution;
        float grain = hash(paper) - 0.5;
        float fibres = noise(paper * vec2(0.035, 0.6)) - 0.5;
        float pulp = fbm(centred * 3.0) - 0.44;
        vec3 color = uColor + grain * 0.026 + fibres * 0.014 + pulp * 0.022;
        float cover = smoothstep(-pixel, pixel, edge);
        float sceneGrain = hash(paper + floor(uTime * 8.0) * 17.0) * 0.5;
        gl_FragColor = vec4(mix(vec3(sceneGrain), color, cover), mix(mix(0.028, 0.01, uMobile), 1.0, cover));
      }
    `,
  });
  const paperGeometry = new THREE.PlaneGeometry(2, 2);
  paperScene.add(new THREE.Mesh(paperGeometry, paperMaterial));
  // A compact part of the existing mineral field; instancing keeps it to one draw call.
  const rocks = createWorldRocks(true);
  rocks.group.scale.setScalar(0.55);
  rocks.group.position.set(0, -0.25, WORLD_DEPTH * 0.55);
  const rockMesh = rocks.group.getObjectByName("Floating_mineral_fragments") as THREE.InstancedMesh<
    THREE.BufferGeometry,
    THREE.MeshStandardMaterial
  >;
  rockMesh.count = 24;
  rockMesh.material.envMap = environment.texture;
  rockMesh.material.envMapIntensity = 0.35;
  scene.add(rocks.group);
  let disposed = false,
    visible = false,
    pointerActive = false,
    frame = 0,
    previous = 0,
    elapsed = 8;
  const pointer = new THREE.Vector2(),
    target = new THREE.Vector2();
  const resize = () => {
    // Layout dimensions stay full-sized throughout the reveal. Transformed bounding
    // rectangles previously allocated a tiny canvas and stretched it into a blur.
    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    depth.setSize(renderer.domElement.width, renderer.domElement.height);
    paperUniforms.uResolution.value.set(renderer.domElement.width, renderer.domElement.height);
    paperUniforms.uMobile.value = innerWidth < 768 ? 1 : 0;
    sculpture.uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
    sculpture.uniforms.nearClip.value = camera.near;
    sculpture.uniforms.farClip.value = camera.far;
    wake();
  };
  const render = (now: number) => {
    frame = 0;
    if (disposed || !visible || document.hidden) return;
    const delta = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    elapsed += delta;
    pointer.lerp(target, 0.07);
    sculpture.update(elapsed, true, reduced, pointer);
    sculpture.updateHover(camera, pointer, pointerActive, reduced, delta);
    paperUniforms.uTime.value = reduced ? 0 : elapsed;
    rocks.update(reduced ? 8 : elapsed * 0.65, 1);
    sculpture.particles.visible = false;
    scene.overrideMaterial = depthMaterial;
    renderer.setRenderTarget(depth);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    scene.overrideMaterial = null;
    sculpture.particles.visible = true;
    renderer.render(scene, camera);
    renderer.autoClear = false;
    renderer.render(paperScene, paperCamera);
    renderer.autoClear = true;
    if (!reduced) frame = requestAnimationFrame(render);
  };
  function wake() {
    if (!frame && visible && !disposed && !document.hidden) frame = requestAnimationFrame(render);
  }
  const visibility = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = performance.now();
    wake();
  };
  const move = (event: PointerEvent) => {
    if (reduced || event.pointerType !== "mouse") return;
    pointerActive = true;
    const box = host.getBoundingClientRect();
    target.set(
      ((event.clientX - box.left) / box.width) * 2 - 1,
      ((event.clientY - box.top) / box.height) * 2 - 1,
    );
  };
  const leave = () => {
    pointerActive = false;
    target.set(0, 0);
  };
  const updateReveal = () => {
    // Mobile keeps the finished opening as it scrolls into view. Desktop
    // uncovers it from the side and finishes before it reaches the centre.
    let progress = 1;
    if (!reduced && innerWidth >= 768) {
      const box = element.getBoundingClientRect();
      progress = THREE.MathUtils.clamp(
        (innerHeight * 0.84 - box.top) / Math.min(innerHeight * 0.6, box.height * 0.85),
        0,
        1,
      );
    }
    paperUniforms.uProgress.value = progress * progress * (3 - 2 * progress);
    element.dataset.reveal = progress.toFixed(3);
    wake();
  };
  element.addEventListener("pointermove", move);
  element.addEventListener("pointerleave", leave);
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("scroll", updateReveal, { passive: true });
  window.addEventListener("resize", updateReveal);
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  updateReveal();
  // Start fully formed: the paper opening itself is the reveal.
  sculpture.update(0, true, true, pointer);
  sculpture.update(elapsed, true, true, pointer);
  void sculpture.assetsReady.then(() => {
    if (!disposed) {
      element.dataset.ready = "true";
      element.dataset.paperReveal = "true";
      wake();
    }
  });
  return {
    setVisible(value: boolean) {
      visible = value;
      visibility();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("scroll", updateReveal);
      window.removeEventListener("resize", updateReveal);
      sculpture.dispose();
      rocks.dispose();
      paperMaterial.dispose();
      paperGeometry.dispose();
      depthMaterial.dispose();
      depth.dispose();
      depthTexture.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      delete element.dataset.ready;
      delete element.dataset.cube;
      delete element.dataset.paperReveal;
      delete element.dataset.reveal;
    },
  };
}
