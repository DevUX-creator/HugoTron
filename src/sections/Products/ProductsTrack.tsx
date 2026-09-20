"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** How many times the set repeats, so the wrap never shows an end. */
const COPIES = 3;
/** Idle drift, px per second. */
const DRIFT_SPEED = 38;
/** How fast the drift SPEED eases; low values coast rather than cut. */
const DRIFT_EASE = 0.035;

type ProductsTrackProps = {
  children: ReactNode;
  /** Announced to assistive tech, which gets the static list instead. */
  label: string;
};

/**
 * An endless row that drifts on its own and holds still under the pointer.
 *
 * ADAPTED FROM POLEUM'S MARKETS TRACK, with two deliberate differences:
 *
 *   · THE SPEED IS EASED, NOT SWITCHED — the one thing worth copying exactly.
 *     Easing the drift VELOCITY rather than the position is what makes it spin
 *     up and coast down on hover instead of cutting in and out.
 *   · NO DRAG, AND THAT IS THE DIFFERENCE. Poleum's track carries photographs,
 *     so a drag costs nothing. Every card here holds a stepper and a button,
 *     and a drag that begins on a control either swallows the click or fires
 *     it at the end of a throw. A row you cannot press is worse than a row you
 *     cannot fling.
 *
 * The loop runs ONLY while the row is on screen and only while it is moving:
 * a permanent rAF is sixty no-op wake-ups a second for a reader three screens
 * away, and it is also what put the hero's own ticker to sleep mid-animation
 * (see SmoothScroll).
 *
 * Positions are written straight to the DOM inside one rAF — nothing goes
 * through React state, so no frame causes a re-render.
 */
export default function ProductsTrack({ children, label }: ProductsTrackProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let currentX = 0;
    let driftVel = 0;
    let wanted = true;
    let visible = false;
    let running = false;
    let lastFrame = 0;
    let raf = 0;

    /** One full set, SUMMED from the DOM — the cards do not share a width. */
    const sequenceWidth = () => {
      const sets = track.querySelectorAll<HTMLElement>(".ptrack__set");
      return sets[0] ? sets[0].getBoundingClientRect().width : 0;
    };

    let seq = sequenceWidth();

    const frame = (now: number) => {
      const dt = lastFrame ? Math.min((now - lastFrame) / 1000, 0.1) : 0;
      lastFrame = now;

      driftVel += ((wanted ? DRIFT_SPEED : 0) - driftVel) * DRIFT_EASE;
      currentX -= driftVel * dt;

      /* Wrap by exactly one set, so the seam lands where the sets repeat. */
      if (seq > 0 && currentX <= -seq) currentX += seq;

      track.style.transform = `translate3d(${currentX.toFixed(2)}px,0,0)`;

      /* Stop once it has actually come to rest, not the moment the pointer
         arrives — otherwise the coast-down never gets to play. */
      if (!wanted && Math.abs(driftVel) < 0.05) {
        running = false;
        return;
      }
      if (running) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || !visible) return;
      running = true;
      /* A fresh first frame: the gap since the last one was time spent off
         screen or at rest, and `dt` must not try to catch up on it. */
      lastFrame = 0;
      raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible) start();
        else stop();
      },
      { threshold: 0 },
    );
    observer.observe(root);

    const hold = () => {
      wanted = false;
      start();
    };
    const release = () => {
      wanted = true;
      start();
    };

    root.addEventListener("pointerenter", hold);
    root.addEventListener("pointerleave", release);
    /* Keyboard users tab INTO a card; the row must hold still for them too. */
    root.addEventListener("focusin", hold);
    root.addEventListener("focusout", release);

    const onResize = () => {
      seq = sequenceWidth();
    };
    window.addEventListener("resize", onResize);

    return () => {
      observer.disconnect();
      stop();
      root.removeEventListener("pointerenter", hold);
      root.removeEventListener("pointerleave", release);
      root.removeEventListener("focusin", hold);
      root.removeEventListener("focusout", release);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="ptrack" ref={rootRef} aria-label={label} role="group">
      <div className="ptrack__rail" ref={trackRef}>
        {Array.from({ length: COPIES }, (_, i) => (
          <div
            key={i}
            className="ptrack__set"
            /* Only the first set is the real list; the copies exist to fill
               the wrap and would otherwise be read out three times. */
            aria-hidden={i > 0 ? true : undefined}
            {...(i > 0 ? { inert: true } : {})}
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
