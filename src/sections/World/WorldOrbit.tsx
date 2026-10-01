"use client";

import { useTranslations } from "next-intl";
import type { CSSProperties, RefObject } from "react";
import Image from "next/image";
import ArrowLink from "@/components/ui/ArrowLink";
import Button from "@/components/ui/Button";
import { WORLD_FILMS } from "@/content/worldFilms";
import SplitWords, { flySeed } from "@/animations/SplitWords";
import "./worldOrbit.css";

type WorldOrbitProps = {
  sectionRef: RefObject<HTMLElement | null>;
  activeFilm: number;
  paused: boolean;
  onSelect: (index: number) => void;
  onTogglePlayback: () => void;
};

/** Per-element seed for the fly away that ends the journey (see animations/flyAway.css). */
const fly = (index: number) => ({ "--r": flySeed(index, 7).toFixed(3) }) as CSSProperties;

export default function WorldOrbit({
  sectionRef,
  activeFilm,
  paused,
  onSelect,
  onTogglePlayback,
}: WorldOrbitProps) {
  const t = useTranslations("world.orbit");
  const film = WORLD_FILMS[activeFilm] ?? WORLD_FILMS[0]!;
  const copy = `films.${film.id}` as const;
  return (
    <section ref={sectionRef} className="world-orbit" aria-labelledby="world-orbit-title">
      <div className="world-orbit__viewport">
        <div className="world-orbit__poster" aria-hidden="true" />
        <div className="world-orbit__film-poster flies" style={fly(0)}>
          <Image src={film.poster} alt={t(`${copy}.alt`)} width={960} height={600} unoptimized />
        </div>
        <header className="world-orbit__heading">
          <div className="world-orbit__film-copy" aria-live="polite" aria-atomic="true">
            <p className="world-orbit__eyebrow">
              <SplitWords text={t("eyebrow")} seed={1} />
            </p>
            <h2 id="world-orbit-title">
              <span>
                <SplitWords
                  seed={2}
                  text={
                    film.id === "rice-fields" ? t("titleLead") : t(`films.${film.id}.titleLead`)
                  }
                />
              </span>
              <span>
                <SplitWords
                  seed={3}
                  text={
                    film.id === "rice-fields" ? t("titleAccent") : t(`films.${film.id}.titleAccent`)
                  }
                />
              </span>
            </h2>
            <p className="world-orbit__lead">
              <SplitWords
                seed={4}
                text={film.id === "rice-fields" ? t("lead") : t(`films.${film.id}.lead`)}
              />
            </p>
          </div>
          <div className="world-orbit__film-controls">
            <nav className="world-orbit__film-select" aria-label={t("filmsLabel")}>
              {WORLD_FILMS.map((item, index) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  showArrow={false}
                  className="world-orbit__film-button flies"
                  style={fly(5 + index)}
                  aria-pressed={activeFilm === index}
                  onClick={() => onSelect(index)}
                >
                  {t(`films.${item.id}.label`)}
                </Button>
              ))}
            </nav>
            <Button
              variant="ghost"
              showArrow={false}
              className="world-orbit__film-pause flies"
              style={fly(9)}
              onClick={onTogglePlayback}
              aria-label={paused ? t("playFilm") : t("pauseFilm")}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d={paused ? "m6 4 10 6-10 6z" : "M6 4h2v12H6zm6 0h2v12h-2z"} />
              </svg>
            </Button>
          </div>
        </header>
        <div className="world-orbit__foot">
          <div className="world-orbit__note flies" style={fly(10)}>
            <p>{t("note")}</p>
          </div>
          <ArrowLink
            href="/range"
            prefetch={false}
            variant="glass"
            className="flies"
            style={fly(11)}
          >
            {t("action")}
          </ArrowLink>
        </div>
      </div>
    </section>
  );
}
