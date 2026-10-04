import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { permanentRedirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/** The enquiry form moved into Contact (topic "enquiry"); old links keep their query. */
export default async function EnquiryRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const query = Object.fromEntries(
    Object.entries(await searchParams).flatMap(([key, value]) =>
      typeof value === "string" ? [[key, value]] : [],
    ),
  );
  permanentRedirect({ locale, href: { pathname: "/contact", query } });
}
