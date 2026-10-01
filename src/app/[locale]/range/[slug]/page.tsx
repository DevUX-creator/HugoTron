import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getCategories, getCategory } from "@/lib/catalogue";
import Catalogue from "@/components/products/Catalogue";

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return getCategories()
    .filter((category) => category.id !== "rice")
    .map((category) => ({
      slug: category.id,
    }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = getCategory(slug);
  if (!hasLocale(routing.locales, locale) || !category) return {};
  const names = await getTranslations({ locale, namespace: "world" });
  const t = await getTranslations({ locale, namespace: "catalogue" });
  return {
    title: `${names(category.id)} — Hugo Tron`,
    description: t(`descriptions.${category.id}`),
  };
}

export default async function ProductCategoryPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  const category = getCategory(slug);
  if (!hasLocale(routing.locales, locale) || !category || category.id === "rice") notFound();
  setRequestLocale(locale);
  return <Catalogue category={category} />;
}
