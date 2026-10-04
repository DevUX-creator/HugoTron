import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { getCategoryStory } from "@/content/categoryStories";
import CategoryPage, { categoryMetadata } from "@/sections/Category/CategoryPage";

const story = getCategoryStory("rice")!;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  return categoryMetadata(story, locale);
}

/** Rice, on the shared category story (sections/Category), like every other range. */
export default async function RicePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return <CategoryPage story={story} locale={locale} />;
}
