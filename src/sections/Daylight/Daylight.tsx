"use client";

import { useEffect, useRef } from "react";
import { worldHandoff } from "@/sections/World/handoff";
import { useReducedMotion } from "@/lib/useReducedMotion";
import PaperStory from "./PaperStory";
import { useToneFill } from "./useToneFill";
import "./daylight.css";

/** Matches --runway and fits inside the World journey's endHold. */
const RUNWAY = 1.7;
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export default function Daylight() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { canvas, draw } = useToneFill("--color-world-paper");

  useEffect(() => {
    const element = track.current;
    const wrapper = root.current;
    if (!element || !wrapper) return;
    const html = document.documentElement;
    const journey = document.querySelector<HTMLElement>(".world-journey");
    let frame = 0;
    const update = () => {
      frame = 0;
      const enhanced = !reduced && journey?.dataset.enhanced === "true";
      wrapper.dataset.enhanced = String(enhanced);
      // The runway uses svh. Mobile browser chrome changes innerHeight mid-gesture;
      // mixing the two made the paper jump when the toolbar returned on reverse scroll.
      const height = enhanced ? element.clientHeight / RUNWAY : window.innerHeight;
      const top = element.getBoundingClientRect().top;
      const progress = enhanced
        ? clamp((height - top) / (height * RUNWAY))
        : Number(top < height * 0.55);
      // Letter, film and material share the same start and finish, in either scroll direction.
      html.style.setProperty("--leave", progress.toFixed(4));
      worldHandoff.set(progress);
      draw.current(progress);
      wrapper.style.setProperty("--paper-enter", clamp((progress - 0.72) / 0.28).toFixed(4));
      wrapper.dataset.arrived = String(progress >= 0.98);
      const light = progress > 0.91;
      html.dataset.homeTheme = light ? "light" : "dark";
      html.toggleAttribute("data-world-paper", light);
      wrapper.dataset.handoff = progress.toFixed(3);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    // The preceding World track gains its measured height after hydration.
    const layout = new ResizeObserver(schedule);
    if (journey) layout.observe(journey);
    layout.observe(element);
    const readiness = new MutationObserver(schedule);
    if (journey)
      readiness.observe(journey, { attributes: true, attributeFilter: ["data-enhanced"] });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      layout.disconnect();
      readiness.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      html.dataset.homeTheme = "dark";
      html.removeAttribute("data-world-paper");
      html.style.removeProperty("--leave");
      worldHandoff.set(0);
    };
  }, [draw, reduced]);

  return (
    <div ref={root} className="daylight">
      <div ref={canvas} className="daylight__fill" aria-hidden="true" />
      <div ref={track} className="daylight__handoff" />
      <PaperStory />
    </div>
  );
}
