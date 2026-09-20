import { defineRouting } from "next-intl/routing";

export const locales = ["de", "en"] as const;
export type Locale = (typeof locales)[number];

/** German is the source of truth — the company, its customers and its legal
 *  texts are German. English exists for the export side (private label,
 *  wholesale) and is written for that reader, not translated word for word. */
export const defaultLocale: Locale = "de";

export const localeLabels: Record<Locale, { name: string; short: string; htmlLang: string }> = {
  de: { name: "Deutsch", short: "DE", htmlLang: "de" },
  en: { name: "English", short: "EN", htmlLang: "en" },
};

/**
 * Translated pathname map.
 *
 * Keys are the *internal* route (the folder name under `src/app/[locale]/`).
 * Values are what the visitor sees per locale — an English buyer gets genuinely
 * English URLs rather than German paths with `/en` bolted on.
 *
 * Dynamic `[slug]` segments are only path-shaped here; slug *values* are
 * translated by the content layer, which stores one slug per locale per entity.
 *
 * NOTE: the old Wix site used umlaut URLs (`/überuns`, `/großhandel`). Those
 * are gone — see content/strategy/seo-redirects.md for the 301 map.
 */
export const pathnames = {
  "/": "/",
  "/about": { de: "/ueber-uns", en: "/about" },
  "/range": { de: "/sortiment", en: "/range" },
  "/range/[slug]": { de: "/sortiment/[slug]", en: "/range/[slug]" },
  "/product/[slug]": { de: "/produkt/[slug]", en: "/product/[slug]" },
  "/wholesale": { de: "/grosshandel", en: "/wholesale" },
  "/wholesale/[slug]": { de: "/grosshandel/[slug]", en: "/wholesale/[slug]" },
  "/private-label": { de: "/private-label", en: "/private-label" },
  "/delivery": { de: "/lieferung", en: "/delivery" },
  "/contact": { de: "/kontakt", en: "/contact" },
  "/enquiry": { de: "/anfrage", en: "/enquiry" },
  "/sample": { de: "/muster", en: "/sample" },
  "/cart": { de: "/warenkorb", en: "/cart" },
  "/checkout": { de: "/kasse", en: "/checkout" },
  "/careers": { de: "/karriere", en: "/careers" },
  "/terms": { de: "/agb", en: "/terms" },
  "/withdrawal": { de: "/widerruf", en: "/withdrawal" },
  "/privacy": { de: "/datenschutz", en: "/privacy" },
  "/imprint": { de: "/impressum", en: "/imprint" },
} as const;

export type AppPathname = keyof typeof pathnames;

/** Routes with no dynamic segment — the only ones linkable without params. */
export type StaticPathname = Exclude<AppPathname, `${string}[${string}`>;

export const routing = defineRouting({
  locales,
  defaultLocale,
  /* Both locales carry a prefix; `/` redirects to `/de`. Chosen so neither
     language is second-class and hreflang stays unambiguous. */
  localePrefix: "always",
  pathnames,
  /* hreflang is built per page in lib/seo from the translated slugs, with an
     x-default that resolves. Two sets that contradict each other are worse
     than one, so the middleware's own Link header is off. */
  alternateLinks: false,
});
