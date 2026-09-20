/**
 * Typefaces.
 *
 * ⚠ NOT CHOSEN YET — Dmitrij owns the design decision. These are working
 * placeholders so the scale is legible while sections are built.
 *
 * When the real faces land:
 *  · Keep the two-variable split — `--font-display-src` is TITLES ONLY,
 *    `--font-sans-src` carries body, UI and numerals. theme.css reads both
 *    through an indirection so it never imports from the framework.
 *  · If the display face ships one weight, leave `font-synthesis: none` in
 *    globals.css and drive hierarchy from size, tracking and case instead —
 *    otherwise the browser fakes a bold and it looks it.
 *  · A self-hosted face goes in `src/styles/fonts/` and uses `next/font/local`.
 */
import { Inter, Source_Serif_4 } from "next/font/google";

export const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-src",
});

export const display = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600"],
  variable: "--font-display-src",
});

export const fontVariables = `${sans.variable} ${display.variable}`;
