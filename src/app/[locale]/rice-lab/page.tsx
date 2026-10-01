import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { permanentRedirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/** The temporary rice study now lives in the product category. */
export default async function LegacyRiceLabPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  permanentRedirect({ locale, href: "/range/rice" });
}
