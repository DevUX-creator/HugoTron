import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

let registered = false;

/**
 * Register GSAP plugins exactly once per session.
 *
 * Call this inside an effect in a client component — never at module scope.
 * The module statically imports GSAP, so importing it from a server component
 * would pull the library into the server bundle.
 */
export function registerGsapPlugins(): void {
  if (registered) return;
  gsap.registerPlugin(ScrollTrigger, SplitText);

  /* Transform-based pinning creates a containing block, which breaks the
     position: fixed header. Pin with fixed positioning instead. */
  ScrollTrigger.defaults({ pinType: "fixed" });

  registered = true;
}

/** True when the user has asked the OS to reduce motion. SSR-safe. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, ScrollTrigger, SplitText };
