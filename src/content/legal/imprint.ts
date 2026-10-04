import type { Locale } from "@/i18n/routing";
import { IMPRINT_TEXT } from "./imprintLive";
import type { LegalDocument } from "./types";

/** Impressum: the live hugo-tron.com text, verbatim (German in both locales). */
export function imprint(locale: Locale): LegalDocument {
  return {
    title: "Impressum",
    source: "hugo-tron.com/impressum (verbatim)",
    ...(locale === "de" ? {} : { translationNote: "Legal notice, available in German only." }),
    blocks: IMPRINT_TEXT,
  };
}
