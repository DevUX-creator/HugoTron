import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { alternates } from "@/lib/seo";
import { legalDocument } from "@/lib/legal/source";
import LegalPage from "@/components/legal/LegalPage";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const document = legalDocument("withdrawal", locale as Locale);
  return {
    title: `${document.title} | Hugo Tron`,
    alternates: alternates("/withdrawal", locale as Locale),
    // Shown as a dialog in checkout; this route carries the withdrawal function (§ 356a BGB)
    // for the confirmation page, the account and order emails. Not indexed.
    robots: { index: false },
  };
}

export default async function Page({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <LegalPage page="withdrawal" locale={locale} orderReference={(await searchParams).ref ?? ""} />
  );
}
