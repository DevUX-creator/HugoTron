import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Hero from "@/sections/Hero";
import Categories from "@/sections/Categories";

/**
 * The home page.
 *
 * Sections follow the block order in content/strategy/homepage-struktur.md (DE)
 * and homepage-structure.en.md (EN). Both documents use the same numbering.
 *
 * Built:   Block 0 (chrome), Block 1 (hero), Block 4 (categories)
 * Next up: Block 2 (proof bar), Block 3 (audience split)
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main>
        <Hero />
        <Categories />
      </main>
    </>
  );
}
