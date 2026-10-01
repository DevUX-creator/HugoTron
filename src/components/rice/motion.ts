/** Deterministic initial arrangement; each toss has its own repeatable seed. */
export function seededRandom(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export const TOSS_DURATION = 3.6;
export const SETTLE_DURATION = 0.42;
export const BRUSH_VIEW_START = 0.92;
export const ENTRANCE_DELAY = 0.45;
export const ENTRANCE_DURATION = 2.1;

/** One arrival clock drives a gentle camera approach and a small settling sway. */
export function riceEntrance(progress: number) {
  const p = Math.min(1, Math.max(0, progress));
  const travel = p * p * p * (p * (p * 6 - 15) + 10);
  return {
    travel,
    remaining: 1 - travel,
    opacity: smoothstep(p / 0.65),
    sway:
      p === 0 || p === 1
        ? 0
        : Math.sin(p * Math.PI * 2) * Math.sin(p * Math.PI) * Math.exp(-p * 1.8),
  };
}

/** A short curved climb: pull back early, then move closer as the camera reaches overhead. */
export function riceTransition(progress: number, reduced = false, compact = false) {
  const clamped = Math.min(1, Math.max(0, progress));
  const p = reduced ? (clamped < 0.5 ? 0 : 1) : clamped;
  const arc = p > 0 && p < 0.9 ? Math.sin((p / 0.9) * Math.PI) ** 2 : 0;
  const scale = compact ? 0.7 : 1;
  const elevation = Math.atan2(2.55, Math.hypot(0.2, 7.8));
  const orbit = smoothstep(p / 0.34) * (1 - smoothstep((p - 0.34) / 0.52));
  const rise = smoothstep((p - 0.18) / (BRUSH_VIEW_START - 0.18));
  const pullback = smoothstep(p / 0.3) * (1 - smoothstep((p - 0.3) / 0.6));
  const initialAzimuth = Math.atan2(0.2, 7.8);
  return {
    progress: p,
    rise,
    elevation: elevation + (Math.PI / 2 - elevation) * rise,
    azimuth: initialAzimuth * (1 - rise) - 0.55 * orbit * (compact ? 0.85 : 1),
    // Pull back before approaching the final overhead framing.
    framing: 1 + pullback * (compact ? 0.14 : 0.2),
    targetY: 1.25 - 0.45 * rise + 0.04 * arc,
    bowlBank: 0.06 * arc * scale,
    bowlPitch: -0.035 * arc * scale,
    bowlLift: 0.11 * arc * scale,
  };
}

export interface RiceBrushState {
  velocityU: number;
  velocityV: number;
  yaw: number;
  spin: number;
  lift: number;
}

export interface BrushStroke {
  fromX: number;
  fromZ: number;
  toX: number;
  toZ: number;
}

/** A fingertip sweeps a capsule through the surface, parting rice to either side. */
export function brushRice(
  state: RiceBrushState,
  anchor: { x: number; y: number },
  stroke: BrushStroke,
  mobility: number,
  strength = 1,
) {
  const dx = stroke.toX - stroke.fromX;
  const dz = stroke.toZ - stroke.fromZ;
  const length = Math.hypot(dx, dz);
  if (length < 0.001 || mobility === 0) return false;
  const point = bowlOutline(Math.atan2(anchor.y, anchor.x), Math.hypot(anchor.x, anchor.y));
  const along = Math.min(
    1,
    Math.max(
      0,
      ((point.x - stroke.fromX) * dx + (point.z - stroke.fromZ) * dz) / (length * length),
    ),
  );
  const offsetX = point.x - (stroke.fromX + dx * along);
  const offsetZ = point.z - (stroke.fromZ + dz * along);
  const distance = Math.hypot(offsetX, offsetZ);
  const radius = 0.28;
  if (distance >= radius) return false;
  const directionX = dx / length;
  const directionZ = dz / length;
  const side = directionX * offsetZ - directionZ * offsetX >= 0 ? 1 : -1;
  const influence = (1 - distance / radius) ** 1.4;
  // Stroke length, rather than event frequency, determines how much rice moves.
  const impulse = Math.min(length, 0.22) * influence * mobility * strength * 13;
  state.velocityU += ((directionX * 0.4 - directionZ * side * 0.85) * impulse) / 2.4;
  state.velocityV += ((directionZ * 0.4 + directionX * side * 0.85) * impulse) / 1.25;
  const speed = Math.hypot(state.velocityU * 2.4, state.velocityV * 1.25);
  if (speed > 2.2) {
    state.velocityU *= 2.2 / speed;
    state.velocityV *= 2.2 / speed;
  }
  state.spin = Math.max(-4, Math.min(4, state.spin + side * impulse * 2.1));
  state.lift = Math.min(0.032 * strength, state.lift + impulse * 0.018);
  return true;
}

/** Dry friction leaves a new resting arrangement instead of springing rice home. */
export function stepRiceBrush(
  state: RiceBrushState,
  anchor: { x: number; y: number },
  delta: number,
) {
  if (state.velocityU === 0 && state.velocityV === 0 && state.spin === 0 && state.lift === 0)
    return false;
  const dt = Math.min(Math.max(delta, 0), 0.25);
  const damping = Math.exp(-8.5 * dt);
  const travel = (1 - damping) / 8.5;
  anchor.x += state.velocityU * travel;
  anchor.y += state.velocityV * travel;
  state.velocityU *= damping;
  state.velocityV *= damping;
  const radius = Math.hypot(anchor.x, anchor.y);
  if (radius > 0.855) {
    anchor.x *= 0.855 / radius;
    anchor.y *= 0.855 / radius;
    const outward = (state.velocityU * anchor.x + state.velocityV * anchor.y) / (0.855 * 0.855);
    if (outward > 0) {
      state.velocityU -= outward * anchor.x;
      state.velocityV -= outward * anchor.y;
    }
  }
  const spinDamping = Math.exp(-10 * dt);
  state.yaw += (state.spin * (1 - spinDamping)) / 10;
  state.spin *= spinDamping;
  state.lift *= Math.exp(-12 * dt);
  if (Math.abs(state.velocityU) + Math.abs(state.velocityV) < 0.0001)
    state.velocityU = state.velocityV = 0;
  if (Math.abs(state.spin) < 0.001) state.spin = 0;
  if (state.lift < 0.0001) state.lift = 0;
  return true;
}

export function flightDuration(height: number) {
  return Math.sqrt((8 * height) / 3.15);
}

/** Forward drift slows in the air; it never reverses at the top of the arc. */
export function flightTravel(progress: number) {
  const u = Math.min(1, Math.max(0, progress));
  return (1 - Math.exp(-1.2 * u)) / (1 - Math.exp(-1.2));
}

export function smoothstep(value: number) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

interface SpringState {
  value: number;
  velocity: number;
}

/** Exact critically damped response: momentum without oscillation or frame-rate dependence. */
export function stepCameraSpring(state: SpringState, target: number, delta: number, frequency = 5) {
  const dt = Math.min(0.25, Math.max(0, delta));
  const offset = state.value - target;
  const impulse = state.velocity + frequency * offset;
  const decay = Math.exp(-frequency * dt);
  state.value = target + (offset + impulse * dt) * decay;
  state.velocity = (state.velocity - frequency * impulse * dt) * decay;
  if (Math.abs(target - state.value) < 0.0001 && Math.abs(state.velocity) < 0.0001) {
    state.value = target;
    state.velocity = 0;
  }
  return state.value !== target || state.velocity !== 0;
}

/** Fixed substeps preserve the same weight and damping at different frame rates. */
export function stepSpring(state: SpringState, target: number, delta: number) {
  const steps = Math.max(1, Math.ceil(delta * 120));
  const dt = delta / steps;
  for (let i = 0; i < steps; i++) {
    state.velocity += ((target - state.value) * 34 - state.velocity * 10.5) * dt;
    state.value += state.velocity * dt;
  }
  if (Math.abs(target - state.value) < 0.00001 && Math.abs(state.velocity) < 0.00005) {
    state.value = target;
    state.velocity = 0;
  }
}

/** Kernel centers stay inside the rim, including room for the rounded tips. */
export function constrainRice(u: number, v: number) {
  const radius = Math.hypot(u, v);
  const scale = radius > 0.865 ? 0.865 / radius : 1;
  return { u: u * scale, v: v * scale };
}

/** Constant downward acceleration, followed by a small damped landing. */
export function grainFlight(time: number, height: number, delay: number) {
  if (height === 0 || time <= delay || time >= TOSS_DURATION) return 0;
  const duration = flightDuration(height);
  const elapsed = time - delay;
  if (elapsed < duration) {
    const u = elapsed / duration;
    return 4 * height * u * (1 - u);
  }
  const landing = elapsed - duration;
  if (landing >= 0.35) return 0;
  return (
    Math.sin((landing / 0.35) * Math.PI) * Math.exp(-landing * 9) * Math.min(height * 0.12, 0.018)
  );
}

export function bowlLift(time: number) {
  if (time < 0 || time >= 0.85) return 0;
  if (time < 0.16) return -0.025 * Math.sin((time / 0.16) * Math.PI);
  if (time < 0.47) return 0.12 * Math.sin(((time - 0.16) / 0.31) * Math.PI);
  return -0.015 * Math.sin(((time - 0.47) / 0.38) * Math.PI);
}

/** A pointed left end and a generous rounded right end, like the reference. */
export function bowlOutline(angle: number, radius = 1) {
  return {
    x: radius * (2.4 * Math.cos(angle) + 0.16 * Math.cos(2 * angle)),
    z: radius * 1.58 * Math.sin(angle) * (0.75 + 0.34 * Math.cos(angle)),
  };
}

export function riceSurface(radius: number, angle: number) {
  const rimVariation = 0.24 * Math.cos(angle) - 0.21 * Math.sin(angle);
  return 1.08 + 0.61 * Math.pow(1 - radius * radius, 1.5) + rimVariation * radius * radius * 0.7;
}
