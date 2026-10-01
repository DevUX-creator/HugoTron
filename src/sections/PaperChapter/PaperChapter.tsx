"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import Copy from "@/animations/Copy";
import { useChapterSound } from "@/components/sound/useChapterSound";
import BuyingOptions from "./BuyingOptions";
import RangeReveal from "./RangeReveal";
import "./rangeReveal.css";
import "./paperChapter.css";

/** The themed sheet covers the rice scene before its film opens to the viewport. */
export default function PaperChapter() {
  const t = useTranslations("paperChapter");
  const section = useRef<HTMLElement>(null);
  useChapterSound(section);

  useEffect(() => {
    const paper = section.current;
    const opening = paper?.previousElementSibling as HTMLElement | null;
    const header = document.querySelector<HTMLElement>(".header");
    if (!paper) return;
    let frame = 0;
    const sync = () => {
      frame = 0;
      const top = paper.getBoundingClientRect().top;
      const headerMiddle = header
        ? header.getBoundingClientRect().top + header.offsetHeight / 2
        : 28;
      if (top <= headerMiddle) document.documentElement.dataset.homeSurface = "paper";
      else delete document.documentElement.dataset.homeSurface;
      // The covered sticky scene must not retain invisible keyboard targets.
      opening?.toggleAttribute("inert", top <= 0);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(paper);
    if (header) observer.observe(header);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    sync();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      delete document.documentElement.dataset.homeSurface;
      opening?.removeAttribute("inert");
    };
  }, []);

  return (
    <section ref={section} className="paper-chapter" aria-labelledby="paper-chapter-title">
      <div className="paper-chapter__inner">
        <RangeReveal />
        <BuyingOptions />
        <div className="paper-chapter__foot">
          <p>Hugo Tron</p>
          <Copy>
            <p>{t("continued")}</p>
          </Copy>
        </div>
      </div>
    </section>
  );
}
