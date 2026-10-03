"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import ArrowLink from "@/components/ui/ArrowLink";
import ArrowIcon from "@/components/ui/ArrowIcon";
import Button from "@/components/ui/Button";
import { getCategories, isSellable } from "@/lib/catalogue";
import { useHomeTheme } from "@/components/rice/HomeTheme";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSound } from "@/components/sound/SoundProvider";
import type { WorldScene } from "@/components/world/scene";
import type { SpecimenId } from "@/components/world/specimen";
import type { ProductChoice } from "@/components/products/useProductChoice";
import WorldPurchase from "./WorldPurchase";
import WorldOrbit from "./WorldOrbit";
import { worldHandoff } from "./handoff";
import { revealWorldChapter, scrollToWorldFilm, useWorldJourney } from "./useWorldJourney";
import "./world.css";

/** What can be bought in the shop comes first; wholesale-only ranges follow in their usual order. */
// The catalogue can grow independently of the hero's six existing 3D specimens.
const LISTED_CATEGORIES = getCategories()
  .filter((category) => category.id !== "nuts" && category.id !== "spices")
  .sort((a, b) => Number(isSellable(b)) - Number(isSellable(a)));

/** The brand entrance. The established rice experience has its own category route. */
export default function World() {
  const t = useTranslations("world");
  const { dark } = useHomeTheme();
  const reduced = useReducedMotion();
  const { play } = useSound();
  const mount = useRef<HTMLDivElement>(null);
  const journey = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLElement>(null);
  const orbit = useRef<HTMLElement>(null);
  const scene = useRef<WorldScene | null>(null);
  const preferences = useRef({ dark, reduced });
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [progress, setProgress] = useState(0);
  const [activeFilm, setActiveFilm] = useState(0);
  const activeFilmRef = useRef(0);
  const flightSoundPlayed = useRef(false);
  const [filmsPaused, setFilmsPaused] = useState(false);
  const filmsPausedRef = useRef(false);
  useWorldJourney(journey, hero, orbit, scene, status === "ready", reduced);
  // Hovering a category previews it everywhere (centre object, title, lead, purchase); a click
  // keeps it, and leaving the list returns to what was kept.
  const [selected, setSelected] = useState<SpecimenId | null>(null);
  const [preview, setPreview] = useState<SpecimenId | null>(null);
  const shown = preview ?? selected;
  const shownRef = useRef(shown);
  const category = LISTED_CATEGORIES.find((item) => item.id === shown);
  // A chosen type and pack size survive previewing other categories.
  const [choices, setChoices] = useState<Partial<Record<SpecimenId, ProductChoice>>>({});

  const switchProduct = (direction: number) => {
    setPreview(null);
    setSelected((current) => {
      // Include the brand cube so visitors can return to the entrance.
      const index = current ? LISTED_CATEGORIES.findIndex((item) => item.id === current) + 1 : 0;
      const next =
        (index + direction + LISTED_CATEGORIES.length + 1) % (LISTED_CATEGORIES.length + 1);
      return next === 0 ? null : LISTED_CATEGORIES[next - 1]!.id;
    });
  };

  useEffect(() => {
    if (status !== "loading") return;
    const mobile = matchMedia("(width < 48rem)");
    const sync = () => {
      document.documentElement.toggleAttribute("data-world-loading", mobile.matches);
    };
    sync();
    mobile.addEventListener("change", sync);
    return () => {
      mobile.removeEventListener("change", sync);
      document.documentElement.removeAttribute("data-world-loading");
    };
  }, [status]);

  // Daylight's hand-off reaches the scene: hotter lines, blur, grain and the falling sheet.
  useEffect(() => worldHandoff.subscribe((value) => scene.current?.setLeave(value)), []);

  useEffect(() => {
    if (shownRef.current !== shown) play("product");
    shownRef.current = shown;
    scene.current?.setCategory(shown);
  }, [shown, play]);

  useEffect(() => {
    preferences.current = { dark, reduced };
    scene.current?.setDark(dark);
    scene.current?.setReducedMotion(reduced);
  }, [dark, reduced]);

  useEffect(() => {
    const element = mount.current;
    if (!element) return;
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (cancelled) return;
      cancelled = true;
      scene.current?.dispose();
      scene.current = null;
      setStatus("unavailable");
    }, 20000);
    const fail = () => {
      if (cancelled) return;
      window.clearTimeout(timeout);
      scene.current?.dispose();
      scene.current = null;
      setStatus("unavailable");
    };
    void import("@/components/world/scene")
      .then(({ createWorldScene }) => {
        if (cancelled) return;
        try {
          scene.current = createWorldScene(element, {
            ...preferences.current,
            onProgress: (value) => {
              if (!cancelled) setProgress(Math.round(value));
            },
            onReady: () => {
              if (cancelled) return;
              window.clearTimeout(timeout);
              scene.current?.setCategory(shownRef.current);
              scene.current?.setFilmsPaused(filmsPausedRef.current);
              scene.current?.setLeave(worldHandoff.get());
              setStatus("ready");
            },
            onError: fail,
            onHover: () => play("hover"),
            onChapterProgress: (value) => {
              if (cancelled) return;
              revealWorldChapter(journey.current, hero.current, orbit.current, value);
              if (value < 0.025) flightSoundPlayed.current = false;
              else if (value > 0.08 && !flightSoundPlayed.current) {
                flightSoundPlayed.current = true;
                play("transition");
              }
            },
            onFilmProgress: (value) => {
              if (cancelled) return;
              const next = Math.round(value);
              const distance = Math.min(1, Math.max(0, (Math.abs(value - next) - 0.08) / 0.37));
              const opacity = 1 - distance * distance * (3 - 2 * distance);
              journey.current?.style.setProperty("--film-copy", String(opacity));
              if (activeFilmRef.current !== next) {
                play("transition");
                activeFilmRef.current = next;
                setActiveFilm(next);
              }
            },
          });
        } catch {
          fail();
        }
      })
      .catch(fail);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      scene.current?.dispose();
      scene.current = null;
    };
  }, [play]);

  return (
    <div
      className="world-journey"
      ref={journey}
      data-status={status}
      data-enhanced={status === "ready"}
    >
      <div className="world__visual">
        <div className="world__poster" aria-hidden="true">
          <picture>
            <source
              media="(max-width: 47.999rem)"
              srcSet="/models/world/courtyard-dark-mobile.webp"
            />
            <Image
              src="/models/world/courtyard-dark.webp"
              alt=""
              fill
              sizes="100vw"
              unoptimized
              loading="eager"
            />
          </picture>
        </div>
        <div className="world__scene" ref={mount} aria-hidden="true" />
        <div className="world__shade" aria-hidden="true" />
      </div>
      <section
        ref={hero}
        className="world"
        id="top"
        data-status={status}
        aria-labelledby="world-title"
      >
        {/* The catalogue action and final category share the bottom edge of the composition. */}
        <div className="world__intro">
          <h1 id="world-title" className="world__title world__reveal" aria-live="polite">
            {/* Keyed, so each change of selection replays the short swap animation. */}
            <span key={shown ?? "world"} className="world__swap">
              <span>{shown ? t(`${shown}Lead`) : t("titleLead")}</span>{" "}
              <span>{shown ? t(`${shown}Accent`) : t("titleAccent")}</span>
            </span>
          </h1>
          <div className="world__cta world__reveal">
            {category ? (
              <WorldPurchase
                key={category.id}
                category={category}
                choice={choices[category.id]}
                onChoose={(choice) =>
                  setChoices((current) => ({ ...current, [category.id]: choice }))
                }
              />
            ) : (
              <ArrowLink href="/range" prefetch={false} size="large" variant="glass">
                {t("viewProducts")}
              </ArrowLink>
            )}
          </div>
        </div>
        <p className="world__lead world__reveal" aria-live="polite">
          <span key={shown ?? "world"} className="world__swap">
            {shown ? t(`${shown}Side`) : t("lead")}
          </span>
        </p>
        <div className="world__products">
          <nav
            className="world__categories world__reveal"
            aria-label={t("categoriesLabel")}
            onPointerLeave={() => setPreview(null)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setPreview(null);
            }}
          >
            <ul>
              {LISTED_CATEGORIES.map((category) => (
                <li key={category.id}>
                  <button
                    type="button"
                    data-cursor="wrap"
                    aria-pressed={selected === category.id}
                    data-selected={selected === category.id || undefined}
                    onPointerEnter={(event) => {
                      if (event.pointerType !== "touch") setPreview(category.id);
                    }}
                    onFocus={() => setPreview(category.id)}
                    onClick={() => {
                      setSelected((current) => (current === category.id ? null : category.id));
                      // Touch has no hover to return from; what was tapped is what stays shown.
                      setPreview(null);
                    }}
                  >
                    <span>{t(category.id)}</span>
                    <i className="world__marker" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <nav className="world__switcher world__reveal" aria-label={t("categoriesLabel")}>
            {([-1, 1] as const).map((direction) => (
              <Button
                key={direction}
                variant="outline"
                showArrow={false}
                aria-label={t(direction === -1 ? "previousProduct" : "nextProduct")}
                aria-controls="world-title"
                onClick={() => switchProduct(direction)}
              >
                <ArrowIcon className={direction === -1 ? "world__previous" : ""} />
              </Button>
            ))}
          </nav>
        </div>
        <div className="world__loading" role="status" aria-live="polite" data-lenis-prevent>
          <div className="world__loading-progress">
            <span>
              {status === "loading"
                ? t("loading")
                : status === "ready"
                  ? t("ready")
                  : t("fallback")}
            </span>
            {status === "loading" && (
              <span aria-hidden="true">{progress.toString().padStart(2, "0")}%</span>
            )}
            {status === "loading" && <i style={{ transform: `scaleX(${progress / 100})` }} />}
          </div>
        </div>
        <footer className="world__footer">
          <p>{t("distribution")}</p>
          <p>
            {t("noteLead")} <span className="world__note-end">{t("noteEnd")}</span>
          </p>
        </footer>
      </section>
      <WorldOrbit
        sectionRef={orbit}
        activeFilm={activeFilm}
        paused={filmsPaused}
        onSelect={(index) => {
          if (status === "ready" && journey.current && hero.current) {
            scrollToWorldFilm(journey.current, hero.current, index);
          } else {
            activeFilmRef.current = index;
            setActiveFilm(index);
          }
        }}
        onTogglePlayback={() => {
          const paused = !filmsPaused;
          filmsPausedRef.current = paused;
          setFilmsPaused(paused);
          scene.current?.setFilmsPaused(paused);
        }}
      />
    </div>
  );
}
