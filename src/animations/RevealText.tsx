"use client";

import { waitForPageReveal } from "@/lib/pageReveal";

import { cloneElement, useEffect, useRef, type ReactElement } from "react";

type ChildProps = { ref?: React.Ref<HTMLElement>; className?: string };

type RevealTextProps = {
  /** A single element — a heading, usually. Cloned so SplitText operates on the
      real element rather than a wrapper div, which keeps line metrics honest. */
  children: ReactElement<ChildProps>;
  eager?: boolean;
  delay?: number;
  /** ScrollTrigger `start`. The default fires as the heading's top passes 85%
      of the viewport, which is right for a heading arriving at the top of a
      block. A heading centred in a viewport-tall hold is already most of a
      screen further down when it reaches that line, so the words are still
      landing when the reader is looking straight at them — those pass a
      later value to begin as the block enters instead. */
  start?: string;
};

/**
 * Word-by-word reveal for headings. See docs/ANIMATION.md for the shared
 * wrapper contract.
 */
export default function RevealText({
  children,
  eager = false,
  delay = 0,
  start = "top 85%",
}: RevealTextProps) {
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
    /* Holds the running tween so the late failsafe below can finish it. */
    let running: { progress: (value: number) => void } | null = null;

    /* Two stages, and the second one matters more than it looks.
       `reveal()` only removes the pending CLASS. Once GSAP has written inline
       opacity on the split lines, that class is no longer what is hiding them
       — so if the tween starts and then stalls, the copy stays invisible with
       the guard already lifted. The second timer jumps the tween to its end
       state, which is the only thing that actually restores the text.
       Unanimated copy is a far better failure than invisible copy. */
    const failsafe = window.setTimeout(reveal, 1200);
    const hardFailsafe = window.setTimeout(() => running?.progress(1), 3000);

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
      if (cancelled) return;

      const splitter = new SplitText(el, { type: "words", wordsClass: "split-word" });

      const tween = gsap.fromTo(
        splitter.words,
        { autoAlpha: 0, y: 40, filter: "blur(12px)" },
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.1,
          delay,
          stagger: 0.08,
          ease: "power3.out",
          ...(eager ? {} : { scrollTrigger: { trigger: el, start, once: true } }),
        },
      );

      running = tween;
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
      /* Wide enough to cover a `start` that fires BEFORE the element enters the
         viewport. This observer decides when GSAP is fetched and the trigger
         built; a heading that wants to begin a quarter of a screen early would
         otherwise have its trigger created after the moment it was meant to
         fire, and would land in one piece instead of word by word. */
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer.disconnect();
            void run();
          }
        },
        { rootMargin: "60%" },
      );
      observer.observe(el);
      cleanup = () => observer.disconnect();
    }

    return () => {
      cancelled = true;
      window.clearTimeout(failsafe);
      window.clearTimeout(hardFailsafe);
      cleanup?.();
    };
  }, [eager, delay, start]);

  /* React 19 treats ref as an ordinary prop and we only forward the object —
     `.current` is never read during render. The rule cannot tell forwarding
     from reading, and SplitText must receive the real element. */
  // eslint-disable-next-line react-hooks/refs
  return cloneElement(children, {
    ref,
    className: [children.props.className, "reveal-pending"].filter(Boolean).join(" "),
  });
}
