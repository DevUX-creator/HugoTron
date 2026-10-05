import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import Header from "@/components/layout/Header";
import { HomeThemeProvider } from "@/components/rice/HomeTheme";
import WorldFrame from "@/sections/World/WorldFrame";
import { productsForCategories, isPurchasable, productImage } from "@/commerce/catalogue";
import type { CategoryStory } from "@/content/categoryStories";
import {
  ORGANIZATION_ID,
  SITE_URL,
  absoluteUrl,
  pageMetadata,
  jsonLd,
  organizationJsonLd,
} from "@/lib/seo";
import CategoryHero from "./CategoryHero";
import CategoryStoryView from "./CategoryStory";
import "@/sections/World/world.css";
import "@/sections/Daylight/daylight.css";
import "@/sections/Daylight/story.css";
import "./category.css";

/** Title, description, canonical and hreflang, and Open Graph for one category page. */
export async function categoryMetadata(story: CategoryStory, locale: Locale): Promise<Metadata> {
  const copy = await getTranslations({ locale, namespace: `category.${story.slug}` });
  return pageMetadata({
    title: copy("seoTitle"),
    description: copy("seoDescription"),
    href: story.href,
    locale,
  });
}

/** One structured-data graph: the organisation, breadcrumbs, the range and its questions. */
async function structuredData(story: CategoryStory, locale: Locale) {
  const t = await getTranslations({ locale, namespace: "category" });
  const copy = await getTranslations({ locale, namespace: `category.${story.slug}` });
  const names = await getTranslations({ locale, namespace: "products" });
  const url = absoluteUrl(story.href, locale);
  const category = copy("inText");
  const products = productsForCategories(story.catalogue, story.relatedCatalogue);
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd(),
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("home"), item: absoluteUrl("/", locale) },
          {
            "@type": "ListItem",
            position: 2,
            name: t("products"),
            item: absoluteUrl("/range", locale),
          },
          { "@type": "ListItem", position: 3, name: copy("name"), item: url },
        ],
      },
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        url,
        name: copy("seoTitle"),
        description: copy("lead"),
        inLanguage: locale,
        breadcrumb: { "@id": `${url}#breadcrumb` },
        publisher: { "@id": ORGANIZATION_ID },
        about: copy("name"),
        mainEntity: {
          "@type": "ItemList",
          itemListElement: products.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Product",
              name: names(product.slug),
              image: `${SITE_URL}${productImage(product)}`,
              category: copy("name"),
              ...(isPurchasable(product)
                ? {
                    offers: {
                      "@type": "Offer",
                      price: (product.price! / 100).toFixed(2),
                      priceCurrency: "EUR",
                      url,
                      seller: { "@id": ORGANIZATION_ID },
                    },
                  }
                : {}),
            },
          })),
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: (["1", "2", "3", "4"] as const).map((n) => ({
          "@type": "Question",
          name: t(`faq.q${n}`, { category }),
          acceptedAnswer: { "@type": "Answer", text: t(`faq.a${n}`, { category }) },
        })),
      },
    ],
  };
}

/**
 * A category page: the home's frame, its 3D-to-paper hand-off and its story system, in the
 * range's own colours. Server-rendered copy, so every word is in the HTML for search, AI
 * answers and assistive technology before any script runs.
 */
export default async function CategoryPage({
  story,
  locale,
}: {
  story: CategoryStory;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "category" });
  const data = await structuredData(story, locale);
  return (
    <HomeThemeProvider forcedTheme="dark">
      <a className="skip-link" href="#main">
        {t("skip")}
      </a>
      <Header brandLogo showSoundToggle={false} />
      <WorldFrame />
      <main
        id="main"
        tabIndex={-1}
        className="category"
        data-category={story.slug}
        style={
          { "--cat-night": story.night, "--color-world-paper-blue": story.accent } as CSSProperties
        }
      >
        <CategoryHero story={story} />
        <CategoryStoryView story={story} />
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
    </HomeThemeProvider>
  );
}
