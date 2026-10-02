import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import Header from "@/components/layout/Header";
import ArrowLink from "@/components/ui/ArrowLink";
import PaperPack from "@/sections/Daylight/PaperPack";
import { PaperRoute } from "@/sections/Daylight/PaperArt";
import "@/sections/Daylight/daylight.css";

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
  const t = await getTranslations({ locale, namespace: "paperStory.label" });
  return { title: t("pageTitle"), description: t("pageLead") };
}

export default async function PrivateLabelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("paperStory.label");
  return (
    <div className="private-label-shell" id="top">
      <Header brandLogo />
      <main className="paper-scene private-label-page">
        <PaperRoute />
        <div>
          <p className="paper-caption">{t("eyebrow")}</p>
          <h1>
            {t("title")}
            <br />
            <em>{t("accent")}</em>
          </h1>
          <p className="paper-label__note">{t("pageLead")}</p>
          <ArrowLink href={{ pathname: "/enquiry", query: { purpose: "label" } }} variant="glass">
            {t("enquire")}
          </ArrowLink>
          <br />
          <Link href="/" className="private-label-page__back">
            {t("back")}
          </Link>
        </div>
        <PaperPack settled />
      </main>
    </div>
  );
}
