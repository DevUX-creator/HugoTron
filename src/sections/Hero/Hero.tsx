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
 * A full-bleed lifestyle frame with the copy over its lower-left and the slide
 * rail over its lower-right, sharing one baseline.
 *
 * LAYOUT ONLY at this stage. The rail is static markup: the slider and its
 * motion come from Dmitrij later, so the thumbs are real buttons with the right
 * states and no behaviour behind them yet.
 *
 * A scrim sits between the media and the copy. It is not decoration — light
 * type over an unknown photograph is unreadable, and every image here is still
 * a grey box, so the guarantee has to come from the layer, not from the art.
 */
export default function Hero() {
  const t = useTranslations("hero");
  const slides = [t("slide1"), t("slide2"), t("slide3")];

  return (
    <section className="hero" aria-label={t("label")}>
      <div className="hero__media">
        <Placeholder
          rounded={false}
          tone="dark"
          label={t("mediaHint")}
          className="hero__placeholder"
        />
        <div className="hero__scrim" />
      </div>

      <div className="hero__inner">
        <div className="hero__copy">
          <Copy eager>
            <p className="hero__eyebrow eyebrow">{t("eyebrow")}</p>
          </Copy>

          <RevealText eager>
            <Heading as={1} size="hero-lg" className="hero__title">
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
                  <Placeholder ratio="4 / 3" tone="dark" />
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
