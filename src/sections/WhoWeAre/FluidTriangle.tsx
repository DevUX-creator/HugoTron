"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useScrollWake } from "@/components/providers/SmoothScroll";

type Point = { x: number; y: number };

const TAU = Math.PI * 2;
const VERTICES: Point[] = [
  { x: 60, y: 11 },
  { x: 98, y: 77 },
  { x: 22, y: 77 },
];

function inset(from: Point, toward: Point): Point {
  const scale = 9 / Math.hypot(toward.x - from.x, toward.y - from.y);
  return { x: from.x + (toward.x - from.x) * scale, y: from.y + (toward.y - from.y) * scale };
}

/* Sample a triangle with curved corners, retaining each point's outward
   normal so the wave can deform the whole perimeter. */
const CONTOUR = Array.from({ length: 48 }, (_, index) => {
  const position = (index / 48) * 3;
  const side = Math.floor(position);
  const along = position - side;
  const a = VERTICES[side];
  const b = VERTICES[(side + 1) % 3];
  const c = VERTICES[(side + 2) % 3];
  const start = inset(a, b);
  const end = inset(b, a);
  const turn = inset(b, c);
  let point: Point;
  let tangent: Point;

  if (along < 0.8) {
    const t = along / 0.8;
    point = { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
    tangent = { x: end.x - start.x, y: end.y - start.y };
  } else {
    const t = (along - 0.8) / 0.2;
    const rest = 1 - t;
    point = {
      x: rest * rest * end.x + 2 * rest * t * b.x + t * t * turn.x,
      y: rest * rest * end.y + 2 * rest * t * b.y + t * t * turn.y,
    };
    tangent = {
      x: rest * (b.x - end.x) + t * (turn.x - b.x),
      y: rest * (b.y - end.y) + t * (turn.y - b.y),
    };
  }

  const length = Math.hypot(tangent.x, tangent.y);
  return { ...point, nx: tangent.y / length, ny: -tangent.x / length, progress: index / 48 };
});

function fluidPath(phase: number, layer: number): string {
  const points = CONTOUR.map(({ x, y, nx, ny, progress }) => {
    const ripple =
      (layer - 1) * 1.6 +
      3.2 * Math.sin(progress * TAU * 3 - phase + layer * 0.9) +
      1.1 * Math.sin(progress * TAU * 5 + phase * 2 + layer * 0.7);
    return { x: x + nx * ripple, y: y + ny * ripple };
  });
  const coord = (value: number) => value.toFixed(2);
  let path = `M${coord(points[0].x)} ${coord(points[0].y)}`;

  /* A closed cubic spline gives every crest and the loop seam a smooth
     tangent, including where a ripple travels around a corner. */
  for (let i = 0; i < points.length; i++) {
    const before = points[(i + points.length - 1) % points.length];
    const from = points[i];
    const to = points[(i + 1) % points.length];
    const after = points[(i + 2) % points.length];
    path += `C${coord(from.x + (to.x - before.x) / 6)} ${coord(from.y + (to.y - before.y) / 6)} ${coord(to.x - (after.x - from.x) / 6)} ${coord(to.y - (after.y - from.y) / 6)} ${coord(to.x)} ${coord(to.y)}`;
  }

  return `${path}Z`;
}

const STILL_PATHS = [0, 1, 2].map((layer) => fluidPath(0, layer));

export default function FluidTriangle() {
  const ref = useRef<SVGSVGElement>(null);
  const reduced = useReducedMotion();
  const wakeScroll = useScrollWake();

  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const paths = [...svg.querySelectorAll("path")];
    paths.forEach((path, index) => path.setAttribute("d", STILL_PATHS[index]));
    if (reduced) return;

    let cancelled = false;
    let visible = false;
    let tween: gsap.core.Tween | undefined;

    const sync = () => {
      if (visible && !document.hidden) {
        tween?.play();
        wakeScroll();
      } else {
        tween?.pause();
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(svg);
    document.addEventListener("visibilitychange", sync);

    void import("@/lib/gsap").then(({ gsap }) => {
      if (cancelled) return;
      const motion = { phase: 0 };
      tween = gsap.to(motion, {
        phase: TAU,
        duration: 8,
        repeat: -1,
        ease: "none",
        paused: true,
        onUpdate: () => {
          paths.forEach((path, layer) => path.setAttribute("d", fluidPath(motion.phase, layer)));
        },
      });
      sync();
    });

    return () => {
      cancelled = true;
      tween?.kill();
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [reduced, wakeScroll]);

  return (
    <svg ref={ref} className="who-fluid" viewBox="0 0 120 90" focusable="false">
      {STILL_PATHS.map((path, index) => (
        <path key={index} className={`who-fluid__contour who-fluid__contour--${index}`} d={path} />
      ))}
    </svg>
  );
}
