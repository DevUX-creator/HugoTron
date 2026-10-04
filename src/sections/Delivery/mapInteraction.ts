import { DELIVERY_MAP } from "@/content/deliveryMap";
import {
  createRoadRouter,
  distance,
  measureRoute,
  softenRoute,
  type MapPoint,
} from "./roadJourney";
import { driveVelocity } from "./drivePhysics";
import { createRegionEnergy } from "./regionEnergy";
import { createDeliveryRun, DELIVERY_STOPS, formatRunTime, type RunSnapshot } from "./deliveryRun";

export type JourneyState = "ready" | "driving" | "arrived" | "outside";
export type DeliveryRegion = (typeof DELIVERY_MAP.regions)[number]["id"];
export type MapController = {
  zoom: (factor: number) => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
  dispose: () => void;
};
type Direction = "up" | "down" | "left" | "right";
type View = { x: number; y: number; scale: number };
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const ORIGIN: MapPoint = { x: DELIVERY_MAP.hamburg[0], y: DELIVERY_MAP.hamburg[1] };
const TIP_STORAGE_KEY = "hugo.delivery.controls.v1";
const DIRECTIONS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

/** Owns one demand-driven frame loop for the camera and van; no React updates per frame. */
export function createMapInteraction(
  root: HTMLElement,
  onState: (state: JourneyState) => void,
  onRegion: (id: DeliveryRegion) => void,
  onRun: (run: RunSnapshot) => void,
): MapController {
  const svg = root.querySelector<SVGSVGElement>(".delivery-map__canvas")!;
  const regionEnergy = createRegionEnergy(
    root.querySelector<HTMLCanvasElement>(".delivery-map__region-energy")!,
  );
  const country = root.querySelector<SVGPathElement>(".delivery-map__germany")!;
  const van = root.querySelector<SVGGElement>(".delivery-van")!;
  const targetMarker = root.querySelector<SVGGElement>(".delivery-map__destination")!;
  const aim = root.querySelector<SVGGElement>(".delivery-map__aim")!;
  const originLabel = root.querySelector<SVGGElement>(".delivery-map__origin-label")!;
  const originMark = root.querySelector<SVGGElement>(".delivery-map__origin-mark")!;
  const tip = root.querySelector<HTMLElement>(".delivery-map__tip")!;
  const dismissTipButton = root.querySelector<HTMLButtonElement>(".delivery-map__tip-dismiss")!;
  const thrust = root.querySelector<SVGGElement>(".delivery-van__thrust")!;
  const nextStop = root.querySelector<SVGGElement>(".delivery-map__next")!;
  const nextArrow = nextStop.querySelector<SVGPathElement>("path")!;
  const nextNumber = nextStop.querySelector<SVGTextElement>("text")!;
  const clock = root.querySelector<HTMLOutputElement>("[data-run-time]")!;
  const checkpoints = [...root.querySelectorAll<SVGGElement>("[data-stop]")];
  const run = createDeliveryRun();
  let clockTimer: ReturnType<typeof setTimeout> | undefined;
  const roadLight = root.querySelector<SVGRadialGradientElement>("#delivery-road-light")!;
  const needle = root.querySelector<SVGGElement>(".delivery-compass__needle")!;
  const heading = root.querySelector<SVGTextElement>(".delivery-compass__heading")!;
  const degrees = root.querySelector<SVGTextElement>(".delivery-compass__degrees")!;
  let driveSpeed = 1;
  let motionSpeed = 0;
  const regions = [...root.querySelectorAll<SVGPathElement>("[data-region]")].map((path) => ({
    path,
    id: path.dataset.region as DeliveryRegion,
    bounds: path.getBBox(),
  }));
  const pads = [...root.querySelectorAll<HTMLButtonElement>("[data-drive]")];
  const inputs = new Map<string, Direction>();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const router = createRoadRouter();
  let size = { width: 1, height: 1 };
  let view: View = { x: 500, y: 400, scale: 1 };
  let target = { ...view };
  let car = { ...ORIGIN },
    angle = 180;
  let frame = 0,
    previous = 0,
    disposed = false,
    frames = 0;
  let motion: {
    route: ReturnType<typeof measureRoute>;
    elapsed: number;
    duration: number;
  } | null = null;
  let currentRegion: DeliveryRegion = "DE-HH";
  let checkedAt = { ...ORIGIN };
  let travel = { x: 0, y: 0 };
  let follow = false;
  let velocity = { x: 0, y: 0 };
  const pointers = new Map<number, MapPoint>();
  let dragged = false,
    down = { x: 0, y: 0 },
    lastMove = 0;
  const abort = new AbortController();
  const signal = abort.signal;

  function baseScale() {
    return size.width < 768 ? size.width / 390 : size.height / 500;
  }
  function followView(point: MapPoint, scale = target.scale): View {
    const small = (size.width < 1024 && size.height > size.width) || size.width < 768;
    return {
      x: point.x + ((0.5 - (small ? 0.53 : 0.6)) * size.width) / scale,
      y:
        point.y + ((0.5 - (small ? Math.max(0.3, 238 / size.height) : 0.32)) * size.height) / scale,
      scale,
    };
  }
  function startingView(): View {
    return followView(ORIGIN, baseScale() * 4.5);
  }
  function constrain(v: View): View {
    const base = baseScale();
    return {
      x: clamp(v.x, 340, 825),
      y: clamp(v.y, 190, 815),
      scale: clamp(v.scale, base * 0.55, base * 8),
    };
  }
  function world(client: MapPoint, at = view): MapPoint {
    const bounds = svg.getBoundingClientRect();
    return {
      x: at.x + (client.x - bounds.left - size.width / 2) / at.scale,
      y: at.y + (client.y - bounds.top - size.height / 2) / at.scale,
    };
  }
  function drawView() {
    const w = size.width / view.scale,
      h = size.height / view.scale;
    svg.setAttribute("viewBox", `${view.x - w / 2} ${view.y - h / 2} ${w} ${h}`);
    aim.setAttribute("transform", `translate(${view.x} ${view.y}) scale(${1 / view.scale})`);
    originLabel.setAttribute("transform", `scale(${1 / view.scale})`);
    originMark.setAttribute("transform", `scale(${1 / view.scale})`);
    root.dataset.zoom = (view.scale / baseScale()).toFixed(3);
    for (let i = 0; i < checkpoints.length; i++) {
      const stop = DELIVERY_STOPS[i]!;
      checkpoints[i]!.setAttribute(
        "transform",
        `translate(${stop.x} ${stop.y}) scale(${1 / view.scale})`,
      );
    }
  }
  function drawVan() {
    roadLight.setAttribute("cx", String(car.x));
    roadLight.setAttribute("cy", String(car.y));
    roadLight.setAttribute("r", String(130 / view.scale));
    for (let i = 0; i < checkpoints.length; i++) {
      const nearby = distance(DELIVERY_STOPS[i]!, car) * view.scale < 150;
      const value = String(nearby);
      if (checkpoints[i]!.dataset.near !== value) checkpoints[i]!.dataset.near = value;
    }
    const bearing = ((angle % 360) + 360) % 360;
    needle.setAttribute("transform", `rotate(${bearing} 60 60)`);
    heading.textContent = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
      Math.round(bearing / 45) % 8
    ]!;
    degrees.textContent = `${String(Math.round(bearing) % 360).padStart(3, "0")}°`;
    root.dataset.heading = bearing.toFixed(1);
    van.setAttribute(
      "transform",
      `translate(${car.x} ${car.y}) rotate(${angle}) scale(${1.8 / view.scale})`,
    );
    root.dataset.carX = car.x.toFixed(3);
    root.dataset.carY = car.y.toFixed(3);
    root.dataset.velocity = motionSpeed.toFixed(2);
    const power = clamp(motionSpeed / (185 * driveSpeed), 0, 1);
    thrust.setAttribute("opacity", String(power * 0.9));
    thrust.setAttribute("transform", `translate(0 14) scale(1 ${0.35 + power * 0.65})`);
    const destination = DELIVERY_STOPS.filter((stop) => !run.has(stop.id)).sort(
      (a, b) => distance(a, car) - distance(b, car),
    )[0];
    nextStop.style.opacity = destination ? "0.7" : "0";
    if (destination) {
      const a = Math.atan2(destination.y - car.y, destination.x - car.x);
      const offset = 64 / view.scale;
      nextStop.setAttribute(
        "transform",
        `translate(${car.x + Math.cos(a) * offset} ${car.y + Math.sin(a) * offset}) scale(${1 / view.scale})`,
      );
      nextArrow.setAttribute("transform", `rotate(${(a * 180) / Math.PI + 90})`);
      nextNumber.textContent = destination.id;
    }
  }
  function setState(state: JourneyState) {
    if (root.dataset.journey === state) return;
    root.dataset.journey = state;
    onState(state);
    if (state === "driving") {
      dismissTip();
      if (run.snapshot(performance.now()).phase === "ready") {
        run.start(performance.now());
        publishRun();
      }
      tickClock();
    }
  }
  function highlightRegion(force = false) {
    if (!force && distance(checkedAt, car) < 1) return;
    checkedAt = { ...car };
    const point = new DOMPoint(car.x, car.y);
    const found = regions.find(
      ({ path, bounds: b }) =>
        car.x >= b.x &&
        car.x <= b.x + b.width &&
        car.y >= b.y &&
        car.y <= b.y + b.height &&
        path.isPointInFill(point),
    );
    if (!found || found.id === currentRegion) return;
    currentRegion = found.id;
    root.dataset.region = currentRegion;
    for (const region of regions) region.path.dataset.active = String(region === found);
    onRegion(currentRegion);
  }
  function tickClock() {
    clearTimeout(clockTimer);
    const state = run.snapshot(performance.now());
    clock.textContent = formatRunTime(state.elapsed);
    root.dataset.elapsed = state.elapsed.toFixed(0);
    if (!disposed && !document.hidden && state.phase === "running")
      clockTimer = setTimeout(tickClock, 100);
  }
  function publishRun() {
    const state = run.snapshot(performance.now());
    root.dataset.run = state.phase;
    root.dataset.collected = String(state.collected);
    onRun(state);
    tickClock();
  }
  function collect(from: MapPoint) {
    if (run.advance(from, car, Math.max(3.5, 23 / view.scale), performance.now()).length) {
      for (const checkpoint of checkpoints)
        checkpoint.dataset.collected = String(run.has(checkpoint.dataset.stop!));
      publishRun();
    }
  }
  function dismissTip() {
    if (tip.hidden) return;
    tip.hidden = true;
    try {
      localStorage.setItem(TIP_STORAGE_KEY, "seen");
    } catch {
      /* Storage can be disabled. */
    }
    if (document.activeElement === dismissTipButton) svg.focus({ preventScroll: true });
  }
  function steer(source: string, direction?: Direction) {
    if (direction) {
      if (!inputs.size && !travel.x && !travel.y) {
        // A quick tap still nudges the van, even if keyup arrives before the first frame.
        const impulse = 28 / view.scale;
        travel = {
          x: direction === "left" ? -impulse : direction === "right" ? impulse : 0,
          y: direction === "up" ? -impulse : direction === "down" ? impulse : 0,
        };
      }
      inputs.set(source, direction);
      motion = null;
      targetMarker.style.opacity = "0";
      velocity = { x: 0, y: 0 };
      follow = true;
      setState("driving");
      if (reduce.matches) freeDrive(1 / 60);
    } else inputs.delete(source);
    for (const pad of pads)
      pad.dataset.pressed = String([...inputs.values()].includes(pad.dataset.drive as Direction));
    wake();
  }
  function releaseControls() {
    inputs.clear();
    travel = { x: 0, y: 0 };
    velocity = { x: 0, y: 0 };
    for (const pad of pads) pad.dataset.pressed = "false";
    if (!motion && root.dataset.journey === "driving") setState("arrived");
  }
  function releasePointers() {
    for (const id of pointers.keys()) if (svg.hasPointerCapture(id)) svg.releasePointerCapture(id);
    pointers.clear();
    root.dataset.dragging = "false";
  }
  function turnTowards(point: MapPoint, dt: number) {
    if (distance(car, point) < 0.0001) return;
    const wanted = (Math.atan2(point.x - car.x, -(point.y - car.y)) * 180) / Math.PI;
    const turn = ((wanted - (angle % 360) + 540) % 360) - 180;
    angle += turn * (reduce.matches ? 1 : 1 - Math.exp(-dt * 16));
  }
  function freeDrive(dt: number) {
    const held = new Set(inputs.values());
    const dx = Number(held.has("right")) - Number(held.has("left"));
    const dy = Number(held.has("down")) - Number(held.has("up"));
    const physics = driveVelocity(
      travel,
      angle,
      { x: dx, y: dy },
      dt,
      (185 * driveSpeed) / view.scale,
      reduce.matches,
    );
    angle = physics.heading;
    travel = physics.velocity;
    if (Math.hypot(travel.x, travel.y) * view.scale < 0.5 && !inputs.size) {
      travel = { x: 0, y: 0 };
      if (!motion && root.dataset.journey === "driving") {
        highlightRegion(true);
        setState("arrived");
      }
      return;
    }
    const next = { x: car.x + travel.x * dt, y: car.y + travel.y * dt };
    const inside = (point: MapPoint) => country.isPointInFill(new DOMPoint(point.x, point.y));
    // Free steering, including diagonals; slide along the boundary instead of crossing it.
    if (!inside(next)) {
      if (inside({ x: next.x, y: car.y })) next.y = car.y;
      else if (inside({ x: car.x, y: next.y })) next.x = car.x;
      else {
        next.x = car.x;
        next.y = car.y;
      }
    }
    const before = car;
    car = next;
    collect(before);
    highlightRegion();
  }
  function drive(point: MapPoint) {
    if (!country.isPointInFill(new DOMPoint(point.x, point.y))) {
      if (!motion) setState("outside");
      return;
    }
    const route = measureRoute(softenRoute(router.route(car, point)));
    if (route.length < 0.5) return;
    releaseControls();
    follow = true;
    targetMarker.style.opacity = "1";
    const destination = route.points.at(-1)!;
    targetMarker.setAttribute("transform", `translate(${destination.x} ${destination.y})`);
    motion = { route, elapsed: 0, duration: clamp((route.length * view.scale) / 150, 1.3, 12) };
    root.dataset.destinationX = destination.x.toFixed(3);
    root.dataset.destinationY = destination.y.toFixed(3);
    setState("driving");
    wake();
  }
  function zoom(factor: number, anchor?: MapPoint) {
    follow = false;
    const bounds = svg.getBoundingClientRect();
    const cursor = anchor ?? { x: bounds.left + size.width / 2, y: bounds.top + size.height / 2 };
    const before = world(cursor, target);
    const scale = constrain({ ...target, scale: target.scale * factor }).scale;
    target = constrain({
      x: before.x - (cursor.x - bounds.left - size.width / 2) / scale,
      y: before.y - (cursor.y - bounds.top - size.height / 2) / scale,
      scale,
    });
    velocity = { x: 0, y: 0 };
    wake();
  }
  function render(now: number) {
    frame = 0;
    if (disposed || document.hidden) return;
    const dt = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    previous = now;
    if (!pointers.size && !reduce.matches && Math.hypot(velocity.x, velocity.y) > 0.5) {
      target = constrain({
        ...target,
        x: target.x - (velocity.x * dt) / view.scale,
        y: target.y - (velocity.y * dt) / view.scale,
      });
      const damping = Math.exp(-dt * 8);
      velocity.x *= damping;
      velocity.y *= damping;
    }
    if (motion) {
      motion.elapsed = reduce.matches
        ? motion.duration
        : Math.min(motion.duration, motion.elapsed + dt * driveSpeed);
      const progress = motion.elapsed / motion.duration;
      const eased = progress * progress * (3 - 2 * progress);
      const travelled = motion.route.length * eased;
      const sampled = motion.route.sample(travelled);
      const ahead = motion.route.sample(Math.min(motion.route.length, travelled + 2.5)).point;
      turnTowards(ahead, dt);
      const before = car;
      car = sampled.point;
      motionSpeed = dt ? (distance(before, car) * view.scale) / dt : 0;
      collect(before);
      highlightRegion(progress >= 1);
      if (progress >= 1) {
        motion = null;
        setState("arrived");
      }
    } else {
      if (inputs.size || travel.x || travel.y) freeDrive(dt);
      motionSpeed = Math.hypot(travel.x, travel.y) * view.scale;
    }
    if (follow && !pointers.size) {
      const wanted = followView(car);
      // A small dead zone lets the van move first; the map follows before it leaves clear space.
      const margin = size.width < 768 ? 28 : 64;
      const compact = size.width < 768 && size.height < 720;
      if (compact) wanted.y += 16 / target.scale;
      const verticalMargin = compact ? 0 : margin;
      const dx = (wanted.x - target.x) * target.scale;
      const dy = (wanted.y - target.y) * target.scale;
      if (Math.abs(dx) > margin) target.x = wanted.x - (Math.sign(dx) * margin) / target.scale;
      if (Math.abs(dy) > verticalMargin)
        target.y = wanted.y - (Math.sign(dy) * verticalMargin) / target.scale;
      target = constrain(target);
    }
    const ease = reduce.matches || pointers.size ? 1 : 1 - Math.exp(-dt * 10);
    view = {
      x: view.x + (target.x - view.x) * ease,
      y: view.y + (target.y - view.y) * ease,
      scale: view.scale + (target.scale - view.scale) * ease,
    };
    const unsettled =
      Math.abs(target.x - view.x) +
        Math.abs(target.y - view.y) +
        Math.abs(target.scale - view.scale) >
      0.001;
    if (!unsettled) view = { ...target };
    drawView();
    drawVan();
    const energyActive = regionEnergy.update(dt, {
      view,
      car,
      heading: angle,
      region: currentRegion,
      moving: motionSpeed > 8,
      reduced: reduce.matches,
    });
    root.dataset.frames = String(++frames);
    if (
      motion ||
      inputs.size ||
      travel.x ||
      travel.y ||
      energyActive ||
      unsettled ||
      (!pointers.size && Math.hypot(velocity.x, velocity.y) > 0.5)
    )
      wake();
    else previous = 0;
  }
  function wake() {
    if (!frame && !disposed && !document.hidden) frame = requestAnimationFrame(render);
  }
  function reset() {
    regionEnergy.clear();
    motion = null;
    releaseControls();
    follow = false;
    run.reset();
    publishRun();
    for (const checkpoint of checkpoints) checkpoint.dataset.collected = "false";
    motionSpeed = 0;
    car = { ...ORIGIN };
    angle = 180;
    currentRegion = "DE-HH";
    onRegion(currentRegion);
    checkedAt = { ...ORIGIN };
    root.dataset.region = currentRegion;
    for (const region of regions) region.path.dataset.active = String(region.id === currentRegion);
    targetMarker.style.opacity = "0";
    velocity = { x: 0, y: 0 };
    target = startingView();
    setState("ready");
    wake();
  }
  function resize() {
    const bounds = svg.getBoundingClientRect();
    const first = size.width === 1;
    const oldBase = startingView().scale;
    size = { width: bounds.width, height: bounds.height };
    if (!size.width || !size.height) return;
    regionEnergy.resize(size.width, size.height);
    if (first) view = target = startingView();
    else {
      view = constrain({ ...view, scale: (view.scale / oldBase) * startingView().scale });
      target = { ...view };
    }
    velocity = { x: 0, y: 0 };
    drawView();
    drawVan();
    root.dataset.ready = "true";
    wake();
  }
  function pointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    follow = false;
    const point = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, point);
    svg.setPointerCapture(event.pointerId);
    velocity = { x: 0, y: 0 };
    target = { ...view };
    if (pointers.size === 1) {
      dragged = false;
      down = point;
    } else dragged = true;
    lastMove = event.timeStamp;
    root.dataset.dragging = "true";
  }
  function pointerMove(event: PointerEvent) {
    const old = pointers.get(event.pointerId);
    if (!old) return;
    const current = { x: event.clientX, y: event.clientY };
    const before = [...pointers.values()];
    pointers.set(event.pointerId, current);
    if (pointers.size > 1) {
      const after = [...pointers.values()];
      const oldCentre = {
        x: (before[0]!.x + before[1]!.x) / 2,
        y: (before[0]!.y + before[1]!.y) / 2,
      };
      const newCentre = { x: (after[0]!.x + after[1]!.x) / 2, y: (after[0]!.y + after[1]!.y) / 2 };
      zoom(
        distance(after[0]!, after[1]!) / Math.max(1, distance(before[0]!, before[1]!)),
        oldCentre,
      );
      target = constrain({
        ...target,
        x: target.x - (newCentre.x - oldCentre.x) / target.scale,
        y: target.y - (newCentre.y - oldCentre.y) / target.scale,
      });
    } else {
      if (distance(current, down) > 6) dragged = true;
      if (dragged) {
        const dx = current.x - old.x,
          dy = current.y - old.y;
        target = constrain({
          ...target,
          x: target.x - dx / target.scale,
          y: target.y - dy / target.scale,
        });
        const dt = Math.max(8, event.timeStamp - lastMove) / 1000;
        velocity = { x: clamp(dx / dt, -1200, 1200), y: clamp(dy / dt, -1200, 1200) };
      }
    }
    lastMove = event.timeStamp;
    wake();
  }
  function pointerUp(event: PointerEvent) {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    if (event.type === "pointercancel") {
      dragged = true;
      velocity = { x: 0, y: 0 };
    }
    if (!pointers.size) {
      root.dataset.dragging = "false";
      if (!dragged) drive(world({ x: event.clientX, y: event.clientY }));
      if (event.timeStamp - lastMove > 100 || reduce.matches) velocity = { x: 0, y: 0 };
      wake();
    }
  }
  svg.addEventListener("pointerdown", pointerDown, { signal });
  svg.addEventListener("pointermove", pointerMove, { signal });
  svg.addEventListener("pointerup", pointerUp, { signal });
  svg.addEventListener("pointercancel", pointerUp, { signal });
  svg.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      const delta =
        event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? size.height : 1);
      zoom(Math.exp(-clamp(delta, -150, 150) * 0.003), { x: event.clientX, y: event.clientY });
    },
    { passive: false, signal },
  );
  // Page-level arrow controls work immediately, while menus, tabs and inputs retain their keys.
  window.addEventListener(
    "keydown",
    (event) => {
      const focused = event.target instanceof Element ? event.target : null;
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        focused?.closest(
          "input, textarea, select, a, [contenteditable], [role='tab'], [role='dialog']",
        ) ||
        (focused?.closest("button") && !root.contains(focused))
      )
        return;
      const direction = DIRECTIONS[event.key];
      if (direction) {
        event.preventDefault();
        if (!event.repeat) steer(`key:${event.key}`, direction);
      } else if (focused && svg.contains(focused)) {
        if (event.key === "Home") reset();
        else if (event.key === "+" || event.key === "=") zoom(1.25);
        else if (event.key === "-") zoom(0.8);
        else if (event.key === "Enter") drive(view);
        else if (event.key === "Escape") {
          motion = null;
          releaseControls();
          wake();
        } else return;
        event.preventDefault();
      }
    },
    { signal },
  );
  window.addEventListener(
    "keyup",
    (event) => {
      if (inputs.has(`key:${event.key}`)) {
        event.preventDefault();
        steer(`key:${event.key}`);
      }
    },
    { signal },
  );
  for (const pad of pads) {
    const direction = pad.dataset.drive as Direction;
    pad.addEventListener(
      "pointerdown",
      (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        pad.setPointerCapture(event.pointerId);
        steer(`pad:${event.pointerId}`, direction);
      },
      { signal },
    );
    const release = (event: PointerEvent) => {
      steer(`pad:${event.pointerId}`);
      if (pad.hasPointerCapture(event.pointerId)) pad.releasePointerCapture(event.pointerId);
    };
    pad.addEventListener("pointerup", release, { signal });
    pad.addEventListener("pointercancel", release, { signal });
    pad.addEventListener("lostpointercapture", release, { signal });
    pad.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        if (!event.repeat) steer(`button:${direction}`, direction);
      },
      { signal },
    );
    pad.addEventListener(
      "keyup",
      (event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        steer(`button:${direction}`);
      },
      { signal },
    );
    pad.addEventListener("blur", () => steer(`button:${direction}`), { signal });
    // Screen readers activate buttons with a synthesized click rather than a held pointer.
    pad.addEventListener(
      "click",
      (event) => {
        if (event.detail !== 0 || inputs.size) return;
        steer("assistive", direction);
        freeDrive(0.12);
        steer("assistive");
        if (reduce.matches) releaseControls();
        wake();
      },
      { signal },
    );
  }
  window.addEventListener(
    "blur",
    () => {
      releaseControls();
      releasePointers();
      wake();
    },
    { signal },
  );
  document.addEventListener(
    "visibilitychange",
    () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      root.dataset.paused = String(document.hidden);
      if (document.hidden) {
        regionEnergy.clear();
        run.pause(performance.now());
        clearTimeout(clockTimer);
        releaseControls();
        releasePointers();
      } else {
        run.resume(performance.now());
        tickClock();
        wake();
      }
    },
    { signal },
  );
  reduce.addEventListener(
    "change",
    () => {
      velocity = { x: 0, y: 0 };
      wake();
    },
    { signal },
  );
  dismissTipButton.addEventListener("click", dismissTip, { signal });
  try {
    tip.hidden = localStorage.getItem(TIP_STORAGE_KEY) === "seen";
  } catch {
    tip.hidden = false;
  }
  const observer = new ResizeObserver(resize);
  observer.observe(svg);
  resize();
  root.dataset.journey = "ready";
  root.dataset.region = currentRegion;
  root.dataset.speed = "1";
  publishRun();
  return {
    zoom,
    reset,
    setSpeed(value) {
      driveSpeed = clamp(value, 1, 2);
      root.dataset.speed = String(driveSpeed);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      abort.abort();
      pointers.clear();
      inputs.clear();
      clearTimeout(clockTimer);
      motion = null;
      regionEnergy.dispose();
    },
  };
}
