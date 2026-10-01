"use client";

import { useEffect, type RefObject } from "react";
import type { WorldScene } from "@/components/world/scene";
import { worldFlightProgress, worldScrollMetrics } from "@/components/world/progress";
import { WORLD_FILMS } from "@/content/worldFilms";

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};

/** Copy follows the rendered camera, including when a fast scroll gets ahead of it. */
export function revealWorldChapter(
  element: HTMLElement | null,
  first: HTMLElement | null,
  second: HTMLElement | null,
  progress: number,
) {
  if (!element || !first || !second) return;
  const flight = worldFlightProgress(progress);
  const copyOut = 1 - smooth(flight / 0.22);
  const copyIn = smooth((progress - 0.79) / 0.19);
  element.style.setProperty("--world-progress", String(flight));
  element.style.setProperty("--world-copy-out", String(copyOut));
  element.style.setProperty("--orbit-copy-in", String(copyIn));
  element.setAttribute("data-orbit-visible", String(copyIn > 0.001));
  element.setAttribute("data-chapter-progress", progress.toFixed(3));
  first.toggleAttribute("inert", copyOut < 0.02);
  second.toggleAttribute("inert", copyIn < 0.1);
}

/** Button and keyboard selection use the same native scroll path as a wheel or touch gesture. */
export function scrollToWorldFilm(element: HTMLElement, first: HTMLElement, index: number) {
  const height = element.querySelector<HTMLElement>(".world__visual")?.clientHeight ?? innerHeight;
  const metrics = worldScrollMetrics(height, innerWidth < 768);
  const start = Math.max(0, first.offsetHeight - height);
  window.scrollTo({
    top:
      scrollY +
      element.getBoundingClientRect().top +
      start +
      metrics.flight +
      metrics.filmPause +
      metrics.filmStep * index,
    behavior: "instant",
  });
}

/** Native document scroll controls one persistent canvas. No wheel interception or scroll lock. */
export function useWorldJourney(
  root: RefObject<HTMLDivElement | null>,
  hero: RefObject<HTMLElement | null>,
  orbit: RefObject<HTMLElement | null>,
  scene: RefObject<WorldScene | null>,
  ready: boolean,
  reduced: boolean,
) {
  useEffect(() => {
    const element = root.current;
    const first = hero.current;
    const second = orbit.current;
    if (!element || !first || !second || !ready) return;
    let frame = 0;
    const sync = () => {
      frame = 0;
      const visual = element.querySelector<HTMLElement>(".world__visual");
      const height = visual?.clientHeight ?? window.innerHeight;
      const start = Math.max(0, first.offsetHeight - height);
      const { flight, filmPause, filmStep, endHold } = worldScrollMetrics(
        height,
        window.innerWidth < 768,
      );
      const filmTravel = filmStep * (WORLD_FILMS.length - 1);
      element.style.setProperty("--world-travel", `${flight + filmPause + filmTravel + endHold}px`);
      const distance = Math.max(0, -element.getBoundingClientRect().top);
      const raw = clamp((distance - start) / flight);
      const progress = reduced ? Number(raw > 0.45) : raw;
      scene.current?.setChapterProgress(progress);
      const film =
        clamp((distance - start - flight - filmPause) / filmTravel) * (WORLD_FILMS.length - 1);
      scene.current?.setFilmPosition(reduced ? Math.round(film) : film);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(first);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    sync();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      first.removeAttribute("inert");
      second.removeAttribute("inert");
      element.removeAttribute("data-orbit-visible");
      element.removeAttribute("data-chapter-progress");
      for (const property of [
        "--world-travel",
        "--world-progress",
        "--world-copy-out",
        "--orbit-copy-in",
      ])
        element.style.removeProperty(property);
    };
  }, [root, hero, orbit, scene, ready, reduced]);
}
