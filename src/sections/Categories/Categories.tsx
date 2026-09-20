import { useTranslations } from "next-intl";
import Section from "@/components/ui/Section";
import Heading from "@/components/ui/Heading";
import MediaFrame from "@/components/ui/MediaFrame";
import { Link } from "@/i18n/navigation";
import Reveal from "@/animations/Reveal";
import RevealText from "@/animations/RevealText";
import "./categories.css";

/**
 * Block 4 — Range by category.
 * See content/strategy/homepage-struktur.md (DE) / homepage-structure.en.md (EN).
 *
 * Hairline-separated rows: thumbnail, eyebrow, title, arrow. The reference's
 * "shop by category" pattern.
 *
 * Categories are formed by PRODUCT GROUP, not by B2B/B2C — inside a category
 * the 1 kg bag sits next to the 25 kg sack. That is what dissolves the current
 * site's €0.00 "not available" workaround (see audit.md §2).
 *
 * The whole row is one link. The arrow is decorative; the accessible name
 * comes from the heading inside the link, so there is no "read more" to
 * announce out of context.
 */
const CATEGORIES = [
  { key: "rice", href: "/range" },
  { key: "pulses", href: "/range" },
  { key: "nuts", href: "/range" },
  { key: "spices", href: "/range" },
  { key: "grains", href: "/range" },
  { key: "tea", href: "/range" },
] as const;

export default function Categories() {
  const t = useTranslations("categories");

  return (
    <Section id="range" width="wide" ariaLabel={t("title")} className="categories">
      <div className="categories__header section-header">
        <RevealText>
          <Heading as={2} size="title-xl">
            {t("title")}
          </Heading>
        </RevealText>
      </div>

      <ul className="categories__list">
        {CATEGORIES.map((category, i) => (
          <li key={category.key}>
            <Reveal delay={i * 0.05}>
              <Link href={category.href} className="categories__row">
                {/* The notch carries the arrow, so the row needs none of its
                    own. The control is a <span>: the whole row is already the
                    link, and a button inside it would be a second target. */}
                <MediaFrame
                  ratio="4 / 3"
                  className="categories__thumb"
                  action={
                    <span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path
                          d="M4 12h15M13 6l6 6-6 6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  }
                />

                <span className="categories__text">
                  <span className="categories__eyebrow eyebrow">
                    {t(`${category.key}.eyebrow`)}
                  </span>
                  <Heading as={3} size="title-lg" className="categories__title">
                    {t(`${category.key}.title`)}
                  </Heading>
                </span>
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
