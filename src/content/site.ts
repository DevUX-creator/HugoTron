/**
 * The company itself — one source, because it is printed in more than one
 * place and was starting to drift.
 *
 * The address and the telephone number were typed into the footer and again
 * into the enquiry page. Two copies of a postcode is how a company moves
 * office and the old one survives on a page nobody thought to check. The
 * backend team gets the same benefit: when this comes from a CMS or a settings
 * table, this file is the only thing that changes.
 *
 * NOT TRANSLATED, DELIBERATELY. A legal name, a street and a telephone number
 * read the same in both locales — the only part that does vary is the country,
 * which stays in `messages` (`homeStory.contact.country`) where a translator
 * can reach it.
 */
export const COMPANY = {
  legalName: "Hugo Tron GmbH",
  street: "Friesenweg 2b",
  postalCode: "22763",
  city: "Hamburg",
  /** ISO 3166-1 alpha-2 — for schema.org and for any address formatter. */
  countryCode: "DE",
} as const;

export const CONTACT = {
  email: "info@hugo-tron.com",
  /** E.164, for `tel:` and for anything that has to dial it. */
  phone: "+494021078869",
  /** Grouped for reading. Never parse this one. */
  phoneDisplay: "+49 40 210 788 69",
} as const;

/** `mailto:` and `tel:` hrefs, so no component builds its own. */
export const HREF = {
  email: `mailto:${CONTACT.email}`,
  phone: `tel:${CONTACT.phone}`,
} as const;
