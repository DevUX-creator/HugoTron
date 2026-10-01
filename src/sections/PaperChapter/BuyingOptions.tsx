"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import Copy from "@/animations/Copy";
import ArrowLink from "@/components/ui/ArrowLink";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useChapterSound } from "@/components/sound/useChapterSound";
import StoryImage from "./StoryImage";
import "./buyingOptions.css";

/** The original three buying paths, back in the normal vertical document flow. */
export default function BuyingOptions() {
  const t = useTranslations("homeStory.buying");
  const frame = useRef<HTMLDivElement>(null);
  useChapterSound(frame);
  const reduced = useReducedMotion();

  useEffect(() => {
    const element = frame.current;
    if (!element || reduced) return;
    element.dataset.animated = "true";
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        element.dataset.revealed = "true";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      delete element.dataset.animated;
    };
  }, [reduced]);

  return (
    <section className="buying" id="buying" aria-labelledby="buying-title">
      <div className="buying__frame" ref={frame}>
        <div className="buying__outline" aria-hidden="true">
          {(["top", "right", "bottom", "left"] as const).map((edge) => (
            <span key={edge} className={`buying__edge buying__edge--${edge}`} />
          ))}
          <span className="buying__corner" />
          <span className="buying__corner buying__corner--bottom-left" />
        </div>
        <header className="buying__head">
          <Copy>
            <p className="buying__eyebrow">{t("eyebrow")}</p>
          </Copy>
          <Copy>
            <h2 id="buying-title">{t("title")}</h2>
          </Copy>
        </header>
        <div className="buying__grid">
          <article className="buying__kitchen" aria-labelledby="buying-kitchen-title">
            <StoryImage
              src="/hero/kitchen.png"
              alt={t("imageAlt")}
              sizes="(min-width: 1024px) 56vw, 100vw"
            />
            <div className="buying__photo-copy buying__glass">
              <Copy>
                <h3 id="buying-kitchen-title">{t("kitchenTitle")}</h3>
              </Copy>
              <Copy>
                <p className="buying__body">{t("kitchenBody")}</p>
              </Copy>
              <ArrowLink href="/enquiry">{t("kitchenCta")}</ArrowLink>
            </div>
          </article>
          <div className="buying__paths">
            {(["trade", "home"] as const).map((key) => (
              <article
                className="buying__path buying__glass"
                aria-labelledby={`buying-${key}-title`}
                key={key}
              >
                <Copy>
                  <h3 id={`buying-${key}-title`}>{t(`${key}Title`)}</h3>
                </Copy>
                <Copy>
                  <p className="buying__body">{t(`${key}Body`)}</p>
                </Copy>
                <ArrowLink href={key === "trade" ? "/enquiry" : "/range"}>
                  {t(`${key}Cta`)}
                </ArrowLink>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
