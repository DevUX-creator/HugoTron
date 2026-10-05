import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import Header from "@/components/layout/Header";
import { HomeThemeProvider } from "@/components/rice/HomeTheme";
import WorldFrame from "@/sections/World/WorldFrame";
import LabelRoom from "@/sections/PrivateLabel/LabelRoom";
import { pageMetadata } from "@/lib/seo";
import "@/sections/World/world.css";
import "@/sections/PrivateLabel/privateLabel.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "labelRoom" });
  return pageMetadata({
    title: t("seoTitle"),
    description: t("seoDescription"),
    href: "/private-label",
    locale,
  });
}
export default async function PrivateLabelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("labelRoom");
  return (
    <HomeThemeProvider forcedTheme="dark">
      <a className="skip-link" href="#main">
        {t("skip")}
      </a>
      <Header brandLogo showSoundToggle={false} />
      <WorldFrame />
      <main id="main" tabIndex={-1}>
        <LabelRoom />
      </main>
    </HomeThemeProvider>
  );
}
