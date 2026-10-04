import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

/**
 * Metadata for a commerce page from `commerce.meta.<key>`. Cart, checkout and account pages are
 * personal, so they are kept out of search results.
 */
export async function commerceMetadata(
  params: Promise<{ locale: string }>,
  key: "cart" | "checkout" | "confirmation" | "account" | "order" | "legal",
): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "commerce.meta" });
  return { title: t(`${key}Title`), description: t(`${key}Description`), robots: { index: false } };
}
