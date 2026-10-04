"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import ArrowLink from "@/components/ui/ArrowLink";
import { useScrollLock } from "@/components/providers/SmoothScroll";
import { DoorArrival, DoorFlood, useDoorTransition } from "@/components/transition/DoorTransition";
import type { HallScene } from "@/components/hall/types";
import { useReducedMotion } from "@/lib/useReducedMotion";

/** Scroll, in viewport heights, for the whole walk. */
const RUNWAY = 7;
const FADE = 0.035;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};

/** Where along the walk each chapter is read (share of the walk). */
const CHAPTERS = [
  { key: "intro", from: 0, to: 0.12 },
  { key: "audience", from: 0.17, to: 0.33 },
  { key: "range", from: 0.38, to: 0.56 },
  { key: "process", from: 0.6, to: 0.78 },
  { key: "door", from: 0.84, to: 1.04 },
] as const;

/** The walk ends at a slightly open door. Only the explicit link continues to Private Label. */
const DOOR_FROM = 0.88;
const DOOR_TO = 0.97;
const DOOR_PEEK = 0.18;

/**
 * Wholesale as a place: a walk down the hall along the neon trails, the copy appearing at its
 * stations, to a door that opens onto the next location, Private Label. All copy is in the HTML;
 * without script or with reduced motion the chapters simply stand one after another.
 */
export default function WholesaleHall() {
  const t = useTranslations("wholesale");
  const root = useRef<HTMLDivElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const scene = useRef<HallScene | null>(null);
  const reduced = useReducedMotion();
  const preferences = useRef({ reduced });
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [entering, setEntering] = useState(false);
  const enteringRef = useRef(false);
  const { lock, unlock } = useScrollLock();
  const reading = reduced || failed;
  const motion = useRef({ progress: 0, door: 0 });
  const { go, leaving } = useDoorTransition();
  const navigate = useRef(go);
  useEffect(() => {
    navigate.current = go;
  }, [go]);

  useEffect(() => {
    if (!entering) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lock();
    return () => {
      document.body.style.overflow = overflow;
      unlock();
    };
  }, [entering, lock, unlock]);

  useEffect(() => {
    const element = mount.current;
    if (!element || failed) return;
    let cancelled = false;
    void import("@/components/hall/palaceScene")
      .then(({ createPalaceScene }) => {
        if (cancelled) return;
        try {
          scene.current = createPalaceScene(element, {
            reduced: preferences.current.reduced,
            onReady: () => {
              if (!cancelled) setReady(true);
            },
            onError: () => {
              if (!cancelled) setFailed(true);
            },
          });
          scene.current.setProgress(motion.current.progress);
          scene.current.setDoor(motion.current.door);
        } catch {
          if (!cancelled) setFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      scene.current?.dispose();
      scene.current = null;
    };
  }, [failed]);

  useEffect(() => {
    preferences.current = { reduced };
    scene.current?.setReducedMotion(reduced);
  }, [reduced]);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const chapters = CHAPTERS.map((chapter) => ({
      ...chapter,
      node: element.querySelector<HTMLElement>(`[data-chapter="${chapter.key}"]`)!,
    }));
    if (reading) {
      motion.current = { progress: 0, door: 0 };
      scene.current?.setProgress(0);
      scene.current?.setDoor(0);
      for (const { node } of chapters) {
        node.style.setProperty("--shown", "1");
        node.removeAttribute("inert");
        node.dataset.shown = "true";
      }
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      if (enteringRef.current) return;
      const stage = element.querySelector<HTMLElement>(".hall__stage")!;
      const distance = Math.max(1, element.offsetHeight - stage.clientHeight);
      const progress = clamp(-element.getBoundingClientRect().top / distance);
      motion.current = {
        progress,
        door: smooth((progress - DOOR_FROM) / (DOOR_TO - DOOR_FROM)) * DOOR_PEEK,
      };
      scene.current?.setProgress(progress);
      scene.current?.setDoor(motion.current.door);
      element.style.setProperty("--walk", progress.toFixed(4));
      for (const { node, from, to } of chapters) {
        const shown =
          from <= 0
            ? 1 - smooth((progress - (to - FADE)) / FADE)
            : smooth((progress - from) / FADE) * (1 - smooth((progress - (to - FADE)) / FADE));
        node.style.setProperty("--shown", shown.toFixed(3));
        node.toggleAttribute("inert", shown < 0.5);
        node.dataset.shown = String(shown > 0.001);
      }
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
    };
  }, [reading]);

  return (
    <>
      <div
        ref={root}
        className="hall"
        data-ready={ready || undefined}
        data-reading={reading || undefined}
        data-failed={failed || undefined}
        data-entering={entering || undefined}
        aria-busy={entering || leaving || undefined}
        style={{ "--runway": RUNWAY } as CSSProperties}
      >
        <div className="hall__stage">
          <div ref={mount} className="hall__scene" role="img" aria-label={t("sceneLabel")} />
          <div className="hall__shade" aria-hidden="true" />

          <section
            className="hall-chapter hall-chapter--intro"
            data-chapter="intro"
            aria-labelledby="wholesale-title"
          >
            <p className="hall__eyebrow">{t("intro.eyebrow")}</p>
            <h1 id="wholesale-title" className="hall__title">
              <span>{t("intro.titleLead")}</span> <span>{t("intro.titleAccent")}</span>
            </h1>
            <p className="hall__lead">{t("intro.lead")}</p>
            <ArrowLink
              href={{ pathname: "/contact", query: { purpose: "quote" } }}
              prefetch={false}
              variant="glass"
              size="large"
            >
              {t("intro.action")}
            </ArrowLink>
          </section>

          <section
            className="hall-chapter hall-chapter--audience"
            data-chapter="audience"
            aria-labelledby="wholesale-audience"
          >
            <p className="hall__eyebrow">{t("audience.eyebrow")}</p>
            <h2 id="wholesale-audience">{t("audience.title")}</h2>
            <ul className="hall__audience">
              {(["wholesalers", "industry", "companies"] as const).map((key) => (
                <li key={key}>
                  <h3>{t(`audience.${key}.title`)}</h3>
                  <p>{t(`audience.${key}.note`)}</p>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="hall-chapter hall-chapter--range"
            data-chapter="range"
            aria-labelledby="wholesale-range"
          >
            <p className="hall__eyebrow">{t("range.eyebrow")}</p>
            <h2 id="wholesale-range">{t("range.title")}</h2>
            <p className="hall__note">{t("range.note")}</p>
            <ArrowLink href="/range" variant="glass" size="large" prefetch={false}>
              {t("range.action")}
            </ArrowLink>
          </section>

          <section
            className="hall-chapter hall-chapter--process"
            data-chapter="process"
            aria-labelledby="wholesale-process"
          >
            <p className="hall__eyebrow">{t("process.eyebrow")}</p>
            <h2 id="wholesale-process">{t("process.title")}</h2>
            <ol className="hall__steps">
              {(["request", "offer", "confirm", "deliver"] as const).map((key, index) => (
                <li key={key}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{t(`process.${key}.title`)}</h3>
                  <p>{t(`process.${key}.note`)}</p>
                </li>
              ))}
            </ol>
          </section>

          <section
            className="hall-chapter hall-chapter--door"
            data-chapter="door"
            aria-labelledby="wholesale-door"
          >
            <p className="hall__eyebrow">{t("door.eyebrow")}</p>
            <h2 id="wholesale-door">{t("door.title")}</h2>
            <p className="hall__note">{t("door.note")}</p>
            <ArrowLink
              href="/private-label"
              variant="glass"
              size="large"
              prefetch={false}
              aria-disabled={entering || leaving || undefined}
              onClick={(event) => {
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey ||
                  event.button !== 0
                )
                  return;
                event.preventDefault();
                if (enteringRef.current || leaving) return;
                if (
                  reading ||
                  !ready ||
                  !scene.current?.enterDoor(() => navigate.current("/private-label"))
                ) {
                  go("/private-label");
                  return;
                }
                enteringRef.current = true;
                setEntering(true);
              }}
            >
              {t("door.action")}
            </ArrowLink>
          </section>
        </div>
      </div>
      <DoorFlood active={leaving} />
      <DoorArrival ready={ready || failed} />
    </>
  );
}
