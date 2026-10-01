import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import FormPage from "@/components/forms/FormPage";
import OrderForm from "@/components/forms/OrderForm";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale: locale as Locale, namespace: "checkout" });
  return { title: t("metaTitle"), description: t("metaDescription"), robots: { index: false } };
}

/** The order request: the cart, sent for confirmation and paid by invoice. */
export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale: locale as Locale, namespace: "checkout" });
  return (
    <FormPage eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      <OrderForm />
    </FormPage>
  );
}
