"use client";

import { useId, useRef, type CSSProperties } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import ArrowLink from "@/components/ui/ArrowLink";
import EnquireLink from "@/components/products/EnquireLink";
import RangeProductCard from "@/components/products/RangeProductCard";
import { productsForCategories } from "@/lib/catalogue";
import ProductRail from "@/components/products/ProductRail";
import FilmPlaylist from "@/components/media/FilmPlaylist";
import {
  SERVICE_CHAPTERS,
  type CategoryStory as Story,
  type ChapterLayout,
  type StoryChapter,
} from "@/content/categoryStories";
import { useStory } from "@/sections/Daylight/useStory";
import PaperPack from "@/sections/Daylight/PaperPack";
import PaperContact from "@/sections/Daylight/PaperContact";
import CategoryPlane from "./CategoryPlane";

/** The ink line's route through each composition ("x%,share-of-height"), clear of the text. */
const LINE: Record<ChapterLayout, string> = {
  flanked: "14,0.02;8,0.45;23,0.94",
  horizon: "23,0.02;8,0.45;14,0.94",
  offset: "14,0.02;7,0.5;14,0.94",
};

type Text = { eyebrow: string; title: string; note: string; facts?: string[] };

/** A centred reading column, framed by category-specific botanical and landscape studies. */
function Chapter({ chapter, text, story }: { chapter: StoryChapter; text: Text; story: Story }) {
  const id = `category-${chapter.key}-title`;
  return (
    <section
      className={`story-chapter category-chapter category-chapter--${chapter.layout}`}
      data-story-chapter={chapter.key}
      data-line={LINE[chapter.layout]}
      aria-labelledby={id}
    >
      <CategoryPlane story={story} chapter={chapter} />
      <header className="story-text story-text--centre">
        <p className="paper-caption">{text.eyebrow}</p>
        <h2 id={id}>{text.title}</h2>
        <p className="story-text__note">{text.note}</p>
        {text.facts && (
          <ul className="category-facts">
            {text.facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        )}
      </header>
    </section>
  );
}

/**
 * Centred category chapters with local illustrations and a quiet margin line. Shared buying
 * components retain their catalogue data, cart behaviour and enquiry selection.
 */
export default function CategoryStory({ story }: { story: Story }) {
  const t = useTranslations("category");
  const copy = useTranslations(`category.${story.slug}`);
  // Chapter and variety keys are data; next-intl cannot check keys built from them.
  const own = (key: string) => copy(key as Parameters<typeof copy>[0]);
  const root = useRef<HTMLDivElement>(null);
  const lineClip = useId();
  useStory(root);
  const category = copy("inText");
  const name = copy("name");
  const products = productsForCategories(story.catalogue, story.relatedCatalogue);
  const chapters = [...story.chapters, ...SERVICE_CHAPTERS];
  const text = (chapter: StoryChapter): Text =>
    story.chapters.includes(chapter)
      ? {
          eyebrow: own(`chapters.${chapter.key}.eyebrow`),
          title: own(`chapters.${chapter.key}.title`),
          note: own(`chapters.${chapter.key}.note`),
        }
      : chapter.key === "import"
        ? {
            eyebrow: t("import.eyebrow"),
            title: t("import.title"),
            note: t("import.note", { category }),
          }
        : {
            eyebrow: t("distribution.eyebrow"),
            title: t("distribution.title"),
            note: t("distribution.note"),
            facts: (["one", "two", "three"] as const).map((n) => t(`distribution.facts.${n}`)),
          };

  const cards = [
    ...products.map((product, index) => (
      <RangeProductCard key={product.slug} product={product} index={index} />
    )),
    ...story.onRequest.map((variety, index) => {
      const varietyName = own(`varieties.${variety}.name`);
      return (
        <article
          key={variety}
          className="range-product category-variety"
          aria-labelledby={`variety-${variety}`}
        >
          <div className="range-product__top">
            <span>{String(products.length + index + 1).padStart(2, "0")}</span>
            <span>{t("variety.badge")}</span>
          </div>
          <div className="category-variety__mark" aria-hidden="true">
            <Image src={story.artwork.botanical} alt="" width={512} height={768} sizes="260px" />
          </div>
          <h3 id={`variety-${variety}`}>{varietyName}</h3>
          <div className="range-product__meta">
            <p>{own(`varieties.${variety}.note`)}</p>
          </div>
          <EnquireLink product={null} name={varietyName} className="range-product__enquiry" />
        </article>
      );
    }),
  ];

  const ways = [
    { key: "wholesale", href: { pathname: "/enquiry", query: { purpose: "quote" } }, art: "ship" },
    { key: "label", href: "/private-label", art: "pack" },
    { key: "sourcing", href: { pathname: "/enquiry", query: { purpose: "quote" } }, art: "cargo" },
  ] as const;

  return (
    <div ref={root} className="paper-story category-story">
      <svg className="story__line" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id={lineClip} clipPathUnits="userSpaceOnUse">
            <rect className="story__line-fill" width="0" height="0" />
          </clipPath>
        </defs>
        <path className="story__line-grey" />
        <path className="story__line-ink" clipPath={`url(#${lineClip})`} />
      </svg>
      <div className="category-chapters">
        {chapters.map((chapter) => (
          <Chapter key={chapter.key} chapter={chapter} text={text(chapter)} story={story} />
        ))}
      </div>

      <section
        className="category-assortment paper-range"
        data-story-chapter="range"
        data-line="14,0.02;6,0.45;14,0.98"
        aria-labelledby="category-range-title"
      >
        <header className="story-text story-text--centre">
          <p className="paper-caption">{name}</p>
          <h2 id="category-range-title">{t("selection.title")}</h2>
          <p className="story-text__note">{t("reveal.lead", { category })}</p>
        </header>
        {story.film && (
          <div className="category-assortment__film">
            <FilmPlaylist films={[story.film]} />
          </div>
        )}
        <ProductRail items={cards} />
      </section>

      <section
        className="category-ways"
        data-story-chapter="ways"
        data-line="14,0.02;6,0.5;14,0.98"
        aria-labelledby="category-ways-title"
      >
        <header className="story-text story-text--centre">
          <p className="paper-caption">{t("ways.eyebrow")}</p>
          <h2 id="category-ways-title">{t("ways.title")}</h2>
        </header>
        <ol className="category-ways__stack">
          {ways.map((way, index) => (
            <li key={way.key} className="category-way" style={{ "--i": index } as CSSProperties}>
              <div className="category-way__copy">
                <span className="category-way__index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3>{t(`ways.${way.key}.title`)}</h3>
                <p>{t(`ways.${way.key}.note`, { category })}</p>
                <ArrowLink href={way.href} prefetch={false} variant="glass">
                  {t(`ways.${way.key}.action`)}
                </ArrowLink>
              </div>
              <div className="category-way__art" aria-hidden="true">
                {way.art === "pack" ? (
                  <PaperPack settled />
                ) : (
                  <Image
                    src={
                      way.art === "ship"
                        ? story.artwork.landscape
                        : "/images/category-editorial/logistics.webp"
                    }
                    alt=""
                    width={1536}
                    height={1024}
                    sizes="(width < 48rem) 80vw, 36vw"
                  />
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="category-faq"
        data-story-chapter="faq"
        data-line="14,0.02;6,0.5;14,0.98"
        aria-labelledby="category-faq-title"
      >
        <header className="story-text story-text--centre">
          <p className="paper-caption">{t("faq.eyebrow")}</p>
          <h2 id="category-faq-title">{t("faq.title")}</h2>
        </header>
        <div className="category-faq__list">
          {(["1", "2", "3", "4"] as const).map((n) => (
            <details key={n}>
              <summary>
                <h3>{t(`faq.q${n}`, { category })}</h3>
              </summary>
              <p>{t(`faq.a${n}`, { category })}</p>
            </details>
          ))}
        </div>
      </section>

      <section
        className="category-cta"
        data-story-chapter="cta"
        data-line="14,0.02;8,0.9"
        aria-labelledby="category-cta-title"
      >
        <p className="paper-caption">{t("cta.eyebrow")}</p>
        <h2 id="category-cta-title">{t("cta.title")}</h2>
        <p className="story-text__note">{t("cta.note")}</p>
        <ArrowLink
          href={{ pathname: "/enquiry", query: { purpose: "quote" } }}
          prefetch={false}
          variant="glass"
          size="large"
        >
          {t("cta.action")}
        </ArrowLink>
      </section>

      <PaperContact />
    </div>
  );
}
