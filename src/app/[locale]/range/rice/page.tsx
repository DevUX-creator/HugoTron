import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

import Header from "@/components/layout/Header";
import Opening from "@/sections/Opening/Opening";
import PaperChapter from "@/sections/PaperChapter/PaperChapter";
import { HomeThemeProvider, HomeThemeSwitcher } from "@/components/rice/HomeTheme";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "world" });
  return { title: t("riceMetaTitle"), description: t("riceMetaDescription") };
}

/** Preserve the rice experience as a category beneath Products. */
export default async function RicePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <HomeThemeProvider>
      <Header brandControl={<HomeThemeSwitcher />} />
      <main>
        <Opening />
        <PaperChapter />
      </main>
    </HomeThemeProvider>
  );
}
