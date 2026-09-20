"use client";

import { waitForPageReveal } from "@/lib/pageReveal";

import { cloneElement, useEffect, useRef, type ReactElement } from "react";
import "./copy.css";

type ChildProps = { ref?: React.Ref<HTMLElement>; className?: string };

type CopyProps = {
  /** A single element — a paragraph or block of body copy. Cloned so SplitText
      operates on the real element, which keeps line metrics honest. */
  children: ReactElement<ChildProps>;
  eager?: boolean;
  delay?: number;
};

/**
 * Line-by-line masked reveal for body copy: lines rise out from behind a clip.
 * See docs/ANIMATION.md for the shared wrapper contract.
 */
export default function Copy({ children, eager = false, delay = 0 }: CopyProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reveal = () => el.classList.remove("reveal-pending");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reveal();
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    const failsafe = window.setTimeout(reveal, 1200);

    const run = async () => {
      const { gsap, SplitText, ScrollTrigger, registerGsapPlugins } = await import("@/lib/gsap");
      if (cancelled) return;
      registerGsapPlugins();

      /* Split only once webfonts have settled, otherwise words are measured
         against the fallback face and jump when Nasalization swaps in. */
      try {
        await document.fonts.ready;
        await waitForPageReveal();
      } catch {
        /* Font Loading API unavailable — proceed with fallback metrics. */
      }
      /* Turkish lines are longer and wrap differently; give layout one frame to
         settle before measuring line boxes. */
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (cancelled) return;

      const splitter = new SplitText(el, {
        type: "lines",
        mask: "lines",
        linesClass: "split-line",
        /* SplitText's default puts an `aria-label` on the split element and
           hides the lines — fine on a heading, prohibited on a paragraph
           (axe: aria-prohibited-attr). With nothing added, a screen reader
           reads the lines as the text they are. */
        aria: "none",
      });

      const tween = gsap.fromTo(
        splitter.lines,
        { yPercent: 100, autoAlpha: 0 },
        {
          yPercent: 0,
          autoAlpha: 1,
          duration: 1,
          delay,
          stagger: 0.1,
          ease: "power3.out",
          ...(eager ? {} : { scrollTrigger: { trigger: el, start: "top 90%", once: true } }),
        },
      );

      window.clearTimeout(failsafe);
      reveal();

      cleanup = () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        splitter.revert();
        ScrollTrigger.refresh();
      };
    };

    if (eager) {
      void run();
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer.disconnect();
            void run();
          }
        },
        { rootMargin: "200px" },
      );
      observer.observe(el);
      cleanup = () => observer.disconnect();
    }

    return () => {
      cancelled = true;
      window.clearTimeout(failsafe);
      cleanup?.();
    };
  }, [eager, delay]);

  /* React 19 treats ref as an ordinary prop and we only forward the object —
     `.current` is never read during render. The rule cannot tell forwarding
     from reading, and SplitText must receive the real element. */
  // eslint-disable-next-line react-hooks/refs
  return cloneElement(children, {
    ref,
    className: [children.props.className, "reveal-pending"].filter(Boolean).join(" "),
  });
}
