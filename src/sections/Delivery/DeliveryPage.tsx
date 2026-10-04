import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import Header from "@/components/layout/Header";
import DeliveryExplorer from "./DeliveryExplorer";
import { HomeThemeProvider } from "@/components/rice/HomeTheme";
import WorldFrame from "@/sections/World/WorldFrame";
import { absoluteUrl, alternates, jsonLd, organizationJsonLd } from "@/lib/seo";
import "@/sections/World/world.css";
import "./delivery.css";

export async function deliveryMetadata(locale: Locale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "delivery" });
  const links = alternates("/delivery", locale);
  return {
    title: t("seoTitle"),
    description: t("seoDescription"),
    alternates: links,
    openGraph: {
      type: "website",
      siteName: "Hugo Tron",
      title: t("seoTitle"),
      description: t("seoDescription"),
      url: links.canonical,
      locale: locale === "de" ? "de_DE" : "en_GB",
    },
  };
}

/** Delivery continues the hall journey as a quiet, Germany-focused atlas. */
export default async function DeliveryPage({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "delivery" });
  const url = absoluteUrl("/delivery", locale);
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd(),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("home"), item: absoluteUrl("/", locale) },
          { "@type": "ListItem", position: 2, name: t("name"), item: url },
        ],
      },
    ],
  };
  return (
    <HomeThemeProvider forcedTheme="dark">
      <a className="skip-link" href="#main">
        {t("skip")}
      </a>
      <Header brandLogo showSoundToggle={false} />
      <WorldFrame />
      <main id="main" tabIndex={-1} className="delivery">
        <DeliveryExplorer />
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
    </HomeThemeProvider>
  );
}
