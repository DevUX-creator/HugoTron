"use client";

import { waitForPageReveal } from "@/lib/pageReveal";

import { useEffect, useRef, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Animate immediately instead of waiting to scroll into view. */
  eager?: boolean;
  /** Seconds of delay before the tween starts. */
  delay?: number;
  className?: string;
};

/**
 * Scroll-reveal for a whole block (a card, an image, a group).
 *
 * Contract shared by every wrapper in this folder — see docs/ANIMATION.md:
 *   1. GSAP is dynamically imported, so it never enters the initial bundle.
 *   2. The element ships with `reveal-pending`, which only hides it when `.js`
 *      is on <html>. Without JavaScript the content stays visible.
 *   3. A failsafe timeout reveals the content if GSAP stalls.
 *   4. Reduced motion short-circuits before GSAP is even fetched.
 *   5. Everything is reverted on unmount.
 *
 * The pending class is removed from the DOM node directly rather than through
 * React state: revealing is a one-way visual transition, and routing it through
 * a re-render would cascade renders for no benefit.
 */
export default function Reveal({ children, eager = false, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

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

    /* Invisible copy is a worse failure than unanimated copy. */
    const failsafe = window.setTimeout(reveal, 1200);

    const run = async () => {
      const { gsap, ScrollTrigger, registerGsapPlugins } = await import("@/lib/gsap");
      if (cancelled || !el) return;
      registerGsapPlugins();
      await waitForPageReveal();
      if (cancelled) return;

      const ctx = gsap.context(() => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 32 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1.2,
            delay,
            ease: "power2.out",
            ...(eager ? {} : { scrollTrigger: { trigger: el, start: "top 85%", once: true } }),
          },
        );
      }, el);

      window.clearTimeout(failsafe);
      reveal();

      cleanup = () => {
        ctx.revert();
        ScrollTrigger.getAll().forEach((trigger) => {
          if (trigger.trigger === el) trigger.kill();
        });
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
        { rootMargin: "150px" },
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

  return (
    <div ref={ref} className={[className, "reveal-pending"].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
