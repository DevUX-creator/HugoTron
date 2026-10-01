"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  type ReactElement,
} from "react";
import { waitForPageReveal } from "@/lib/pageReveal";
import { useReducedMotion } from "@/lib/useReducedMotion";
import "./copy.css";

type ChildProps = { ref?: React.Ref<HTMLElement>; className?: string };

type CopyProps = {
  children: ReactElement<ChildProps>;
  eager?: boolean;
  delay?: number;
  start?: string;
};

/** Poleum About's masked line entrance, shared by headings and body copy. */
export default function Copy({ children, eager = false, delay = 0, start = "top 90%" }: CopyProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reveal = () => el.classList.remove("reveal-pending");
    if (reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reveal();
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    let observer: IntersectionObserver | undefined;
    // This timer guards setup only. Off-screen tweens must wait for their trigger.
    const failsafe = window.setTimeout(reveal, 1500);

    const run = async () => {
      try {
        const { gsap, SplitText, registerGsapPlugins } = await import("@/lib/gsap");
        registerGsapPlugins();
        await document.fonts.ready;
        await waitForPageReveal();
        if (cancelled) return;

        const splitter = SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          aria: "none",
          onSplit: (self) =>
            gsap.fromTo(
              self.lines,
              { yPercent: 105 },
              {
                yPercent: 0,
                duration: 0.95,
                delay,
                stagger: 0.09,
                ease: "power3.out",
                ...(eager ? {} : { scrollTrigger: { trigger: el, start, once: true } }),
              },
            ),
        });
        cleanup = () => splitter.revert();
        window.clearTimeout(failsafe);
        reveal();
      } catch {
        cleanup?.();
        reveal();
      }
    };

    if (eager) void run();
    else {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            void run();
          }
        },
        { rootMargin: "20%" },
      );
      observer.observe(el);
    }

    return () => {
      cancelled = true;
      window.clearTimeout(failsafe);
      observer?.disconnect();
      cleanup?.();
    };
  }, [eager, delay, start, reduced]);

  // Server-rendered children can arrive as lazy RSC values. React's Children
  // API resolves them before validation, so server and client both attach the
  // same pending class. Checking the unresolved value skipped it during SSR.
  const resolved = Children.toArray(children);
  const child = resolved[0];
  if (resolved.length !== 1 || !isValidElement<ChildProps>(child)) return <>{children}</>;

  // The ref is forwarded to the actual element, never read during render.
  // eslint-disable-next-line react-hooks/refs
  return cloneElement(child, {
    ref,
    className: [child.props.className, "reveal-pending"].filter(Boolean).join(" "),
  });
}
