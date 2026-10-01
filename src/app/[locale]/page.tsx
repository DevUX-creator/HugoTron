import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

import Header from "@/components/layout/Header";
import World from "@/sections/World/World";
import Daylight from "@/sections/Daylight/Daylight";
import { HomeThemeProvider } from "@/components/rice/HomeTheme";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "world" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/** The Hugo Tron world is the entrance; rice now has a dedicated category page. */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <HomeThemeProvider forcedTheme="dark">
      <Header brandLogo showSoundToggle={false} />
      <main>
        <World />
        <Daylight />
      </main>
    </HomeThemeProvider>
  );
}
