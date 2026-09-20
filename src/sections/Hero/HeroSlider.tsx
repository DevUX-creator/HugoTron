"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useScrollWake } from "@/components/providers/SmoothScroll";
import "./heroSlider.css";

/** Alt text arrives resolved: the slide list is data, and message keys are
 *  typed against the catalogue, so they cannot be carried as loose strings. */
export type Slide = { src: string; alt: string };

type HeroSliderProps = {
  slides: Slide[];
  /** Labels for the two transport controls. */
  pauseLabel: string;
  playLabel: string;
  /** Milliseconds each slide holds before advancing. */
  interval?: number;
};

/**
 * The hero's media, as a slider.
 *
 * Mechanic taken from the reference in ExampleSlider.zip, scaled to a smaller
 * block. Three parts make it read the way it does:
 *
 *   1. The INCOMING slide is revealed by a `clip-path` opening from the edge
 *      it arrives on, rather than fading or sliding as a whole.
 *   2. Inside that clip the image travels the OPPOSITE way, from an offset
 *      back to zero. The two motions against each other are what give the
 *      transition its depth — a single slide looks flat beside it.
 *   3. Both run on the "hop" ease (see lib/gsap): nearly all the distance
 *      covered early, then a long settle.
 *
 * The travel is a share of the block's own width, not the reference's flat
 * 500px, so the effect keeps its proportions in a panel this size.
 *
 * Slides are stacked and only the top one animates; the rest sit beneath at
 * rest, so there is nothing to clean up and no growing DOM.
 */
export default function HeroSlider({
  slides,
  pauseLabel,
  playLabel,
  interval = 6000,
}: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  const stageRef = useRef<HTMLDivElement>(null);
  const animating = useRef(false);
  const wakeScroll = useScrollWake();

  const total = slides.length;

  const goTo = useCallback(
    (next: number) => {
      const stage = stageRef.current;
      if (!stage || next === index || animating.current) return;

      const direction = next > index ? "right" : "left";
      setIndex(next);

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      animating.current = true;
      /* The frame loop sleeps when idle; an autoplay tick is not user input,
         so it has to be woken or the transition never runs. */
      wakeScroll();

      void (async () => {
        const { gsap } = await import("@/lib/gsap");
        const slideEls = stage.querySelectorAll<HTMLElement>(".hero-slider__slide");
        const incoming = slideEls[next];
        const outgoing = slideEls[index];
        if (!incoming || !outgoing) {
          animating.current = false;
          return;
        }

        /* A share of the block, not a fixed pixel count. */
        const travel = stage.clientWidth * 0.28;
        const from = direction === "right" ? travel : -travel;

        const closed =
          direction === "right"
            ? "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)"
            : "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)";

        gsap.set(incoming, { zIndex: 2, autoAlpha: 1 });
        gsap.set(outgoing, { zIndex: 1 });

        const tl = gsap.timeline({
          onComplete: () => {
            gsap.set(outgoing, { zIndex: 0, clearProps: "zIndex" });
            animating.current = false;
          },
        });

        tl.fromTo(
          incoming,
          { clipPath: closed },
          { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 1.2, ease: "hop" },
          0,
        )
          .fromTo(
            incoming.querySelector(".hero-slider__img"),
            { x: from },
            { x: 0, duration: 1.2, ease: "hop" },
            0,
          )
          .to(
            outgoing.querySelector(".hero-slider__img"),
            { x: -from * 0.6, duration: 1.2, ease: "hop" },
            0,
          );
      })();
    },
    [index, wakeScroll],
  );

  /* Autoplay. Pauses on the control, and whenever the tab is hidden — a
     timer that keeps firing in a background tab queues transitions that all
     resolve at once when the reader comes back. */
  useEffect(() => {
    if (!playing || total < 2) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      goTo((index + 1) % total);
    }, interval);
    return () => window.clearInterval(id);
  }, [playing, index, total, interval, goTo]);

  return (
    <div className="hero-slider">
      <div className="hero-slider__stage" ref={stageRef}>
        {slides.map((slide, i) => (
          <div
            key={slide.src}
            className="hero-slider__slide"
            style={i === index ? undefined : { visibility: "hidden" }}
            aria-hidden={i === index ? undefined : true}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={i === 0}
              sizes="(width >= 64rem) 58vw, 100vw"
              className="hero-slider__img"
            />
          </div>
        ))}
      </div>

      <div className="hero-slider__rail">
        <ul className="hero-slider__thumbs">
          {slides.map((slide, i) => (
            <li key={slide.src}>
              <button
                type="button"
                className="hero-slider__thumb"
                aria-label={slide.alt}
                aria-current={i === index ? "true" : undefined}
                onClick={() => goTo(i)}
              >
                <Image
                  src={slide.src}
                  alt=""
                  fill
                  sizes="6rem"
                  className="hero-slider__thumb-img"
                />
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="hero-slider__pause"
          aria-label={playing ? pauseLabel : playLabel}
          onClick={() => setPlaying((v) => !v)}
        >
          {playing ? (
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
              <rect x="4" y="3" width="3" height="10" rx="1" />
              <rect x="9" y="3" width="3" height="10" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
              <path d="M5 3.5v9l8-4.5-8-4.5Z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
