import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { COMPANY, CONTACT, HREF, REGISTER } from "@/content/site";
import { socialImagePath } from "./social";

/** The live origin. Matches `metadataBase` in the locale layout. */
export const SITE_URL = "https://www.hugo-tron.com";

type Href = Parameters<typeof getPathname>[0]["href"];

/** An absolute URL for an internal route in one locale. */
export function absoluteUrl(href: Href, locale: Locale) {
  return `${SITE_URL}${getPathname({ href, locale })}`;
}

/**
 * Canonical and hreflang links for one route, built from the translated pathnames so both
 * languages point at each other, with German as x-default (the company's home market).
 */
export function alternates(href: Href, locale: Locale) {
  const languages: Record<string, string> = {};
  for (const other of routing.locales) languages[other] = absoluteUrl(href, other);
  languages["x-default"] = absoluteUrl(href, "de");
  return { canonical: absoluteUrl(href, locale), languages };
}

/**
 * Title, description, canonical, hreflang and the share card for one indexable page. The share
 * images are pre-rendered JPEGs in public/social, with no per-request image generation.
 */
export function pageMetadata({
  title,
  description,
  href,
  locale,
}: {
  title: string;
  description?: string;
  href: Href;
  locale: Locale;
}): Metadata {
  const links = alternates(href, locale);
  const image = {
    url: `${SITE_URL}${socialImagePath(typeof href === "string" ? href : href.pathname, locale)}`,
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: title,
  };
  return {
    title,
    description,
    alternates: links,
    openGraph: {
      type: "website",
      siteName: "Hugo Tron",
      title,
      description,
      url: links.canonical,
      locale: locale === "de" ? "de_DE" : "en_GB",
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/** The organisation every page's structured data refers to, by `@id`. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/**
 * The company as a local business (a wholesaler is a schema.org WholesaleStore, which is both
 * an Organization and a LocalBusiness): name, address, coordinates, map, contact, register and
 * the area it delivers to. Opening hours are left out until Hugo Tron confirms them.
 */
export function organizationJsonLd() {
  return {
    "@type": "WholesaleStore",
    "@id": ORGANIZATION_ID,
    name: "Hugo Tron",
    legalName: COMPANY.legalName,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo.png`,
    image: `${SITE_URL}/social/de/world.jpg`,
    email: CONTACT.email,
    telephone: CONTACT.phone,
    vatID: REGISTER.vatId,
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.street,
      postalCode: COMPANY.postalCode,
      addressLocality: COMPANY.city,
      addressRegion: "Hamburg",
      addressCountry: COMPANY.countryCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: COMPANY.latitude,
      longitude: COMPANY.longitude,
    },
    hasMap: `https://www.openstreetmap.org/?mlat=${COMPANY.latitude}&mlon=${COMPANY.longitude}#map=18/${COMPANY.latitude}/${COMPANY.longitude}`,
    // As the live site says: delivery throughout Germany and across Europe.
    areaServed: [
      { "@type": "Country", name: "Germany" },
      { "@type": "Place", name: "Europe" },
    ],
    sameAs: [HREF.instagram],
  };
}

/** The site itself, so search engines connect pages, languages and publisher. */
export function websiteJsonLd() {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "Hugo Tron",
    inLanguage: ["de", "en"],
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** Serialises structured data for a `<script type="application/ld+json">`, safe against `</script>`. */
export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
