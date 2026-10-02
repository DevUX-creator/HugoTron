import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { routing, type Locale } from "@/i18n/routing";
import EnquiryForm from "@/components/forms/EnquiryForm";
import FormPage from "@/components/forms/FormPage";
import { getProduct } from "@/lib/catalogue";

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
  const t = await getTranslations({ locale: locale as Locale, namespace: "enquiry" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/**
 * The enquiry page — where every "request a price", "request a sample" and
 * "get in touch" on the site now lands.
 *
 * THE COPY BESIDE THE FORM IS NOT DECORATION. A buyer filling this in has not
 * chosen a supplier yet, so the column on the left keeps the two facts that
 * make a stranger's form worth finishing — a real address and a person who
 * answers — in view while they type.
 */
export default async function EnquiryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ product?: string | string[]; purpose?: string | string[] }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale: locale as Locale, namespace: "enquiry" });
  const { product: requestedProduct, purpose } = await searchParams;
  const initialPurpose =
    purpose === "label" || purpose === "sample" || purpose === "other" ? purpose : "quote";
  const selectedProduct =
    typeof requestedProduct === "string" ? getProduct(requestedProduct) : undefined;
  const productNames = await getTranslations({ locale, namespace: "products" });
  const units = await getTranslations({ locale, namespace: "units" });

  return (
    <FormPage eyebrow={t("eyebrow")} title={t("title")} lead={t("lead")}>
      <EnquiryForm
        key={`${selectedProduct?.slug ?? "general"}-${initialPurpose}`}
        initialPurpose={initialPurpose}
        initialProduct={selectedProduct ? productNames(selectedProduct.slug) : ""}
        initialPackSize={selectedProduct ? units(selectedProduct.unit) : ""}
      />
    </FormPage>
  );
}
