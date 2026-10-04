import { DELIVERY_MAP } from "@/content/deliveryMap";
import { DELIVERY_VAN_OUTLINE } from "./DeliveryVan";
import type { MapPoint } from "./roadJourney";

type Region = (typeof DELIVERY_MAP.regions)[number]["id"];
type View = MapPoint & { scale: number };
type EnergyFrame = {
  view: View;
  car: MapPoint;
  heading: number;
  region: Region;
  moving: boolean;
  reduced: boolean;
};
type Ring = { age: number; life: number; reach: number; strength: number };

/** Lit level of the van's state: full while driving, a quiet still glow once parked. */
const DRIVING = 1;
const PARKED = 0.45;
/** Sonar rings from the van while it drives, in seconds and screen pixels. */
const RING_EVERY = 1.5;
const RING_LIFE = 1.7;
const RING_REACH = 150;
/** Crossing into a new state: one wider ring and a brighter outline that settles. */
const ARRIVAL_LIFE = 1.4;
const ARRIVAL_REACH = 280;

/**
 * Highlights the state the van is in, sharing the vehicle's demand-driven RAF: a radial glow
 * and a soft outline that breathe while driving, sonar rings from the van clipped to the
 * state's shape (so each pulse reveals the region), and a stronger pulse on crossing a border.
 * Parked, the state keeps a still glow and the loop may sleep; the canvas holds that frame.
 */
export function createRegionEnergy(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  const regions = DELIVERY_MAP.regions.map((region) => {
    const path = canvas.parentElement!.querySelector<SVGPathElement>(
      `[data-region="${region.id}"]`,
    )!;
    return {
      id: region.id,
      outline: new Path2D(region.outline),
      bounds: path.getBBox(),
      opacity: 0,
    };
  });
  const vehicleOutline = new Path2D(DELIVERY_VAN_OUTLINE);
  const rings: Ring[] = [];
  let width = 1,
    height = 1,
    phase = 0,
    sinceRing = RING_EVERY,
    arrival = 0,
    lastRegion: Region | undefined;

  function clear() {
    context?.clearRect(0, 0, width, height);
    for (const region of regions) region.opacity = 0;
    rings.length = 0;
    phase = 0;
    arrival = 0;
    sinceRing = RING_EVERY;
    lastRegion = undefined;
    canvas.dataset.paths = "0";
    canvas.dataset.rings = "0";
    delete canvas.dataset.region;
  }

  function draw({ view, car, heading, region: current }: EnergyFrame, breath: number) {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    context.save();
    context.translate(width / 2, height / 2);
    context.scale(view.scale, view.scale);
    context.translate(-view.x, -view.y);
    const px = 1 / view.scale;
    for (const region of regions) {
      if (!region.opacity) continue;
      const { x, y, width: w, height: h } = region.bounds;
      const lift = region.id === current ? arrival : 0;
      // The glow's centre and falloff belong to the state, never to the moving van.
      const cx = x + w * 0.48,
        cy = y + h * 0.42;
      const glow = context.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(w, h) * 0.65);
      glow.addColorStop(0, `rgb(47 123 255 / ${0.05 + breath * 0.04 + lift * 0.06})`);
      glow.addColorStop(0.6, `rgb(47 123 255 / ${0.025 + breath * 0.02 + lift * 0.03})`);
      glow.addColorStop(1, "rgb(47 123 255 / 0)");
      context.globalAlpha = region.opacity;
      context.fillStyle = glow;
      context.fill(region.outline, "evenodd");
      // A wide, faint stroke under a fine bright one reads as a glowing edge without a filter.
      context.lineJoin = "round";
      context.strokeStyle = `rgb(95 161 255 / ${0.07 + breath * 0.06 + lift * 0.12})`;
      context.lineWidth = (5 + lift * 4) * px;
      context.stroke(region.outline);
      context.strokeStyle = `rgb(150 198 255 / ${0.3 + breath * 0.25 + lift * 0.35})`;
      context.lineWidth = (1 + lift * 0.6) * px;
      context.stroke(region.outline);
    }
    const lit = regions.find((region) => region.id === current);
    if (rings.length && lit?.opacity) {
      // Rings travel only inside the van's state, so each one sweeps across its shape.
      context.save();
      context.clip(lit.outline, "evenodd");
      context.globalAlpha = lit.opacity;
      for (const ring of rings) {
        const t = ring.age / ring.life;
        const fade = (1 - t) * (1 - t) * ring.strength;
        const radius = (8 + (ring.reach - 8) * (1 - (1 - t) ** 3)) * px;
        const disc = context.createRadialGradient(car.x, car.y, 0, car.x, car.y, radius);
        disc.addColorStop(0, "rgb(47 123 255 / 0)");
        disc.addColorStop(0.75, `rgb(47 123 255 / ${0.05 * fade})`);
        disc.addColorStop(1, `rgb(95 161 255 / ${0.18 * fade})`);
        context.fillStyle = disc;
        context.beginPath();
        context.arc(car.x, car.y, radius, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = `rgb(160 205 255 / ${0.7 * fade})`;
        context.lineWidth = 1.25 * px;
        context.stroke();
      }
      context.restore();
    }
    // Surface light stays beneath the actual vehicle silhouette.
    context.globalCompositeOperation = "destination-out";
    context.globalAlpha = 1;
    context.translate(car.x, car.y);
    context.rotate((heading * Math.PI) / 180);
    context.scale(1.8 * px, 1.8 * px);
    context.fillStyle = "black";
    context.strokeStyle = "black";
    context.lineWidth = 1.5;
    context.fill(vehicleOutline);
    context.stroke(vehicleOutline);
    context.restore();
  }

  return {
    resize(w: number, h: number) {
      width = w;
      height = h;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context?.setTransform(ratio, 0, 0, ratio, 0, 0);
    },
    /** Draws one frame; returns whether it needs another (false lets the map loop sleep). */
    update(dt: number, frame: EnergyFrame) {
      if (!context) return false;
      canvas.dataset.region = frame.region;
      if (frame.reduced) {
        // Still highlight, no pulse: the state is marked without any motion.
        rings.length = 0;
        arrival = 0;
        for (const region of regions) region.opacity = region.id === frame.region ? PARKED : 0;
        canvas.dataset.paths = "1";
        canvas.dataset.rings = "0";
        draw(frame, 0);
        return false;
      }
      if (lastRegion !== undefined && frame.region !== lastRegion) {
        arrival = 1;
        rings.push({ age: 0, life: ARRIVAL_LIFE, reach: ARRIVAL_REACH, strength: 1.3 });
      }
      lastRegion = frame.region;
      arrival = Math.max(0, arrival - dt / ARRIVAL_LIFE);
      phase = frame.moving ? (phase + dt / 3.6) % 1 : phase;
      sinceRing += dt;
      if (frame.moving && sinceRing >= RING_EVERY) {
        sinceRing = 0;
        rings.push({ age: 0, life: RING_LIFE, reach: RING_REACH, strength: 1 });
      }
      for (const ring of rings) ring.age += dt;
      for (let i = rings.length - 1; i >= 0; i--)
        if (rings[i]!.age >= rings[i]!.life) rings.splice(i, 1);

      let visible = 0,
        settling = false;
      const ease = 1 - Math.exp(-dt * 5);
      for (const region of regions) {
        const target = region.id === frame.region ? (frame.moving ? DRIVING : PARKED) : 0;
        region.opacity += (target - region.opacity) * ease;
        if (Math.abs(target - region.opacity) < 0.003) region.opacity = target;
        else settling = true;
        if (region.opacity) visible++;
      }
      canvas.dataset.paths = String(visible);
      canvas.dataset.rings = String(rings.length);
      // Breathing only while driving; parked, the glow holds still.
      const breath = frame.moving ? (1 - Math.cos(phase * Math.PI * 2)) / 2 : 0;
      draw(frame, breath);
      return frame.moving || settling || arrival > 0 || rings.length > 0;
    },
    clear,
    dispose() {
      clear();
      regions.length = 0;
      canvas.width = canvas.height = 1;
    },
  };
}
