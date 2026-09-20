/**
 * Typefaces.
 *
 * Geist is the main face — body, UI, numerals AND titles. It carries a full
 * weight range, so hierarchy comes from weight, size and tracking rather than
 * from a second family.
 *
 * The display/sans split is kept in the tokens even though both currently
 * resolve to Geist: if a distinct display face is introduced later, only
 * `display` below changes and no CSS moves. theme.css reads both through the
 * `-src` indirection so it never imports from the framework.
 */
import { Geist, Geist_Mono } from "next/font/google";

export const sans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-src",
});

/* Same family for now — see the note above. */
export const display = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display-src",
});

export const mono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-src",
});

export const fontVariables = `${sans.variable} ${display.variable} ${mono.variable}`;
