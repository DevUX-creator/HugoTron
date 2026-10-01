import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { permanentRedirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/** Keep existing bookmarks working after nesting rice beneath Products. */
export default async function LegacyRicePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  permanentRedirect({ locale, href: "/range/rice" });
}
