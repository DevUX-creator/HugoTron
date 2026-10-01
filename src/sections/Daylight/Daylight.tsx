"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import ScrollWords from "@/animations/ScrollWords";
import Origins from "@/sections/Origins/Origins";
import { worldHandoff } from "@/sections/World/handoff";
import { useToneFill } from "./useToneFill";
import "./daylight.css";

/** The hand-off runway in viewport heights; keep in step with `--runway` in daylight.css. */
const RUNWAY = 1.7;

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};

/**
 * Daylight: the same frame, a new scene. Over the journey's last pinned screen the Details copy
 * and its film fall away while the scene's lines run hot, blur and grain; paper rises with a torn
 * edge. Then, still pinned, the statement inks in, softly gives way, and the origins map arrives.
 */
export default function Daylight() {
  const t = useTranslations("daylight");
  const track = useRef<HTMLDivElement>(null);
  const statement = useRef<HTMLElement>(null);
  const map = useRef<HTMLDivElement>(null);
  const { canvas, draw } = useToneFill("--color-paper-100");
  const [scene, setScene] = useState<"none" | "statement" | "origins">("none");

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const root = document.documentElement;
    let frame = 0;
    const update = () => {
      frame = 0;
      const height = window.innerHeight;
      const length = height * RUNWAY;
      const top = element.getBoundingClientRect().top;
      // The hand-off over the journey's last pinned screen: falling copy, then rising paper.
      const handoff = (height - top) / length;
      const leave = smooth(handoff / 0.5);
      root.style.setProperty("--leave", leave.toFixed(4));
      worldHandoff.set(leave);
      const fill = clamp((handoff - 0.3) / 0.7) * 1.1;
      draw.current(handoff > 0.3 ? fill : 0);
      // The header, frame and labels turn light once the paper reaches the header itself.
      root.dataset.homeTheme = fill > 0.9 ? "light" : "dark";
      // Then the pinned light scenes, over the rest of the track.
      const scenes = Math.max(0, element.offsetHeight - length);
      const s = handoff < 1 ? -1 : clamp((height - top - length) / scenes);
      statement.current?.style.setProperty("--reveal", clamp(s / 0.3).toFixed(4));
      statement.current?.style.setProperty("--out", smooth((s - 0.38) / 0.12).toFixed(4));
      map.current?.style.setProperty("--enter", smooth((s - 0.48) / 0.1).toFixed(4));
      setScene(s < 0 ? "none" : s < 0.5 ? "statement" : "origins");
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      root.dataset.homeTheme = "dark";
      root.style.removeProperty("--leave");
      worldHandoff.set(0);
    };
  }, [draw]);

  return (
    <div ref={track} className="daylight" data-scene={scene}>
      <canvas ref={canvas} className="daylight__fill" aria-hidden="true" />
      <div className="daylight__stage">
        <section
          ref={statement}
          className="daylight__statement"
          aria-labelledby="daylight-title"
          inert={scene !== "statement"}
        >
          <span className="daylight__coord daylight__coord--lat" aria-hidden="true">
            53.5511° N
          </span>
          <span className="daylight__coord daylight__coord--lon" aria-hidden="true">
            9.9937° E
          </span>
          <p className="daylight__eyebrow">{t("eyebrow")}</p>
          <ScrollWords
            as="h2"
            id="daylight-title"
            className="daylight__words"
            text={t("statement")}
            controlled
          />
          <p className="daylight__note">{t("note")}</p>
        </section>
        <div ref={map} className="daylight__origins" inert={scene !== "origins"}>
          <Origins shown={scene === "origins"} />
        </div>
      </div>
    </div>
  );
}
