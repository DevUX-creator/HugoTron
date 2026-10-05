import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import Header from "@/components/layout/Header";
import { HomeThemeProvider } from "@/components/rice/HomeTheme";
import WorldFrame from "@/sections/World/WorldFrame";
import { ORGANIZATION_ID, absoluteUrl, pageMetadata, jsonLd, organizationJsonLd } from "@/lib/seo";
import WholesaleHall from "./WholesaleHall";
import "@/sections/World/world.css";
import "./wholesale.css";

export async function wholesaleMetadata(locale: Locale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "wholesale" });
  return pageMetadata({
    title: t("seoTitle"),
    description: t("seoDescription"),
    href: "/wholesale",
    locale,
  });
}

/** Wholesale capability story, with the catalogue reached through a normal link. */
export default async function WholesalePage({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "wholesale" });
  const url = absoluteUrl("/wholesale", locale);
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd(),
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("home"), item: absoluteUrl("/", locale) },
          { "@type": "ListItem", position: 2, name: t("name"), item: url },
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${url}#page`,
        url,
        name: t("seoTitle"),
        description: t("intro.lead"),
        inLanguage: locale,
        breadcrumb: { "@id": `${url}#breadcrumb` },
        publisher: { "@id": ORGANIZATION_ID },
        mainEntity: {
          "@type": "Service",
          name: t("name"),
          description: t("seoDescription"),
          provider: { "@id": ORGANIZATION_ID },
        },
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
      <main id="main" tabIndex={-1} className="wholesale">
        <WholesaleHall />
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
    </HomeThemeProvider>
  );
}
