import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { permanentRedirect } from "@/i18n/navigation";
import {
  CATEGORY_STORIES,
  LEGACY_CATEGORY_SLUGS,
  getCategoryStory,
} from "@/content/categoryStories";
import CategoryPage, { categoryMetadata } from "@/sections/Category/CategoryPage";

type Params = Promise<{ locale: string; slug: string }>;

export function generateStaticParams() {
  return CATEGORY_STORIES.filter((story) => story.slug !== "rice").map((story) => ({
    slug: story.slug,
  }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const story = getCategoryStory(slug);
  if (!hasLocale(routing.locales, locale) || !story) return {};
  return categoryMetadata(story, locale);
}

/** Every range except rice (which has its own folder) on the shared category story. */
export default async function ProductCategoryPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  // Older catalogue URLs (the home still links to them) now live under a broader range.
  const moved = LEGACY_CATEGORY_SLUGS[slug];
  if (moved) permanentRedirect({ locale, href: getCategoryStory(moved)!.href });
  const story = getCategoryStory(slug);
  if (!story || story.slug === "rice") notFound();
  setRequestLocale(locale);
  return <CategoryPage story={story} locale={locale} />;
}
