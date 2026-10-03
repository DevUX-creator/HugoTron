import { defineRouting } from "next-intl/routing";

export const locales = ["de", "en"] as const;
export type Locale = (typeof locales)[number];

/**
 * TEMPORARY: English, so the site is readable during review.
 *
 * German is the real default — the company, its customers and its legal texts
 * are German, and English exists for the export side (private label,
 * wholesale), written for that reader rather than translated word for word.
 * `messages/de.json` stays the source of truth for the message SHAPE either
 * way (see i18n/messages.ts).
 *
 * SWITCH BACK TO "de" BEFORE LAUNCH — it decides where `/` redirects and which
 * language search engines treat as primary.
 */
const defaultLocale: Locale = "en";

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
const pathnames = {
  "/": "/",
  "/rice": { de: "/reis", en: "/rice" },
  "/about": { de: "/ueber-uns", en: "/about" },
  /* German keeps "Sortiment", the standard trade word and the one
     content/strategy/seo-redirects.md maps the old Wix category onto. */
  "/range": { de: "/sortiment", en: "/products" },
  "/range/rice": { de: "/sortiment/reis", en: "/products/rice" },
  "/range/pistachios": { de: "/sortiment/pistazien", en: "/products/pistachios" },
  "/range/tea": { de: "/sortiment/tee", en: "/products/tea" },
  "/range/saffron": { de: "/sortiment/safran", en: "/products/saffron" },
  "/range/pulses": { de: "/sortiment/huelsenfruechte", en: "/products/pulses" },
  "/range/grains": { de: "/sortiment/getreide", en: "/products/grains" },
  "/range/nuts": { de: "/sortiment/nuesse", en: "/products/nuts" },
  "/range/spices": { de: "/sortiment/gewuerze", en: "/products/spices" },
  "/range/[slug]": { de: "/sortiment/[slug]", en: "/products/[slug]" },
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
