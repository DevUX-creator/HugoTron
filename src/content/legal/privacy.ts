import type { Locale } from "@/i18n/routing";
import { PRIVACY_TEXT } from "./privacyLive";
import type { LegalDocument } from "./types";

/** Datenschutzerklärung: the live hugo-tron.com text, verbatim (German in both locales). */
export function privacy(locale: Locale): LegalDocument {
  return {
    title: "Datenschutzerklärung",
    source: "hugo-tron.com/datenschutz (verbatim, eRecht24)",
    ...(locale === "de" ? {} : { translationNote: "Privacy policy, available in German only." }),
    blocks: PRIVACY_TEXT,
  };
}
