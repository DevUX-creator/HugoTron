import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { COMPANY, CONTACT } from "@/content/site";

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

/** The organisation every page's structured data refers to, by `@id`. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export function organizationJsonLd() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: COMPANY.legalName,
    url: SITE_URL,
    email: CONTACT.email,
    telephone: CONTACT.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.street,
      postalCode: COMPANY.postalCode,
      addressLocality: COMPANY.city,
      addressCountry: COMPANY.countryCode,
    },
  };
}

/** Serialises structured data for a `<script type="application/ld+json">`, safe against `</script>`. */
export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
