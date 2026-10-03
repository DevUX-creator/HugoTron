"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "@/lib/useReducedMotion";
import "./mobileStory.css";

const CHAPTERS = ["source", "land", "india", "pakistan", "hamburg"] as const;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

/** One complete mobile composition at a time; scroll moves the whole sheet, not its layers. */
export default function MobileStory() {
  const t = useTranslations("paperStory");
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const stage = element.querySelector<HTMLElement>(".mobile-story__stage")!;
    const panels = Array.from(element.querySelectorAll<HTMLElement>(".mobile-story__panel"));
    const mobile = matchMedia("(width < 48rem)");
    let frame = 0;
    let enhanced = false;
    const states = panels.map(() => "");
    const update = () => {
      frame = 0;
      if (!enhanced || document.hidden) return;
      const height = stage.clientHeight;
      const position = Math.max(
        0,
        Math.min(panels.length - 1, -element.getBoundingClientRect().top / height),
      );
      const index = Math.floor(position);
      const transition = clamp((position - index - 0.65) / 0.35);
      const outgoing = ease(transition * 2);
      const incoming = ease(transition * 2 - 1);
      panels.forEach((panel, i) => {
        const opacity = i === index ? 1 - outgoing : i === index + 1 ? incoming : 0;
        const y = i === index ? outgoing * -22 : i === index + 1 ? (1 - incoming) * 28 : 28;
        const state = `${opacity.toFixed(3)},${y.toFixed(2)}`;
        if (states[i] === state) return;
        states[i] = state;
        panel.style.opacity = opacity.toFixed(3);
        panel.style.transform = `translate3d(0,${y.toFixed(2)}px,0)`;
        const shown = opacity > 0;
        if (panel.dataset.shown !== String(shown)) {
          panel.dataset.shown = String(shown);
          panel.setAttribute("aria-hidden", String(!shown));
        }
      });
    };
    const schedule = () => {
      if (enhanced && !frame) frame = requestAnimationFrame(update);
    };
    const configure = () => {
      enhanced = mobile.matches && !reduced;
      element.dataset.enhanced = String(enhanced);
      states.fill("");
      if (enhanced) update();
      else
        panels.forEach((panel) => {
          panel.style.removeProperty("opacity");
          panel.style.removeProperty("transform");
          panel.removeAttribute("aria-hidden");
          delete panel.dataset.shown;
        });
    };
    configure();
    const resize = new ResizeObserver(schedule);
    resize.observe(stage);
    mobile.addEventListener("change", configure);
    window.addEventListener("scroll", schedule, { passive: true });
    document.addEventListener("visibilitychange", schedule);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mobile.removeEventListener("change", configure);
      window.removeEventListener("scroll", schedule);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [reduced]);

  return (
    <div ref={root} className="mobile-story">
      <div className="mobile-story__stage">
        {CHAPTERS.map((chapter) => (
          <section
            key={chapter}
            className="mobile-story__panel"
            data-mobile-chapter={chapter}
            aria-labelledby={`mobile-story-${chapter}`}
          >
            <header>
              <p className="paper-caption">{t(`mobile.${chapter}.eyebrow`)}</p>
              <h2 id={`mobile-story-${chapter}`}>{t(`mobile.${chapter}.title`)}</h2>
              <p className="mobile-story__note">{t(`mobile.${chapter}.note`)}</p>
            </header>
            <div className={`mobile-story__art mobile-story__art--${chapter}`} aria-hidden="true">
              {chapter === "source" && (
                <>
                  <Art name="source-column" className="mobile-story__column" />
                  <Art
                    name="source-column"
                    className="mobile-story__column mobile-story__column--right"
                  />
                  <Art name="mountains" className="mobile-story__source-horizon" />
                  <Art name="source-cloud" className="mobile-story__cloud" />
                  <Art name="source-cloud" className="mobile-story__cloud--low" />
                </>
              )}
              {chapter === "land" && (
                <>
                  <Art name="mountains" className="mobile-story__mountains" />
                  <Art name="field" className="mobile-story__field" />
                  <Art name="growers" className="mobile-story__growers" />
                  <Art name="rice" className="mobile-story__field-rice" />
                </>
              )}
              {chapter === "india" && (
                <>
                  <Art name="rice" className="mobile-story__rice" />
                  <Art name="sacks" className="mobile-story__sacks" />
                  <Art name="mountains" className="mobile-story__rice-horizon" />
                </>
              )}
              {chapter === "pakistan" && (
                <>
                  <Art name="origins" className="mobile-story__island" />
                  <Art name="source-cloud" className="mobile-story__island-cloud" />
                  <Art name="rice" className="mobile-story__island-rice" />
                </>
              )}
              {chapter === "hamburg" && (
                <>
                  <Art name="hamburg" className="mobile-story__harbour" />
                  <Art name="gulls" className="mobile-story__gulls" />
                </>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Art({ name, className = "" }: { name: string; className?: string }) {
  return (
    <div className={`mobile-story__image ${className}`}>
      <Image
        src={`/images/paper-world/${name}.webp`}
        alt=""
        fill
        sizes="(max-width: 767px) 80vw, 1px"
      />
    </div>
  );
}
