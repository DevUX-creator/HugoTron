"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import ArrowLink from "@/components/ui/ArrowLink";
import { getCategory, getProduct } from "@/commerce/catalogue";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { ORIGINS, type Origin } from "@/content/origins";
import OriginsMap from "./OriginsMap";
import "./origins.css";

const CYCLE_MS = 4800;

/**
 * Where it comes from: the scene's light streams continue as routes from each origin to the
 * Hamburg warehouse. The map cycles through origins on its own until the visitor picks one.
 */
export default function Origins({ shown }: { shown?: boolean } = {}) {
  const t = useTranslations("origins");
  const world = useTranslations("world");
  const names = useTranslations("products");
  const units = useTranslations("units");
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(ORIGINS[0]!.id);
  const [revealed, setRevealed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [chosen, setChosen] = useState(false);
  // On a pinned stage the parent says when the map is on screen; on a page, the viewport does.
  const onScreen = shown ?? visible;
  const opened = shown ?? revealed;
  const origin = ORIGINS.find((item) => item.id === active) ?? ORIGINS[0]!;
  const category = getCategory(origin.category);
  const country = (item: Origin) => t(`countries.${item.country}`);
  const label = (item: Origin) => `${country(item)} · ${world(item.category)}`;

  useEffect(() => {
    const element = section.current;
    if (!element || shown !== undefined) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry?.isIntersecting ?? false;
        setVisible(inView);
        if (inView) setRevealed(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [shown]);

  // Tour the origins while in view, until the visitor takes over.
  useEffect(() => {
    if (!onScreen || chosen || reduced) return;
    const timer = window.setInterval(() => {
      setActive((current) => {
        const index = ORIGINS.findIndex((item) => item.id === current);
        return ORIGINS[(index + 1) % ORIGINS.length]!.id;
      });
    }, CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [onScreen, chosen, reduced]);

  const choose = (id: string) => {
    setChosen(true);
    setActive(id);
  };

  return (
    <section ref={section} className="origins" aria-labelledby="origins-title">
      <div className="origins__copy">
        <p className="origins__eyebrow">{t("eyebrow")}</p>
        <h2 id="origins-title" className="origins__title">
          <span>{t("titleLead")}</span>
          <span>{t("titleAccent")}</span>
        </h2>
        <p className="origins__lead">{t("lead")}</p>
        <ul className="origins__list" aria-label={t("listLabel")}>
          {ORIGINS.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                aria-pressed={item.id === active}
                data-cursor="wrap"
                onClick={() => choose(item.id)}
                onPointerEnter={(event) => {
                  if (event.pointerType !== "touch") choose(item.id);
                }}
                onFocus={() => choose(item.id)}
              >
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                {country(item)}
                <small>{world(item.category)}</small>
              </button>
            </li>
          ))}
        </ul>
        <div className="origins__detail" aria-live="polite">
          <p className="origins__route">{t("route", { country: country(origin) })}</p>
          <ul className="origins__products">
            {origin.products.map((slug) => {
              const product = getProduct(slug);
              return product ? (
                <li key={slug}>
                  {names(slug)}
                  <span>{units(product.unit)}</span>
                </li>
              ) : null;
            })}
          </ul>
          {category && (
            <ArrowLink href={category.href} prefetch={false} variant="glass">
              {world("explore", { category: world(category.id) })}
            </ArrowLink>
          )}
        </div>
      </div>
      <OriginsMap
        origins={ORIGINS}
        active={active}
        revealed={opened}
        reduced={reduced}
        onSelect={choose}
        labelFor={label}
      />
    </section>
  );
}
