import type { Locale } from "@/i18n/routing";
import type { LegalDocument, LegalPageId } from "@/content/legal/types";
import { imprint } from "@/content/legal/imprint";
import { privacy } from "@/content/legal/privacy";
import { terms } from "@/content/legal/terms";
import { withdrawal } from "@/content/legal/withdrawal";

/**
 * WHERE LEGAL TEXTS COME FROM. Today: the files in src/content/legal (German binding, English
 * a translation). Hugo Tron is a Händlerbund member; Händlerbund offers an interface (API token
 * from the member account) that keeps texts current when the law changes. To use it, fetch the
 * text here (server side, cached, e.g. `fetch(url, { next: { revalidate: 86400 } })`), map it
 * to blocks, and keep the local file as the fallback. Pages do not change.
 */
const DOCUMENTS: Record<LegalPageId, (locale: Locale) => LegalDocument> = {
  imprint,
  terms,
  withdrawal,
  privacy,
};

export function legalDocument(id: LegalPageId, locale: Locale): LegalDocument {
  return DOCUMENTS[id](locale);
}
