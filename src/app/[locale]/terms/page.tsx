import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import { legalDocument } from "@/lib/legal/source";
import LegalPage from "@/components/legal/LegalPage";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const document = legalDocument("terms", locale as Locale);
  const t = await getTranslations({ locale, namespace: "legal.description" });
  return pageMetadata({
    title: `${document.title} | Hugo Tron`,
    description: t("terms"),
    href: "/terms",
    locale: locale as Locale,
  });
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <LegalPage page="terms" locale={locale} />;
}
