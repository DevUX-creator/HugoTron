import type { Locale } from "@/i18n/routing";
import { BUSINESS_TERMS } from "./termsBusiness";
import type { LegalDocument } from "./types";

/** AGB: the live hugo-tron.com terms for business customers, verbatim (German only). */
export function terms(locale: Locale): LegalDocument {
  return {
    title: "Allgemeine Geschäftsbedingungen",
    source: "hugo-tron.com/agb (verbatim)",
    ...(locale === "de"
      ? {}
      : { translationNote: "Terms and conditions, available in German only." }),
    blocks: [{ h2: "Allgemeine Geschäftsbedingungen für Geschäftskunden" }, ...BUSINESS_TERMS],
  };
}
