"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Lenis from "lenis";
import { useParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import { gsap, ScrollTrigger, registerGsapPlugins } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Typed access to the Lenis instance.
 *
 * The reference project leaked this through an untyped `window.__lenis` global
 * so its menu could freeze the page. Context instead: typed, testable, and it
 * disappears cleanly when the provider unmounts.
 */
const LenisContext = createContext<Lenis | null>(null);

export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

/** Freeze/unfreeze page scroll — for modal and menu overlays. */
export function useScrollLock(): { lock: () => void; unlock: () => void } {
  const lenis = useLenis();
  return {
    lock: () => lenis?.stop(),
    unlock: () => lenis?.start(),
  };
}

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const pathname = usePathname();
  const params = useParams();
  const route = `${pathname}:${JSON.stringify(params)}`;
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  /* Restarts the frame loop for a scroll nobody asked for with an input event
     — see the note beside `wake` below. */
  const wakeRef = useRef<(() => void) | null>(null);

  useIsomorphicLayoutEffect(() => {
    registerGsapPlugins();

    /* Reduced motion: no smooth scroll at all, native scrolling only. */
    if (reduced) return;

    /* `resize` IS IN THIS LIST, and leaving it out was a real bug.
       GSAP's default set includes it; written out without it, ScrollTrigger
       never re-measured when the viewport changed size — and on a phone the
       viewport changes size constantly, because the browser's own toolbar
       retracts as you scroll down and comes back as you scroll up.

       Every start and end in this page is expressed against the viewport
       ("top 96%", "top 55%"), so all of them move when its height does, while
       the cached scroll positions behind them do not. Measured here, a 90px
       change — the height of a mobile toolbar — put the cards' arrival 300px
       away from where it belonged. That is most of a scrub window, which is why
       the corridor read correctly on the first pass and then wrongly on every
       one after it: the first pass happened before the toolbar moved.

       Nothing on this page is PINNED by ScrollTrigger — the sticky stages are
       CSS — so a refresh here only re-measures. There are no pin spacers to
       jump. */
    ScrollTrigger.config({
      autoRefreshEvents: "visibilitychange,DOMContentLoaded,load,resize",
    });

    const instance = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
    });

    lenisRef.current = instance;
    setLenis(instance);

    instance.on("scroll", ScrollTrigger.update);

    gsap.ticker.lagSmoothing(0);

    /* The ticker SLEEPS when nothing is moving.
       Driving `instance.raf` off the ticker unconditionally is the obvious
       reading of the Lenis docs, and it is what this did — but the ticker then
       runs a rAF for the whole life of the page, at the display's refresh rate,
       whether or not anything is scrolling. Measured against this page that was
       the single largest idle cost: ~10% of a renderer core, permanently, on a
       page sitting still with the WebGL scene already paused. The same page
       under `prefers-reduced-motion`, where none of this runs, idles at 1%.
       Almost none of it is script — it is the layout and compositing work a
       live frame loop pulls in behind it.

       So: attach on anything that can START a scroll, and detach once Lenis
       reports it has settled. `isScrolling` covers both its own smooth
       animation and native scrolling, so the loop stays attached for exactly
       as long as there is something to interpolate.

       The wake events are USER INPUT only, deliberately. Listening for
       `scroll` would look more thorough and would in fact pin the loop on
       forever: Lenis scrolls the window itself, so its own frames would keep
       re-waking it. Programmatic scrolls are woken at their call site
       instead — see the navigation effect below. */
    let idleFrames = 0;
    let attached = false;

    const raf = (time: number) => {
      instance.raf(time * 1000);
      if (instance.isScrolling) {
        idleFrames = 0;
        return;
      }
      /* ENTRANCE ANIMATIONS RIDE THIS SAME TICKER, and they are not scrolling.
         Detaching on idle alone put the loop to sleep about a third of a second
         after mount — mid-way through the hero's reveal — and left the copy
         frozen at whatever opacity it had reached. On the home page that was
         the eyebrow at 11% and the lead paragraph at 0: invisible text, on the
         page's most important block, with nothing in the console to show for
         it.

         So idle means nothing is scrolling AND nothing is animating. */
      if (gsap.globalTimeline.getChildren(false, true, false).length > 0) {
        idleFrames = 0;
        return;
      }

      /* A short grace period rather than a single idle frame: Lenis drops
         `isScrolling` the instant its easing lands, and a wheel gesture is a
         burst of events with quiet gaps between them. */
      if (++idleFrames > 20) detach();
    };

    const detach = () => {
      if (!attached) return;
      attached = false;
      gsap.ticker.remove(raf);
    };

    const wake = () => {
      idleFrames = 0;
      if (attached) return;
      attached = true;
      gsap.ticker.add(raf);
    };

    wake();
    wakeRef.current = wake;

    /* `pointerdown` is what covers dragging the native scrollbar, which fires
       no wheel and no key. */
    const WAKE_EVENTS = ["wheel", "touchstart", "touchmove", "pointerdown", "keydown"] as const;
    for (const event of WAKE_EVENTS) window.addEventListener(event, wake, { passive: true });

    /* Recompute pinned/scrubbed triggers when the layout actually changes
       breakpoint. The reference project called window.location.reload() on any
       width change, which threw away application state on a desktop resize. */
    const mm = gsap.matchMedia();
    mm.add(
      {
        isMobile: "(max-width: 47.999rem)",
        isTablet: "(min-width: 48rem) and (max-width: 63.999rem)",
        isDesktop: "(min-width: 64rem)",
      },
      () => {
        ScrollTrigger.refresh();
      },
    );

    /* SplitText rewrites headings and body copy into per-line boxes once the
       webfonts settle, which changes the document's height — and every
       ScrollTrigger start/end was measured against the height BEFORE that.
       One refresh after the fonts land re-measures them all. */
    let refresh = 0;
    void document.fonts?.ready
      .then(() => {
        refresh = requestAnimationFrame(() => ScrollTrigger.refresh());
      })
      .catch(() => {});

    return () => {
      if (refresh) cancelAnimationFrame(refresh);
      for (const event of WAKE_EVENTS) window.removeEventListener(event, wake);
      detach();
      wakeRef.current = null;
      mm.revert();
      instance.destroy();
      lenisRef.current = null;
      setLenis(null);
    };
  }, [reduced]);

  /* On navigation: jump to top before paint, then let ScrollTrigger remeasure
     the new document once. */
  useIsomorphicLayoutEffect(() => {
    wakeRef.current?.();
    lenisRef.current?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
  }, [route]);

  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [route]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
