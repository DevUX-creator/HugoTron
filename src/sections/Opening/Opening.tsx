"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Heading from "@/components/ui/Heading";
import Copy from "@/animations/Copy";
import ArrowLink from "@/components/ui/ArrowLink";
import Reveal from "@/animations/Reveal";
import GrainCluster from "@/components/ui/GrainCluster";
import { useHomeTheme } from "@/components/rice/HomeTheme";
import { useSound } from "@/components/sound/SoundProvider";
import { BRUSH_VIEW_START, smoothstep } from "@/components/rice/motion";
import type { RiceScene } from "@/components/rice/scene";
import { useHeroParallax } from "./useHeroParallax";
import { useTitleDeformation } from "./useTitleDeformation";
import OpeningProduct from "./OpeningProduct";
import "@/components/rice/riceScene.css";
import "./opening.css";

const POINTS = [
  { key: "one", shape: "chevron" },
  { key: "two", shape: "square" },
  { key: "three", shape: "stack" },
] as const;

/** The homepage's existing sourcing story, with the shared interactive rice scene. */
export default function Opening() {
  const t = useTranslations("hero");
  const { dark } = useHomeTheme();
  const { play } = useSound();
  const darkRef = useRef(dark);
  const section = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const scene = useRef<RiceScene | null>(null);
  const scrollTarget = useRef(0);
  const brushing = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "playing" | "unavailable">("loading");
  const [slow, setSlow] = useState(false);
  const [brushView, setBrushView] = useState(false);
  const interactive = status === "ready" || status === "playing";
  useHeroParallax(section, viewport);
  useTitleDeformation(section, viewport);

  useEffect(() => {
    darkRef.current = dark;
    scene.current?.setDark(dark);
  }, [dark]);

  useEffect(() => {
    const element = mount.current;
    const frame = viewport.current;
    if (!element || !frame) return;
    let cancelled = false;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => scene.current?.setReducedMotion(preference.matches);
    preference.addEventListener("change", syncMotion);
    void import("@/components/rice/scene")
      .then(({ createRiceScene }) => {
        if (cancelled) return;
        try {
          scene.current = createRiceScene(
            element,
            {
              onReady: () => setStatus("ready"),
              onEntranceProgress: (travel, opacity) => {
                section.current?.style.setProperty("--entry-progress", String(travel));
                section.current?.style.setProperty("--entry-opacity", String(opacity));
              },
              onPlaying: (playing) => {
                setStatus(playing ? "playing" : "ready");
                if (playing) play("product");
              },
              onFailure: () => setStatus("unavailable"),
              onCameraProgress: (progress) => {
                section.current?.style.setProperty("--camera-progress", String(progress));
                const next = progress >= BRUSH_VIEW_START;
                if (brushing.current !== next) {
                  brushing.current = next;
                  setBrushView(next);
                }
              },
            },
            {
              viewport: frame,
              heroScale: 1.25,
              heroElevation: 0.09,
              entrance: true,
              sculptedLight: true,
              surfaceTexture: {
                src: "/textures/wood-endgrain-1024.avif",
                fallback: "/textures/wood-endgrain-1024.webp",
              },
            },
          );
          scene.current.setDark(darkRef.current);
          syncMotion();
          scene.current.setScrollProgress(scrollTarget.current);
        } catch (error) {
          console.error("The rice scene could not initialize", error);
          setStatus("unavailable");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("unavailable");
      });
    return () => {
      cancelled = true;
      preference.removeEventListener("change", syncMotion);
      scene.current?.dispose();
      scene.current = null;
    };
  }, [play]);

  useEffect(() => {
    const story = section.current;
    const frame = viewport.current;
    if (!story || !frame) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pending = 0;
    let orbitSoundPlayed = false;
    let initialSync = true;
    const sync = () => {
      pending = 0;
      const range = Math.max(
        1,
        Math.min(frame.offsetHeight, story.offsetHeight - frame.offsetHeight),
      );
      const distance = Math.max(0, -story.getBoundingClientRect().top);
      const p = Math.min(1, distance / range);
      // Once the overview reaches its final position, the next paper sheet
      // can scroll over the entire composition, including its copy.
      story.style.setProperty(
        "--opening-stick-top",
        `${frame.offsetHeight - story.offsetHeight}px`,
      );
      // On small screens the larger product copy continues below the camera story.
      // Let the bowl travel up with that content once the orbit is complete.
      story.style.setProperty("--scene-exit-offset", `${Math.max(0, distance - range)}px`);
      story.style.setProperty(
        "--overview-extra-height",
        `${Math.max(0, story.offsetHeight - frame.offsetHeight * 2)}px`,
      );
      const camera = preference.matches ? (p > 0.5 ? 1 : 0) : smoothstep((p - 0.04) / 0.92);
      if (!orbitSoundPlayed && camera > 0.12) {
        // Restored scroll positions are silent; only a newly entered camera move has a cue.
        if (!initialSync) play("transition");
        orbitSoundPlayed = true;
      }
      initialSync = false;
      story.style.setProperty(
        "--frame-progress",
        String(preference.matches ? 1 : Math.min(1, Math.max(0, (p - 0.08) / 0.8))),
      );
      scrollTarget.current = camera;
      scene.current?.setScrollProgress(camera);
    };
    const schedule = () => {
      if (!pending) pending = requestAnimationFrame(sync);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(story);
    observer.observe(frame);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    preference.addEventListener("change", schedule);
    sync();
    return () => {
      cancelAnimationFrame(pending);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      preference.removeEventListener("change", schedule);
    };
  }, [play]);

  return (
    <section
      ref={section}
      className="opening"
      aria-labelledby="opening-title"
      data-interactive={interactive}
      data-status={status}
    >
      <div ref={viewport} className="opening__viewport">
        <div className="opening__atmosphere" aria-hidden="true" />
        <div className="opening__scene">
          <div className="opening__scene-reveal">
            <div className="opening__scene-parallax">
              <div
                ref={mount}
                className="rice-canvas opening__canvas"
                role={brushView ? "group" : "button"}
                tabIndex={interactive ? 0 : -1}
                aria-hidden={!interactive}
                aria-label={brushView ? t("scene.brush") : t("scene.lift")}
                aria-describedby="opening-instruction"
                aria-keyshortcuts={
                  brushView ? "ArrowUp ArrowDown ArrowLeft ArrowRight" : "Enter Space"
                }
                aria-disabled={status !== "ready"}
                onKeyDown={(event) => {
                  if (brushView) {
                    const directions: Record<string, [number, number]> = {
                      ArrowLeft: [-1, 0],
                      ArrowRight: [1, 0],
                      ArrowUp: [0, -1],
                      ArrowDown: [0, 1],
                    };
                    const direction = directions[event.key];
                    if (direction) {
                      event.preventDefault();
                      scene.current?.brushWithKey(...direction);
                    }
                  } else if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    scene.current?.toss();
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="opening__bottom">
          <p className="opening__route">
            <span>{t("eyebrow")}</span>
          </p>
          <div className="opening__instructions">
            <p id="opening-instruction">
              {interactive ? (
                <>
                  <span className="opening__desktop-hint">
                    {brushView ? t("scene.brushHint") : t("scene.tiltHint")}
                  </span>
                  <span className="opening__touch-hint">
                    {brushView ? t("scene.brushTouchHint") : t("scene.touchHint")}
                  </span>
                  {brushView && <span className="sr-only">{t("scene.keyboardHint")}</span>}
                </>
              ) : status === "loading" ? (
                t("scene.loading")
              ) : (
                t("eyebrow")
              )}
            </p>
          </div>
          <p className="opening__route opening__route--destination">
            <span>{t("scene.distribution")}</span>
          </p>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {status === "playing" ? t("scene.playing") : brushView ? t("scene.brush") : ""}
        </p>
      </div>
      <div className="opening__content">
        <div className="opening__intro">
          <div className="opening__band">
            <div className="opening__claim">
              <Copy eager>
                <Heading as={1} size="claim" id="opening-title" className="opening__title">
                  {t("titleLead")} <span className="opening__title-accent">{t("titleAccent")}</span>
                </Heading>
              </Copy>
            </div>
            <Reveal eager className="opening__cta" delay={0.35}>
              <ArrowLink href="/range">{t("cta")}</ArrowLink>
            </Reveal>
          </div>

          <div className="opening__rule">
            <span className="opening__rule-tail" aria-hidden="true" />
            <div className="opening__controls">
              <button
                type="button"
                className="opening__slow"
                aria-pressed={slow}
                disabled={!interactive}
                onClick={() => {
                  setSlow(!slow);
                  scene.current?.setSlow(!slow);
                }}
              >
                <span className="opening__switch" aria-hidden="true" /> {t("scene.slow")}
              </button>
              <button
                type="button"
                className="opening__lift"
                disabled={status !== "ready" || brushView}
                onClick={() => scene.current?.toss()}
              >
                <span className="opening__lift-icon" aria-hidden="true">
                  ↑
                </span>
                {t("scene.lift")}
              </button>
            </div>
          </div>
          <ul className="opening__points">
            {POINTS.map(({ key, shape }, i) => (
              <li className="opening__point" key={key}>
                <Reveal eager delay={0.55 + i * 0.1}>
                  <GrainCluster shape={shape} className="opening__mark" />
                  <p>{t(`points.${key}`)}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>

        <div className="opening__overview">
          <div className="opening__overview-frame" aria-hidden="true">
            <span className="opening__frame-edge opening__frame-edge--top" />
            <span className="opening__frame-edge opening__frame-edge--right" />
            <span className="opening__frame-edge opening__frame-edge--bottom" />
            <span className="opening__frame-edge opening__frame-edge--left" />
            <span className="opening__overview-corner" />
          </div>
          <Copy start="top 94%">
            <p className="opening__eyebrow">{t("scene.overheadEyebrow")}</p>
          </Copy>
          <div className="opening__overview-heading">
            <Copy start="top 92%">
              <Heading as={2} size="claim">
                {t("scene.overheadTitle")}
              </Heading>
            </Copy>
          </div>
          <OpeningProduct />
          <div className="opening__still-life opening__still-life--near" aria-hidden="true">
            <Reveal>
              <GrainCluster shape="chevron" />
            </Reveal>
          </div>
          <div className="opening__still-life opening__still-life--far" aria-hidden="true">
            <Reveal delay={0.15}>
              <GrainCluster shape="stack" />
            </Reveal>
          </div>
          <div className="opening__note opening__note--delivery">
            <Copy>
              <h3>{t("scene.deliveryTitle")}</h3>
            </Copy>
            <Copy delay={0.12}>
              <p>{t("points.two")}</p>
            </Copy>
          </div>
        </div>
      </div>
    </section>
  );
}
