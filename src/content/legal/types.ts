/**
 * A legal text as structured blocks, so every legal page renders the same way and a text can
 * come from a file here or, later, from the Händlerbund interface (src/lib/legal/source.ts).
 * Texts are the client's own (live hugo-tron.com or supplied by the client); never draft here.
 */
export type LegalBlock =
  | { h2: string; id?: string }
  | { h3: string }
  | { p: string }
  | { list: string[] }
  | { address: string[] }
  /** Where a page places its interactive part (the withdrawal function). */
  | { slot: "withdrawal" }
  | { link: { href: string; label: string } };

export type LegalDocument = {
  title: string;
  /** Where the text comes from, for maintainers. */
  source: string;
  /** Shown above a text that is not in the reader's language, or is a translation. */
  translationNote?: string;
  blocks: LegalBlock[];
};

export type LegalPageId = "imprint" | "terms" | "withdrawal" | "privacy";
