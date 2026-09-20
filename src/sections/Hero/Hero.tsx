import { useTranslations } from "next-intl";
import Heading from "@/components/ui/Heading";
import Button from "@/components/ui/Button";
import Placeholder from "@/components/ui/Placeholder";
import RevealText from "@/animations/RevealText";
import Copy from "@/animations/Copy";
import Reveal from "@/animations/Reveal";
import "./hero.css";

/**
 * Block 1 — Hero.
 * See content/strategy/homepage-struktur.md (DE) / homepage-structure.en.md (EN).
 *
 * Split, following public/reference/brigade-desktop.png: a dark copy panel on
 * the left, the photograph running to the right edge. Not an overlay — the
 * copy has its own solid ground, so legibility never depends on how bright a
 * given photograph turns out to be.
 *
 * Below `lg` the two stack, media first: a phone-width column beside a picture
 * leaves room for neither.
 *
 * LAYOUT ONLY at this stage. The thumb rail is static markup with the right
 * states and no behaviour — the slider and its motion come from Dmitrij later.
 */
export default function Hero() {
  const t = useTranslations("hero");
  const slides = [t("slide1"), t("slide2"), t("slide3")];

  return (
    <section className="hero" aria-label={t("label")}>
      <div className="hero__panel">
        <div className="hero__copy">
          <Copy eager>
            <p className="hero__eyebrow eyebrow">{t("eyebrow")}</p>
          </Copy>

          <RevealText eager>
            <Heading as={1} size="hero-md" className="hero__title" uppercase>
              {t("title")}
            </Heading>
          </RevealText>

          <Copy eager delay={0.15}>
            <p className="hero__lead">{t("lead")}</p>
          </Copy>

          <Reveal eager delay={0.3} className="hero__actions">
            <Button href="/enquiry">{t("ctaPrimary")}</Button>
            <Button href="/range" variant="outline">
              {t("ctaSecondary")}
            </Button>
          </Reveal>
        </div>
      </div>

      <div className="hero__media">
        <Placeholder rounded={false} tone="dark" label={t("mediaHint")} className="hero__frame" />

        {/* The slide rail — the reference's bottom-right cards. */}
        <Reveal eager delay={0.45} className="hero__rail">
          <ul className="hero__thumbs">
            {slides.map((slide, i) => (
              <li key={slide}>
                <button
                  type="button"
                  className="hero__thumb"
                  aria-label={slide}
                  aria-current={i === 0 ? "true" : undefined}
                >
                  <Placeholder ratio="4 / 3" />
                </button>
              </li>
            ))}
          </ul>

          <button type="button" className="hero__pause" aria-label={t("pause")}>
            <svg
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
              focusable="false"
              className="hero__pause-icon"
            >
              <rect x="4" y="3" width="3" height="10" rx="1" />
              <rect x="9" y="3" width="3" height="10" rx="1" />
            </svg>
          </button>
        </Reveal>
      </div>
    </section>
  );
}
