"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getCategory } from "@/commerce/catalogue";
import { useReducedMotion } from "@/lib/useReducedMotion";
import SplitWords, { flySeed } from "@/animations/SplitWords";
import EnquireLink from "@/components/commerce/products/EnquireLink";
import type { ProductChoice } from "@/components/commerce/products/useProductChoice";
import WorldPurchase from "@/sections/World/WorldPurchase";
import { useToneFill } from "@/sections/Daylight/useToneFill";
import type { CategoryStory } from "@/content/categoryStories";
import { CATEGORY_SCENES, type CategoryHeroScene } from "./scenes";

/** Scroll, in viewport heights, held by the hero: the opening, the quantity step, the hand-off. */
const RUNWAY = 3.2;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
};
const fly = (index: number) => ({ "--r": flySeed(index, 7).toFixed(3) }) as CSSProperties;

/**
 * The range's world, held in place while its copy changes, as on the home: the ingredient at the
 * centre of its 3D setup, first with the page's h1, then with "every quantity" and a way to buy
 * or enquire. The paper then rises, the trails run hot and the copy flies away.
 */
export default function CategoryHero({ story }: { story: CategoryStory }) {
  const t = useTranslations("category");
  const copy = useTranslations(`category.${story.slug}`);
  const root = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLElement>(null);
  const quantity = useRef<HTMLElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const scene = useRef<CategoryHeroScene | null>(null);
  const motion = useRef({ explore: 0, leave: 0 });
  const reduced = useReducedMotion();
  const preferences = useRef({ reduced });
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [choice, setChoice] = useState<ProductChoice>();
  const { canvas, draw } = useToneFill("--color-world-paper");
  const category = story.catalogue ? getCategory(story.catalogue) : undefined;

  // The 3D loads after the copy, so the h1 and summary never wait for WebGL.
  useEffect(() => {
    const element = mount.current;
    if (!element) return;
    let cancelled = false;
    const fail = () => {
      if (cancelled) return;
      scene.current?.dispose();
      scene.current = null;
      setStatus("unavailable");
    };
    void CATEGORY_SCENES[story.scene]()
      .then((create) => {
        if (cancelled) return;
        try {
          scene.current = create(element, story.specimen, {
            reduced: preferences.current.reduced,
            onReady: () => {
              if (!cancelled) setStatus("ready");
            },
            onError: fail,
          });
          scene.current.setExplore(motion.current.explore);
          scene.current.setLeave(motion.current.leave);
        } catch {
          fail();
        }
      })
      .catch(fail);
    return () => {
      cancelled = true;
      scene.current?.dispose();
      scene.current = null;
    };
  }, [story.scene, story.specimen]);

  useEffect(() => {
    preferences.current = { reduced };
    scene.current?.setReducedMotion(reduced);
  }, [reduced]);

  useEffect(() => {
    const element = root.current;
    const first = intro.current;
    const second = quantity.current;
    if (!element || !first || !second) return;
    const html = document.documentElement;
    let frame = 0;
    let last = -1;
    const update = () => {
      frame = 0;
      const height = element.querySelector<HTMLElement>(".category-world__stage")!.clientHeight;
      const progress = clamp(-element.getBoundingClientRect().top / (height * RUNWAY));
      if (progress === last) return;
      last = progress;
      const introOut = smooth((progress - 0.08) / 0.16);
      const quantityIn = smooth((progress - 0.24) / 0.14);
      const handoff = clamp((progress - 0.72) / 0.28);
      const explore = smooth((progress - 0.1) / 0.36);
      element.style.setProperty("--intro-out", introOut.toFixed(4));
      element.style.setProperty("--quantity-in", quantityIn.toFixed(4));
      element.style.setProperty("--leave", handoff.toFixed(4));
      first.toggleAttribute("inert", introOut > 0.6);
      second.toggleAttribute("inert", quantityIn < 0.4 || handoff > 0.6);
      mount.current?.toggleAttribute("inert", handoff > 0.6);
      motion.current = { explore, leave: handoff };
      scene.current?.setExplore(explore);
      draw.current(handoff);
      scene.current?.setLeave(handoff);
      const light = handoff > 0.91;
      html.dataset.homeTheme = light ? "light" : "dark";
      html.toggleAttribute("data-world-paper", light);
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
      html.dataset.homeTheme = "dark";
      html.removeAttribute("data-world-paper");
    };
  }, [draw]);

  const name = copy("name");
  return (
    <>
      <div ref={root} className="category-world" data-status={status}>
        <div className="category-world__stage">
          <div
            ref={mount}
            className="category-world__scene"
            role="img"
            aria-label={t("sceneLabel", { category: copy("inText") })}
          />
          <div className="category-world__shade" aria-hidden="true" />

          <section ref={intro} className="category-hero" aria-labelledby="category-title">
            <nav className="category-crumbs" aria-label={t("breadcrumbLabel")}>
              <ol>
                <li>
                  <Link href="/">{t("home")}</Link>
                </li>
                <li>
                  <Link href="/range" prefetch={false}>
                    {t("products")}
                  </Link>
                </li>
                <li aria-current="page">{name}</li>
              </ol>
            </nav>
            <div className="category-hero__intro">
              <p className="category-hero__eyebrow">{t("eyebrow")}</p>
              <h1 id="category-title" className="category-hero__title">
                <span>{copy("titleLead")}</span> <span>{copy("titleAccent")}</span>
              </h1>
              <p className="category-hero__lead">
                <span className="category-hero__summary">{copy("lead")}</span>
                <span className="category-hero__short">{copy("shortLead")}</span>
              </p>
            </div>
            <span className="category-hero__scroll" aria-hidden="true">
              {t("scroll")}
            </span>
          </section>

          <section
            ref={quantity}
            className="category-quantity"
            aria-labelledby="category-quantity-title"
          >
            <header className="category-quantity__head">
              <p className="category-hero__eyebrow">
                <SplitWords text={t("quantity.eyebrow")} seed={3} />
              </p>
              <h2 id="category-quantity-title">
                <SplitWords text={t("quantity.title")} seed={5} letters />
              </h2>
              {status === "ready" && !reduced && (
                <div className="category-interaction flies" style={fly(3)}>
                  <button type="button" onClick={() => scene.current?.activate()}>
                    <span aria-hidden="true">+</span>
                    {copy("interaction")}
                  </button>
                  <p>{copy("interactionHint")}</p>
                </div>
              )}
            </header>
            <div className="category-quantity__buy flies" style={fly(1)}>
              {category ? (
                <WorldPurchase category={category} choice={choice} onChoose={setChoice} />
              ) : (
                <div className="world__purchase">
                  <p className="world__product">
                    <span>{name}</span>
                    <span>{t("quantity.onRequest")}</span>
                  </p>
                  <div className="world__actions">
                    <EnquireLink product={null} name={name} size="large" variant="glass" />
                  </div>
                </div>
              )}
            </div>
            <div className="category-quantity__supply flies" style={fly(2)}>
              <p className="category-quantity__supply-title">{t("quantity.supplyTitle")}</p>
              <p>{t("quantity.supplyNote")}</p>
            </div>
          </section>
        </div>
      </div>
      <div ref={canvas} className="daylight__fill" aria-hidden="true" />
    </>
  );
}
