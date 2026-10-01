import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";

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
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);

  /* "hop" — the slider's signature curve: almost all of the distance covered
     early, then a long, decelerating settle. Registered here so it is defined
     exactly once and any component can name it as a string. */
  CustomEase.create("hop", "M0,0 C0.071,0.505 0.192,0.726 0.318,0.852 0.45,0.984 0.504,1 1,1");

  /* Transform-based pinning creates a containing block, which breaks the
     position: fixed header. Pin with fixed positioning instead. */
  ScrollTrigger.defaults({ pinType: "fixed" });

  registered = true;
}

export { gsap, ScrollTrigger, SplitText };
