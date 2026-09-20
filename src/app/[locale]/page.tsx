import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

/**
 * The home page.
 *
 * Sections are added one at a time, in the order set out in
 * content/strategy/homepage-struktur.md (DE) and homepage-structure.en.md (EN).
 * Both documents use the same block numbering.
 *
 * Next up: Block 1 — Hero.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return <main />;
}
