import { useTranslations } from "next-intl";
import Heading from "@/components/ui/Heading";
import Button from "@/components/ui/Button";
import GrainMark from "@/components/ui/GrainMark";
import HeroSlider, { type Slide } from "./HeroSlider";
import RevealText from "@/animations/RevealText";
import Copy from "@/animations/Copy";
import Reveal from "@/animations/Reveal";
import "./hero.css";

/** Catalogue order, and the order the hero cycles them in. */
const PRODUCTS = [
  "pardis-1121-basmati-indien",
  "aladdin-1121-basmati-pakistan",
  "pardis-basmati-indien-1kg",
  "aladdin-basmati-pakistan-1kg",
  "premium-negin-safran",
  "vahdam-earl-grey",
  "pistazien-mit-schale",
  "pistazienkerne",
  "kichererbsen-25kg",
] as const;

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
 * The media is a slider — see HeroSlider, whose transition follows the
 * reference in ExampleSlider.zip.
 */
export default function Hero() {
  const t = useTranslations("hero");
  const tp = useTranslations("products");

  /* ONE FRONT VIEW PER PRODUCT. A pack photographed against its own ground
     reads at a glance and survives being shrunk into a thumbnail; a lifestyle
     frame does neither, and the same picture has to serve as both the preview
     and the view.

     Front only — the other angles belong on a product page, where a visitor
     has already chosen what they are looking at. */
  const slides: Slide[] = PRODUCTS.map((slug) => ({
    src: `/products/${slug}/front.png`,
    alt: tp(slug),
  }));

  return (
    <section className="hero" aria-label={t("label")}>
      <div className="hero__panel">
        {/* A tonal watermark, one step off the panel rather than on it. It sits
            behind the copy and takes no space — the column's measure is set by
            the words, not by decoration. */}
        <GrainMark className="hero__mark" />

        {/* Two groups pushed apart: the claim holds the top of the panel, the
            supporting line and the call to action sit on its floor. */}
        <div className="hero__copy">
          <div className="hero__claim">
            <Copy eager>
              <p className="hero__eyebrow eyebrow">{t("eyebrow")}</p>
            </Copy>

            <RevealText eager>
              <Heading as={1} size="hero-md" className="hero__title" uppercase>
                {t("title")}
              </Heading>
            </RevealText>
          </div>

          <div className="hero__foot">
            <Copy eager delay={0.15}>
              <p className="hero__lead">{t("lead")}</p>
            </Copy>

            <Reveal eager delay={0.3} className="hero__actions">
              <Button href="/range">{t("cta")}</Button>
            </Reveal>
          </div>
        </div>
      </div>

      <div className="hero__media">
        <HeroSlider slides={slides} pauseLabel={t("pause")} playLabel={t("play")} />
      </div>
    </section>
  );
}
