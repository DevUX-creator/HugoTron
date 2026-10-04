"use client";

import { useEffect, useId, type RefObject } from "react";

const SVG = "http://www.w3.org/2000/svg";
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Temporary title-only version of the pointer grid supplied as a shader archive (no longer kept).
 * SVG displacement applies the field to live DOM text, preserving its font, colors and semantics.
 */
export function useTitleDeformation(
  section: RefObject<HTMLElement | null>,
  viewport: RefObject<HTMLDivElement | null>,
) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  useEffect(() => {
    const root = section.current;
    const frame = viewport.current;
    if (!root || !frame) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const filters = document.createElementNS(SVG, "svg");
    filters.setAttribute("aria-hidden", "true");
    filters.setAttribute("width", "0");
    filters.setAttribute("height", "0");
    filters.style.position = "absolute";
    filters.style.pointerEvents = "none";
    const targets = Array.from(
      root.querySelectorAll<HTMLElement>(".opening__title, .opening__overview-heading h2"),
    ).map((element, index) => {
      const filter = document.createElementNS(SVG, "filter");
      filter.id = `title-flow-${id}-${index}`;
      filter.setAttribute("filterUnits", "userSpaceOnUse");
      filter.setAttribute("color-interpolation-filters", "sRGB");
      const map = document.createElementNS(SVG, "feImage");
      map.setAttribute("preserveAspectRatio", "none");
      map.setAttribute("result", "grid");
      const displacement = document.createElementNS(SVG, "feDisplacementMap");
      displacement.setAttribute("in", "SourceGraphic");
      displacement.setAttribute("in2", "grid");
      displacement.setAttribute("xChannelSelector", "R");
      displacement.setAttribute("yChannelSelector", "G");
      // The field is capped at ±0.6: at this scale, type moves by at most 3px.
      displacement.setAttribute("scale", "10");
      filter.append(map, displacement);
      filters.append(filter);
      const canvas = document.createElement("canvas");
      return {
        element,
        filter,
        map,
        canvas,
        context: canvas.getContext("2d")!,
        previousFilter: element.style.filter,
        pixels: new ImageData(1, 1),
        field: new Float32Array(2),
        width: 1,
        height: 1,
        padding: 12,
        radius: 100,
        x: -1,
        y: -1,
        vx: 0,
        vy: 0,
        energy: 0,
        dirty: false,
      };
    });
    frame.append(filters);
    let animation = 0;
    let last = 0;
    let disposed = false;
    const enabled = () => !disposed && !reduced.matches && fine.matches && !document.hidden;

    const reset = () => {
      cancelAnimationFrame(animation);
      animation = 0;
      for (const target of targets) {
        target.x = target.y = -1;
        target.vx = target.vy = target.energy = 0;
        target.dirty = false;
        target.field.fill(0);
        target.element.style.filter = target.previousFilter;
        target.element.dataset.titleFlow = "0";
      }
    };
    const resize = () => {
      if (disposed) return;
      reset();
      for (const target of targets) {
        if (!target.element.isConnected) continue;
        const bounds = target.element.getBoundingClientRect();
        const fontSize = parseFloat(getComputedStyle(target.element).fontSize) || 16;
        target.padding = Math.max(12, fontSize * 0.3);
        target.radius = clamp(fontSize * 0.85, 60, 140);
        target.width = Math.max(1, bounds.width + target.padding * 2);
        target.height = Math.max(1, bounds.height + target.padding * 2);
        target.canvas.width = clamp(Math.ceil(target.width / 28), 12, 72);
        target.canvas.height = clamp(Math.ceil(target.height / 28), 6, 28);
        target.pixels = target.context.createImageData(target.canvas.width, target.canvas.height);
        target.field = new Float32Array(target.canvas.width * target.canvas.height * 2);
        for (const node of [target.filter, target.map]) {
          node.setAttribute("x", String(-target.padding));
          node.setAttribute("y", String(-target.padding));
          node.setAttribute("width", String(target.width));
          node.setAttribute("height", String(target.height));
        }
      }
    };
    const draw = (time: number) => {
      animation = 0;
      if (!enabled()) {
        reset();
        return;
      }
      // Small displacement maps update at 30fps; no loop runs while the titles are still.
      if (time - last < 1000 / 30) {
        animation = requestAnimationFrame(draw);
        return;
      }
      const tick = Math.min((time - last) / 1000, 1 / 15) * 60;
      last = time;
      const relaxation = Math.pow(0.89, tick);
      let moving = false;
      for (const target of targets) {
        if (!target.dirty && !target.energy) continue;
        const { canvas, field, pixels } = target;
        target.energy = 0;
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const cell = x + y * canvas.width;
            let dx = field[cell * 2]! * relaxation;
            let dy = field[cell * 2 + 1]! * relaxation;
            const distance = Math.hypot(
              ((x + 0.5) / canvas.width - target.x) * target.width,
              ((y + 0.5) / canvas.height - target.y) * target.height,
            );
            if (target.x >= 0 && distance < target.radius) {
              const power =
                Math.min(4, target.radius / Math.max(distance, 1)) * (1 - distance / target.radius);
              dx += 5.5 * target.vx * power * tick;
              dy += 5.5 * target.vy * power * tick;
            }
            dx = Math.abs(dx) < 0.004 ? 0 : clamp(dx, -0.6, 0.6);
            dy = Math.abs(dy) < 0.004 ? 0 : clamp(dy, -0.6, 0.6);
            field[cell * 2] = dx;
            field[cell * 2 + 1] = dy;
            pixels.data[cell * 4] = Math.round(127.5 + dx * 127.5);
            pixels.data[cell * 4 + 1] = Math.round(127.5 + dy * 127.5);
            pixels.data[cell * 4 + 2] = 128;
            pixels.data[cell * 4 + 3] = 255;
            target.energy = Math.max(target.energy, Math.abs(dx), Math.abs(dy));
          }
        }
        target.vx *= Math.pow(0.78, tick);
        target.vy *= Math.pow(0.78, tick);
        target.dirty = false;
        target.element.dataset.titleFlow = target.energy.toFixed(4);
        if (target.energy) {
          target.context.putImageData(pixels, 0, 0);
          target.map.setAttribute("href", canvas.toDataURL());
          target.element.style.filter = `url("#${target.filter.id}")`;
          moving = true;
        } else target.element.style.filter = target.previousFilter;
      }
      if (moving) animation = requestAnimationFrame(draw);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !enabled()) return;
      let active = false;
      for (const target of targets) {
        const bounds = target.element.getBoundingClientRect();
        if (
          target.element.closest("[inert]") ||
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        ) {
          target.x = target.y = -1;
          target.vx = target.vy = 0;
          continue;
        }
        const x = (event.clientX - bounds.left + target.padding) / target.width;
        const y = (event.clientY - bounds.top + target.padding) / target.height;
        if (target.x >= 0) {
          target.vx = clamp(target.vx + (x - target.x) * target.width * 0.002, -0.04, 0.04);
          target.vy = clamp(target.vy + (y - target.y) * target.height * 0.002, -0.04, 0.04);
        }
        target.x = x;
        target.y = y;
        target.dirty = true;
        active = true;
      }
      if (active && !animation) {
        last = performance.now();
        animation = requestAnimationFrame(draw);
      }
    };
    const leave = () => {
      for (const target of targets) {
        target.x = target.y = -1;
        target.vx = target.vy = 0;
      }
    };
    const observer = new ResizeObserver(resize);
    for (const target of targets) observer.observe(target.element);
    resize();
    root.addEventListener("pointermove", move, { passive: true, capture: true });
    root.addEventListener("pointerleave", leave);
    window.addEventListener("scroll", reset, { passive: true });
    document.addEventListener("visibilitychange", reset);
    reduced.addEventListener("change", reset);
    fine.addEventListener("change", reset);
    return () => {
      disposed = true;
      reset();
      observer.disconnect();
      filters.remove();
      root.removeEventListener("pointermove", move, true);
      root.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", reset);
      document.removeEventListener("visibilitychange", reset);
      reduced.removeEventListener("change", reset);
      fine.removeEventListener("change", reset);
      for (const target of targets) delete target.element.dataset.titleFlow;
    };
  }, [id, section, viewport]);
}
