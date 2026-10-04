import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { getProduct } from "@/commerce/catalogue";
import { getSession } from "@/commerce/session";
import { CONTACT_TOPICS, type ContactTopic } from "@/lib/enquiry/schema";
import { absoluteUrl, jsonLd, pageMetadata, organizationJsonLd, ORGANIZATION_ID } from "@/lib/seo";
import { CONTACT, HREF } from "@/content/site";
import CommerceShell from "@/components/commerce/layout/CommerceShell";
import ContactPage from "@/components/contact/ContactPage";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ topic?: string; purpose?: string; product?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "contact" });
  return pageMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    href: "/contact",
    locale: locale as Locale,
  });
}

/**
 * Contact: every "get in touch", "request a price", "request a sample" lands here (the old
 * /enquiry redirects). `?topic=enquiry|order|general`, `?purpose=quote|sample|label|other`
 * and `?product=<slug>` preselect the form.
 */
export default async function Contact({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const query = await searchParams;
  const topic: ContactTopic = CONTACT_TOPICS.includes(query.topic as ContactTopic)
    ? (query.topic as ContactTopic)
    : "enquiry";
  const purpose =
    query.purpose === "sample" || query.purpose === "label" || query.purpose === "other"
      ? query.purpose
      : "quote";
  const product = query.product ? getProduct(query.product) : undefined;
  const names = await getTranslations({ locale, namespace: "products" });
  const units = await getTranslations({ locale, namespace: "units" });
  const session = await getSession();
  const url = absoluteUrl("/contact", locale as Locale);
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...organizationJsonLd(),
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer service",
            email: CONTACT.email,
            telephone: CONTACT.phone,
            availableLanguage: ["de", "en"],
          },
        ],
        sameAs: [HREF.instagram],
      },
      { "@type": "ContactPage", "@id": `${url}#page`, url, about: { "@id": ORGANIZATION_ID } },
    ],
  };
  return (
    <CommerceShell>
      <ContactPage
        topic={topic}
        purpose={purpose}
        product={product ? names(product.slug) : ""}
        packSize={product ? units(product.unit) : ""}
        email={session?.customer.email ?? ""}
        name={session ? `${session.customer.firstName} ${session.customer.lastName}` : ""}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
    </CommerceShell>
  );
}
