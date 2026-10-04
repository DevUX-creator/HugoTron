/**
 * Typefaces.
 *
 * TWO FAMILIES, PROPERLY SEPARATED AGAIN. Geist carries body, UI and numerals;
 * **Mersad** carries titles. The display/sans split had been kept in the tokens
 * while both resolved to Geist precisely so that this change would be one file
 * — and it was: nothing in the CSS moved.
 *
 * Mersad ships as a VARIABLE font, 100–900 on one `wght` axis, so the whole
 * range costs a single 71 KB request. The nine static weights in the supplied
 * package would have been ~38 KB each; two of them alone cost more than all
 * nine do this way, and there is no cut-off to design around.
 *
 * Converted from the package's `Variable TT/Mersad.ttf` to woff2 (45% of the
 * size, same outlines). The source archive is not kept in the repository.
 */
import localFont from "next/font/local";
import { Geist, Geist_Mono } from "next/font/google";

const sans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-src",
});

const display = localFont({
  src: [
    {
      path: "../fonts/Mersad-Variable.woff2",
      /* The full axis, declared as a range. A single entry with
         `weight: "100 900"` is what tells the browser this file answers every
         weight — list it as one number and every other weight is synthesised,
         which is the exact fake-bold the design system forbids. */
      weight: "100 900",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-display-src",
  /* Geist as the fallback, so a title that renders before Mersad arrives is
     metrically close rather than jumping from a system serif. */
  fallback: ["Geist", "system-ui", "sans-serif"],
  /* Titles are the largest type on the page, so a reflow when the face swaps
     is the most visible one there is. `adjustFontFallback` is off because the
     fallback is already declared above; Next's own metric override fights it. */
  adjustFontFallback: false,
});

const mono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-src",
});

export const fontVariables = `${sans.variable} ${display.variable} ${mono.variable}`;
