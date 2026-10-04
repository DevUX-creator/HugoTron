import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo";
import CommerceShell from "@/components/commerce/layout/CommerceShell";
import ProductsPage from "@/components/commerce/products/ProductsPage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "commerce.products" });
  return pageMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    href: "/range",
    locale: locale as Locale,
  });
}

export default async function Products({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const { category } = await searchParams;
  return (
    <CommerceShell>
      <ProductsPage category={category} />
    </CommerceShell>
  );
}
