import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import Header from "@/components/layout/Header";
import ArrowLink from "@/components/ui/ArrowLink";
import { HomeThemeProvider } from "@/components/rice/HomeTheme";
import { DoorArrival } from "@/components/transition/DoorTransition";
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

/**
 * Delivery: the location behind the wholesale hall's door. The visitor arrives in the door's
 * light (DoorArrival). Its own 3D scene is still to come; until then the night, the light
 * behind and the trails running on carry the page.
 */
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
        <section className="delivery-arrival" aria-labelledby="delivery-title">
          <div className="delivery-arrival__light" aria-hidden="true" />
          <div className="delivery-arrival__trails" aria-hidden="true" />
          <nav className="delivery-arrival__crumbs" aria-label={t("breadcrumbLabel")}>
            <ol>
              <li>
                <Link href="/">{t("home")}</Link>
              </li>
              <li aria-current="page">{t("name")}</li>
            </ol>
          </nav>
          <div className="delivery-arrival__copy">
            <p className="delivery-arrival__eyebrow">{t("eyebrow")}</p>
            <h1 id="delivery-title">
              <span>{t("titleLead")}</span> <span>{t("titleAccent")}</span>
            </h1>
            <p className="delivery-arrival__lead">{t("lead")}</p>
            <ul className="delivery-arrival__facts">
              {(["warehouse", "germany", "international"] as const).map((key) => (
                <li key={key}>{t(`facts.${key}`)}</li>
              ))}
            </ul>
            <div className="delivery-arrival__actions">
              <ArrowLink
                href={{ pathname: "/enquiry", query: { purpose: "quote" } }}
                prefetch={false}
                variant="glass"
                size="large"
              >
                {t("action")}
              </ArrowLink>
              <Link href="/wholesale" className="delivery-arrival__back">
                {t("back")}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <DoorArrival />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
    </HomeThemeProvider>
  );
}
