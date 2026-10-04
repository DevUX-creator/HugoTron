"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ArrowLink from "@/components/ui/ArrowLink";
import { DoorFlood, useDoorTransition } from "@/components/transition/DoorTransition";
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
  { key: "door", from: 0.84, to: 1.01 },
] as const;

/** The door opens over the last stretch; at the very end the visitor walks through it. */
const DOOR_FROM = 0.88;
const DOOR_TO = 0.97;
const THROUGH = 0.995;

/**
 * Wholesale as a place: a walk down the hall along the neon trails, the copy appearing at its
 * stations, to a door that opens onto the next location, Delivery. All copy is in the HTML;
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
  const reading = reduced || failed;
  const motion = useRef({ progress: 0, door: 0 });
  const { go, leaving } = useDoorTransition();
  const leave = useRef(go);
  useEffect(() => {
    leave.current = go;
  }, [go]);

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
    // Returning from Delivery restores the scroll to the door just after mount; the door only
    // leads on once the visitor has walked back up the hall and down to it again.
    let armed = false;
    const mountedAt = performance.now();
    const update = () => {
      frame = 0;
      const stage = element.querySelector<HTMLElement>(".hall__stage")!;
      const distance = Math.max(1, element.offsetHeight - stage.clientHeight);
      const progress = clamp(-element.getBoundingClientRect().top / distance);
      if (progress < 0.9 && performance.now() - mountedAt > 800) armed = true;
      motion.current = { progress, door: smooth((progress - DOOR_FROM) / (DOOR_TO - DOOR_FROM)) };
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
      if (armed && progress >= THROUGH) {
        armed = false;
        leave.current("/delivery");
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    // A visit that starts up the hall arms the door without waiting for a scroll.
    const arming = window.setTimeout(schedule, 850);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(arming);
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
            <nav className="hall__crumbs" aria-label={t("breadcrumbLabel")}>
              <ol>
                <li>
                  <Link href="/">{t("home")}</Link>
                </li>
                <li aria-current="page">{t("name")}</li>
              </ol>
            </nav>
            <p className="hall__eyebrow">{t("intro.eyebrow")}</p>
            <h1 id="wholesale-title" className="hall__title">
              <span>{t("intro.titleLead")}</span> <span>{t("intro.titleAccent")}</span>
            </h1>
            <p className="hall__lead">{t("intro.lead")}</p>
            <ArrowLink
              href={{ pathname: "/enquiry", query: { purpose: "quote" } }}
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
            <ul className="hall__cards">
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
            <ol className="hall__cards hall__cards--steps">
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
              href="/delivery"
              variant="glass"
              size="large"
              prefetch={false}
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
                go("/delivery");
              }}
            >
              {t("door.action")}
            </ArrowLink>
          </section>

          <nav className="hall__legal" aria-label={t("legalLabel")}>
            <a href="https://www.hugo-tron.com/impressum">{t("imprint")}</a>
            <a href="https://www.hugo-tron.com/datenschutz">{t("privacy")}</a>
          </nav>
        </div>
      </div>
      <DoorFlood active={leaving} />
    </>
  );
}
