"use client";

import { useEffect, type RefObject } from "react";
import { smoothstep } from "@/components/rice/motion";

/** Separate response times give the copy, rules and product a little depth. */
const INTRO_LAYERS = [
  [".opening__claim", 12, 8, 3.6],
  [".opening__cta", 8, 5, 5],
  [".opening__rule", 5, 3, 2.8],
  [".opening__point:nth-child(1)", 8, 5, 3.2],
  [".opening__point:nth-child(2)", 10, 6, 4.2],
  [".opening__point:nth-child(3)", 12, 7, 5.2],
  [".opening__scene-parallax", 16, 10, 2.4],
  [".opening__atmosphere", -22, -14, 1.8],
  [".opening__route:not(.opening__route--destination)", 5, 3, 3],
  [".opening__instructions", 4, 2, 4.6],
  [".opening__route--destination", 7, 4, 3.8],
] as const;

const OVERVIEW_LAYERS = [
  [".opening__overview-heading", 6, 4, 3.2],
  [".opening__eyebrow", 4, 2, 4.1],
  // The low card trails the headline and counters the distant grain motifs.
  [".opening__product", 7, 6, 1.7],
  [".opening__note--delivery", 7, 4, 3],
  [".opening__still-life--near", -18, -12, 2.1],
  [".opening__still-life--far", -11, -8, 1.6],
] as const;

export function useHeroParallax(
  section: RefObject<HTMLElement | null>,
  viewport: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    const root = section.current;
    const frame = viewport.current;
    if (!root || !frame) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const layers = [
      ...INTRO_LAYERS.map((layer) => ({ layer, overview: false })),
      ...OVERVIEW_LAYERS.map((layer) => ({ layer, overview: true })),
    ].flatMap(({ layer: [selector, depthX, depthY, speed], overview }) => {
      const element = root.querySelector<HTMLElement>(selector);
      return element ? [{ element, depthX, depthY, speed, overview, x: 0, y: 0 }] : [];
    });
    let x = 0;
    let y = 0;
    let animation = 0;
    let last = 0;
    const enabled = () => !preference.matches && pointer.matches && !document.hidden;
    const draw = (time: number) => {
      animation = 0;
      const delta = Math.min((time - last) / 1000, 0.05);
      last = time;
      const range = Math.max(
        1,
        Math.min(frame.offsetHeight, root.offsetHeight - frame.offsetHeight),
      );
      const progress = Math.max(0, -root.getBoundingClientRect().top / range);
      let moving = false;
      for (const layer of layers) {
        const weight = enabled()
          ? layer.overview
            ? smoothstep((progress - 0.35) / 0.55)
            : 1 - smoothstep(progress / 0.55)
          : 0;
        const goalX = x * layer.depthX * weight;
        const goalY = y * layer.depthY * weight;
        const ease = enabled() ? 1 - Math.exp(-layer.speed * delta) : 1;
        layer.x += (goalX - layer.x) * ease;
        layer.y += (goalY - layer.y) * ease;
        if (Math.abs(goalX - layer.x) + Math.abs(goalY - layer.y) < 0.01) {
          layer.x = goalX;
          layer.y = goalY;
        } else moving = true;
        // Individual translate composes with both the entrance and scroll transforms.
        layer.element.style.translate = `${layer.x.toFixed(3)}px ${layer.y.toFixed(3)}px`;
      }
      if (moving) animation = requestAnimationFrame(draw);
    };
    const wake = () => {
      if (!animation) {
        last = performance.now();
        animation = requestAnimationFrame(draw);
      }
    };
    const move = (event: PointerEvent) => {
      if (!enabled() || event.pointerType !== "mouse") return;
      const rect = frame.getBoundingClientRect();
      x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
      y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
      wake();
    };
    const reset = () => {
      x = y = 0;
      wake();
    };
    root.addEventListener("pointermove", move, { passive: true, capture: true });
    root.addEventListener("pointerleave", reset);
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("blur", reset);
    window.addEventListener("resize", reset);
    document.addEventListener("visibilitychange", reset);
    preference.addEventListener("change", reset);
    pointer.addEventListener("change", reset);
    return () => {
      cancelAnimationFrame(animation);
      root.removeEventListener("pointermove", move, true);
      root.removeEventListener("pointerleave", reset);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("blur", reset);
      window.removeEventListener("resize", reset);
      document.removeEventListener("visibilitychange", reset);
      preference.removeEventListener("change", reset);
      pointer.removeEventListener("change", reset);
      for (const { element } of layers) element.style.removeProperty("translate");
    };
  }, [section, viewport]);
}
