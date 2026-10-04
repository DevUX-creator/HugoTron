"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useLenis, useScrollWake } from "@/components/providers/SmoothScroll";
import FilmPlaylist from "@/components/media/FilmPlaylist";
import RangeProductCard from "@/components/commerce/products/RangeProductCard";
import { RANGE_FILMS, type RangeFilm } from "@/content/rangeFilms";
import { getProducts } from "@/commerce/catalogue";

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const smooth = (value: number) => value * value * (3 - 2 * value);

type Copy = { left: string; right: string; lead: string; eyebrow: string; label: string };

/**
 * A native sticky stage: open the film, hold it full-screen, then reveal the range. A category
 * passes its own film, words and cards; by default it shows the whole catalogue.
 */
export default function RangeReveal({
  films = RANGE_FILMS,
  items,
  copy,
  titleId = "paper-chapter-title",
}: {
  films?: readonly RangeFilm[];
  items?: readonly ReactNode[];
  copy?: Copy;
  titleId?: string;
} = {}) {
  const t = useTranslations("paperChapter");
  const words = copy ?? {
    left: t("splitLeft"),
    right: t("splitRight"),
    lead: t("lead"),
    eyebrow: t("eyebrow"),
    label: t("productsLabel"),
  };
  const cards =
    items ??
    getProducts().map((product, index) => (
      <RangeProductCard key={product.slug} product={product} index={index} />
    ));
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const navigation = useRef<HTMLDivElement>(null);
  const focusProduct = useRef<(index: number) => void>(() => {});
  const moveProducts = useRef<(direction: number) => void>(() => {});
  const lenis = useLenis();
  const wake = useScrollWake();
  const reduced = useReducedMotion();
  const [limits, setLimits] = useState({ start: true, end: false });

  useEffect(() => {
    const element = root.current,
      viewport = stage.current,
      rail = track.current;
    if (!element || !viewport || !rail) return;
    const staticView = reduced || matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pending = 0,
      distance = 0,
      revealTravel = 0,
      horizontal = 0,
      travel = 0,
      margin = 24;
    const scrollToDistance = (next: number) => {
      const top =
        element.getBoundingClientRect().top +
        scrollY +
        revealTravel +
        Math.min(travel, Math.max(0, next));
      if (lenis) {
        wake();
        lenis.scrollTo(top, { duration: 0.9 });
      } else window.scrollTo({ top, behavior: "instant" });
    };
    focusProduct.current = (index) => {
      const item = rail.children[index] as HTMLElement | undefined;
      if (!item) return;
      const box = item.getBoundingClientRect();
      if (box.left >= margin && box.right <= viewport.clientWidth - margin) return;
      if (staticView) item.scrollIntoView({ block: "nearest", inline: "center" });
      else scrollToDistance(viewport.clientWidth + item.offsetLeft);
    };
    moveProducts.current = (direction) => {
      const first = rail.children[0] as HTMLElement | undefined;
      const second = rail.children[1] as HTMLElement | undefined;
      const step =
        first && second ? second.offsetLeft - first.offsetLeft : viewport.clientWidth * 0.7;
      if (staticView) rail.parentElement?.scrollBy({ left: step * direction, behavior: "instant" });
      else scrollToDistance(horizontal + step * direction);
    };
    const sync = () => {
      pending = 0;
      const height = viewport.offsetHeight,
        width = viewport.clientWidth;
      margin = Math.max(24, width * 0.025);
      revealTravel = height * 2.3;
      travel = rail.scrollWidth + margin * 2;
      element.style.setProperty(
        "--range-height",
        `${height + revealTravel + travel + height * 0.25}px`,
      );
      const rect = element.getBoundingClientRect();
      distance = Math.max(0, -rect.top);
      const progress = clamp(distance / Math.max(1, revealTravel));
      horizontal = staticView ? 0 : Math.min(travel, Math.max(0, distance - revealTravel));
      const open = staticView ? 1 : smooth(clamp((progress - 0.04) / 0.6));
      const copy = staticView ? 1 : clamp((progress - 0.74) / 0.16);
      const insetY = (1 - open) * 42;
      element.style.setProperty("--film-inset-x", `${(1 - open) * 50}%`);
      element.style.setProperty("--film-inset-y", `${insetY}%`);
      element.style.setProperty("--word-travel", `${open * width * 0.62}px`);
      element.style.setProperty("--word-opacity", String(1 - smooth(clamp((open - 0.35) / 0.5))));
      element.style.setProperty("--copy-progress", String(copy));
      element.style.setProperty("--frame-progress", String(staticView ? 1 : clamp(progress / 0.2)));
      element.style.setProperty(
        "--products-x",
        `${staticView ? 0 : width + margin - horizontal}px`,
      );
      element.style.setProperty("--intro-x", `${-horizontal}px`);
      element.style.setProperty("--products-progress", String(horizontal / Math.max(1, travel)));
      element.dataset.filmOpen = String(open >= 0.999);
      element.dataset.productsActive = String(staticView || horizontal > 1);
      if (navigation.current) navigation.current.inert = !staticView && horizontal <= 1;
      const nextLimits = { start: horizontal < 1, end: horizontal >= travel - 1 };
      setLimits((previous) =>
        previous.start === nextLimits.start && previous.end === nextLimits.end
          ? previous
          : nextLimits,
      );
      const box = viewport.getBoundingClientRect();
      const header = document.querySelector<HTMLElement>(".header");
      const headerY = header ? header.getBoundingClientRect().top + header.offsetHeight / 2 : 28;
      element.dataset.filmHeader = String(
        box.top + (height * insetY) / 100 <= headerY &&
          box.bottom - (height * insetY) / 100 > headerY,
      );
      element.dataset.enhanced = "true";
    };
    const schedule = () => {
      if (!pending) pending = requestAnimationFrame(sync);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    observer.observe(viewport);
    observer.observe(rail);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    sync();
    return () => {
      cancelAnimationFrame(pending);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      focusProduct.current = () => {};
      moveProducts.current = () => {};
      delete element.dataset.filmHeader;
    };
  }, [reduced, lenis, wake]);

  const lead = words.lead.split(" ");
  return (
    <div className="range-reveal" ref={root}>
      <div className="range-reveal__stage" ref={stage}>
        <h2 className="range-reveal__words" id={titleId}>
          <span className="range-reveal__word range-reveal__word--left">{words.left}</span>
          <span className="range-reveal__word range-reveal__word--right">{words.right}</span>
        </h2>
        <div className="range-reveal__film">
          <FilmPlaylist films={films} />
          <div className="range-reveal__shade" />
        </div>
        <div className="range-reveal__frame" aria-hidden="true">
          <span className="range-reveal__edge range-reveal__edge--top" />
          <span className="range-reveal__edge range-reveal__edge--right" />
          <span className="range-reveal__edge range-reveal__edge--bottom" />
          <span className="range-reveal__edge range-reveal__edge--left" />
          <span className="range-reveal__corner" />
          <p className="range-reveal__eyebrow">{words.eyebrow}</p>
        </div>
        <div className="range-reveal__content">
          <p className="range-reveal__lead">
            {lead.map((word, index) => (
              <Fragment key={`${word}-${index}`}>
                <span
                  className="range-reveal__copy-word"
                  style={{ "--word-order": index / lead.length } as CSSProperties}
                >
                  <span>{word}</span>
                </span>
                {index < lead.length - 1 ? " " : null}
              </Fragment>
            ))}
          </p>
        </div>
        <div className="range-reveal__products" aria-label={words.label}>
          <ol className="range-reveal__track" ref={track}>
            {cards.map((card, index) => (
              <li key={index} onFocusCapture={() => focusProduct.current(index)}>
                {card}
              </li>
            ))}
          </ol>
        </div>
        <div className="range-reveal__navigation" ref={navigation}>
          <button
            type="button"
            disabled={!reduced && limits.start}
            onClick={() => moveProducts.current(-1)}
            aria-label={t("previousProduct")}
          >
            <span aria-hidden="true">←</span>
          </button>
          <span className="range-reveal__rail-progress" aria-hidden="true">
            <span />
          </span>
          <span className="range-reveal__count">{String(cards.length).padStart(2, "0")}</span>
          <button
            type="button"
            disabled={!reduced && limits.end}
            onClick={() => moveProducts.current(1)}
            aria-label={t("nextProduct")}
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
