"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { DoorArrival, DoorFlood, useDoorTransition } from "@/components/transition/DoorTransition";
import { useScrollLock } from "@/components/providers/SmoothScroll";
import ArrowLink from "@/components/ui/ArrowLink";
import type { LabelRoomScene } from "./types";

const CHAPTERS = ["arrival", "source", "identity", "horizon", "return"] as const;
const WINDOWS = [
  [0, 0.19],
  [0.19, 0.39],
  [0.39, 0.6],
  [0.6, 0.8],
  [0.8, 1.08],
] as const;
const smooth = (value: number) => {
  const x = Math.max(0, Math.min(1, value));
  return x * x * (3 - 2 * x);
};

export default function LabelRoom() {
  const t = useTranslations("labelRoom");
  const root = useRef<HTMLDivElement>(null),
    mount = useRef<HTMLDivElement>(null),
    scene = useRef<LabelRoomScene | null>(null);
  const reduced = useReducedMotion(),
    preferences = useRef({ reduced });
  const motion = useRef(0);
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false);
  const [entering, setEntering] = useState(false);
  const enteringRef = useRef(false);
  const { go, leaving } = useDoorTransition();
  const { lock, unlock } = useScrollLock();
  const reading = reduced || failed;
  useEffect(() => {
    if (entering && failed) go("/wholesale");
  }, [entering, failed, go]);
  useEffect(() => {
    if (!entering) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lock();
    return () => {
      document.body.style.overflow = previous;
      unlock();
    };
  }, [entering, lock, unlock]);
  useEffect(() => {
    preferences.current = { reduced };
    scene.current?.setReducedMotion(reduced);
  }, [reduced]);
  useEffect(() => {
    const element = mount.current;
    if (!element || failed) return;
    let cancelled = false;
    void import("./roomScene")
      .then(({ createLabelRoom }) => {
        if (cancelled) return;
        try {
          scene.current = createLabelRoom(element, {
            reduced: preferences.current.reduced,
            onReady: () => {
              if (!cancelled) setReady(true);
            },
            onError: () => {
              if (!cancelled) setFailed(true);
            },
          });
          scene.current.setProgress(motion.current);
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
    const element = root.current;
    if (!element) return;
    const stage = element.querySelector<HTMLElement>(".label-room__stage")!;
    const chapters = [...element.querySelectorAll<HTMLElement>("[data-label-chapter]")];
    const chapterButtons = [
      ...element.querySelectorAll<HTMLButtonElement>(".label-room__chapters button"),
    ];
    if (reading) {
      for (const node of chapters) {
        node.style.setProperty("--shown", "1");
        node.removeAttribute("inert");
        node.dataset.shown = "true";
      }
      scene.current?.setProgress(0);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const p = Math.max(
        0,
        Math.min(
          1,
          -element.getBoundingClientRect().top /
            Math.max(1, element.offsetHeight - stage.clientHeight),
        ),
      );
      motion.current = p;
      scene.current?.setProgress(p);
      element.style.setProperty("--progress", String(p));
      chapters.forEach((node, i) => {
        const [from, to] = WINDOWS[i]!;
        const shown =
          (i === 0 ? 1 : smooth((p - from) / 0.045)) * (1 - smooth((p - (to - 0.045)) / 0.045));
        node.style.setProperty("--shown", shown.toFixed(3));
        node.toggleAttribute("inert", shown < 0.5);
        node.dataset.shown = String(shown > 0.001);
        if (p >= from && p < to) chapterButtons[i]?.setAttribute("aria-current", "step");
        else chapterButtons[i]?.removeAttribute("aria-current");
      });
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
  function goTo(index: number) {
    const element = root.current;
    if (!element) return;
    if (reading) {
      element
        .querySelectorAll("[data-label-chapter]")
        [index]?.scrollIntoView({ behavior: "instant", block: "center" });
      return;
    }
    const stage = element.querySelector<HTMLElement>(".label-room__stage")!;
    const p = WINDOWS[index]![0] + 0.07;
    window.scrollTo({
      top:
        scrollY +
        element.getBoundingClientRect().top +
        p * (element.offsetHeight - stage.clientHeight),
      behavior: reduced ? "instant" : "smooth",
    });
  }
  return (
    <>
      <div
        ref={root}
        className="label-room"
        data-ready={ready || undefined}
        data-reading={reading || undefined}
        data-failed={failed || undefined}
        data-entering={entering || undefined}
      >
        <div className="label-room__stage">
          <div
            ref={mount}
            className="label-room__scene"
            role={ready && !failed ? "button" : "img"}
            tabIndex={ready && !failed ? 0 : -1}
            aria-label={ready && !failed ? t("identity.interactive") : t("scene")}
            aria-description={ready && !failed ? t("identity.keyboard") : undefined}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                if (!event.repeat) scene.current?.cycleFinish();
              } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                if (!event.repeat) scene.current?.turnPack(event.key === "ArrowLeft" ? -1 : 1);
              }
            }}
          />
          <div className="label-room__shade" aria-hidden="true" />
          {!ready && !failed && (
            <p className="label-room__loading" role="status">
              {t("loading")}
            </p>
          )}
          <section
            className="label-room__chapter"
            data-label-chapter="arrival"
            aria-labelledby="label-title"
          >
            <p className="label-room__eyebrow">{t("arrival.eyebrow")}</p>
            <h1 id="label-title">
              {t("arrival.title")}
              <span>{t("arrival.accent")}</span>
            </h1>
            <p className="label-room__copy">{t("arrival.body")}</p>
            <button className="label-room__continue" type="button" onClick={() => goTo(1)}>
              {t("continue")}
              <span aria-hidden="true">↓</span>
            </button>
          </section>
          <section
            className="label-room__chapter"
            data-label-chapter="source"
            aria-labelledby="label-source"
          >
            <p className="label-room__eyebrow">{t("source.eyebrow")}</p>
            <h2 id="label-source">
              {t("source.title")}
              <span>{t("source.accent")}</span>
            </h2>
            <p className="label-room__copy">{t("source.body")}</p>
            <ul className="label-room__facts">
              {(["product", "market", "volume"] as const).map((key) => (
                <li key={key}>{t(`source.${key}`)}</li>
              ))}
            </ul>
          </section>
          <section
            className="label-room__chapter label-room__chapter--identity"
            data-label-chapter="identity"
            aria-labelledby="label-identity"
          >
            <p className="label-room__eyebrow">{t("identity.eyebrow")}</p>
            <h2 id="label-identity">
              {t("identity.title")}
              <span>{t("identity.accent")}</span>
            </h2>
            <p className="label-room__copy">{t("identity.body")}</p>
            <p className="label-room__pack-hint">{t("identity.hint")}</p>
          </section>
          <section
            className="label-room__chapter label-room__chapter--horizon"
            data-label-chapter="horizon"
            aria-labelledby="label-horizon"
          >
            <p className="label-room__eyebrow">{t("horizon.eyebrow")}</p>
            <h2 id="label-horizon">
              {t("horizon.title")}
              <span>{t("horizon.accent")}</span>
            </h2>
            <p className="label-room__copy">{t("horizon.body")}</p>
            <ArrowLink
              href={{ pathname: "/contact", query: { purpose: "label" } }}
              variant="glass"
              size="large"
            >
              {t("horizon.action")}
            </ArrowLink>
            <p className="label-room__note">{t("horizon.note")}</p>
          </section>
          <section
            className="label-room__chapter label-room__chapter--return"
            data-label-chapter="return"
            aria-labelledby="label-return"
          >
            <p className="label-room__eyebrow">{t("return.eyebrow")}</p>
            <h2 id="label-return">
              {t("return.title")}
              <span>{t("return.accent")}</span>
            </h2>
            <p className="label-room__copy">{t("return.body")}</p>
            <ArrowLink
              href="/wholesale"
              variant="glass"
              size="large"
              aria-disabled={entering || undefined}
              onClick={(event) => {
                if (
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey ||
                  reading ||
                  !scene.current
                )
                  return;
                event.preventDefault();
                if (enteringRef.current) return;
                enteringRef.current = true;
                setEntering(true);
                scene.current.enterDoor(() => go("/wholesale"));
              }}
            >
              {t("return.action")}
            </ArrowLink>
          </section>
          <nav className="label-room__chapters" aria-label={t("chapters")}>
            {CHAPTERS.map((key, i) => (
              <button
                key={key}
                type="button"
                onClick={() => goTo(i)}
                aria-label={t(`${key}.eyebrow`)}
              >
                <span />
                {t(`${key}.short`)}
              </button>
            ))}
          </nav>
        </div>
      </div>
      <DoorArrival ready={ready || failed} />
      <DoorFlood active={leaving} />
    </>
  );
}
