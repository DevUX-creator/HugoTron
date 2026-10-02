"use client";

import { useEffect, type RefObject } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

const clamp = (x: number) => Math.max(0, Math.min(1, x));

/** Blue ink follows the reading position over a continuous grey route. */
const INK_LEVEL = 0.62;

/** A smooth path through points (Catmull-Rom as cubic Béziers). */
function smoothPath(points: [number, number][]) {
  if (points.length < 2) return "";
  let d = `M${points[0]![0].toFixed(1)} ${points[0]![1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]!.toFixed(1)} ${c1[1]!.toFixed(1)} ${c2[0]!.toFixed(1)} ${c2[1]!.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/**
 * The paper story's one scroll pass: each chapter's progress drives its pictures' wipes, the
 * single ink line is drawn up to a fixed point in the viewport, and a settling pointer spring
 * adds parallax. Nothing runs while the page is still.
 */
export function useStory(root: RefObject<HTMLElement | null>) {
  const reduced = useReducedMotion();
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const chapters = Array.from(element.querySelectorAll<HTMLElement>("[data-story-chapter]"));
    const groups = new Map(
      Array.from(element.querySelectorAll<HTMLElement>("[data-story-group]")).map((group) => [
        group.dataset.storyGroup!,
        group,
      ]),
    );
    const svg = element.querySelector<SVGSVGElement>(".story__line");
    const paths = element.querySelectorAll<SVGPathElement>(".story__line path");
    const fill = element.querySelector<SVGRectElement>(".story__line-fill");
    const packs = Array.from(element.querySelectorAll<HTMLElement>(".paper-pack"));
    const visuals = element.querySelector<HTMLElement>(".story__visuals");
    let storyHeight = 0;
    let inView = false;
    let frame = 0;
    let dirty = true;
    let x = 0,
      y = 0,
      targetX = 0,
      targetY = 0;

    const layout = () => {
      if (!svg) return;
      const box = element.getBoundingClientRect();
      const width = box.width;
      // scrollHeight includes this absolute SVG. After a smaller viewport it
      // retained its old height, leaving an empty screen beyond the footer.
      const height = element.clientHeight;
      storyHeight = height;
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.style.blockSize = `${height}px`;
      const points: [number, number][] = [];
      for (const chapter of chapters) {
        const top = chapter.getBoundingClientRect().top - box.top;
        const span = chapter.offsetHeight;
        for (const pair of (chapter.dataset.line ?? "").split(";")) {
          const [px, py] = pair.split(",").map(Number);
          if (px === undefined || py === undefined || Number.isNaN(px) || Number.isNaN(py))
            continue;
          points.push([(px / 100) * width, top + py * span]);
        }
      }
      const d = smoothPath(points);
      paths.forEach((path) => path.setAttribute("d", d));
      fill?.setAttribute("width", String(width));
      dirty = true;
    };

    const update = () => {
      frame = 0;
      if (document.hidden) return;
      if (dirty) {
        dirty = false;
        const height = visuals?.clientHeight || innerHeight;
        const rootBox = element.getBoundingClientRect();
        inView = rootBox.top < height && rootBox.bottom > 0;
        for (const chapter of chapters) {
          const box = chapter.getBoundingClientRect();
          const progress = clamp((height - box.top) / (box.height + height));
          const name = chapter.dataset.storyChapter!;
          chapter.style.setProperty("--p", progress.toFixed(4));
          chapter.dataset.visible = String(box.top < height * 0.9 && box.bottom > 0);
          const group = groups.get(name);
          if (!group) continue;
          group.style.setProperty("--p", progress.toFixed(4));
          group.dataset.active = String(progress > 0.06 && progress < 0.94);
          // Timed layers join a moment after the chapter settles into view.
          group.dataset.live = String(progress > 0.28 && progress < 0.82);
        }
        for (const pack of packs) {
          const box = pack.getBoundingClientRect();
          pack.style.setProperty(
            "--pack-progress",
            reduced ? "1" : clamp((height * 0.85 - box.top) / (height * 0.9)).toFixed(4),
          );
        }
        // A continuous spatial clip has no sampled arc-length steps or trailing dot.
        // In the final viewport the ink catches up to the page edge, rather
        // than stopping at the usual reading level above the footer's bottom.
        const remaining = Math.max(0, rootBox.bottom - innerHeight);
        const finish = clamp(1 - remaining / height);
        const easeFinish = finish * finish * (3 - 2 * finish);
        const readingPosition = height * INK_LEVEL - rootBox.top;
        fill?.setAttribute(
          "height",
          String(
            reduced
              ? storyHeight
              : Math.max(
                  0,
                  Math.min(
                    storyHeight,
                    readingPosition + (storyHeight - readingPosition) * easeFinish,
                  ),
                ),
          ),
        );
      }
      x += (targetX - x) * 0.075;
      y += (targetY - y) * 0.075;
      element.style.setProperty("--paper-pointer-x", x.toFixed(4));
      element.style.setProperty("--paper-pointer-y", y.toFixed(4));
      if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.002)
        frame = requestAnimationFrame(update);
    };
    const wake = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const scroll = () => {
      dirty = true;
      wake();
    };
    const resize = () => {
      layout();
      wake();
    };
    const move = (event: PointerEvent) => {
      if (reduced || !inView || event.pointerType !== "mouse") return;
      targetX = (event.clientX / innerWidth) * 2 - 1;
      targetY = (event.clientY / innerHeight) * 2 - 1;
      wake();
    };
    const leave = () => {
      targetX = targetY = 0;
      wake();
    };
    // The story's own height changes as images and fonts load; the line follows.
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    layout();
    update();
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    document.addEventListener("visibilitychange", scroll);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
      document.removeEventListener("visibilitychange", scroll);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [root, reduced]);
}
