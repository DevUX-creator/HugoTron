import { useTranslations } from "next-intl";
import Section from "@/components/ui/Section";
import Heading from "@/components/ui/Heading";
import Button from "@/components/ui/Button";
import Copy from "@/animations/Copy";
import Reveal from "@/animations/Reveal";
import { OriginIcon, DocumentIcon, PackSizesIcon, PalletIcon, LabelIcon } from "./WhoIcons";
import "./whoWeAre.css";

/**
 * Who we are — the company, stated once, under the hero.
 *
 * THE LAYOUT IS TAKEN OFF THE POLEUM SECTION and everything else is ours. Two
 * blocks: a hairline row of four micro elements at four sizes, then a statement
 * set against what the company actually does for you.
 *
 * THE FOUR CLAIMS ARE THE CLIENT'S OWN. They are lifted from the Private Label
 * page (content/pages/private-label.md), which is the best-argued page on the
 * live site. The reference's four — freight, customs, inland delivery, market
 * entry advisory — describe a different business, and writing them here would
 * have this section promising services nobody has said Hugo Tron performs.
 *
 * Server component: every moving part is one of the wrappers in
 * `src/animations`, which are client components already.
 */
export default function WhoWeAre() {
  const t = useTranslations("whoWeAre");

  /* A DATELINE, NOT A FOUNDING YEAR. The company has never published one —
     it is still an open question in content/strategy/kundenfragebogen.md §G —
     and printing an invented number under a heading that says "who we are"
     would be read as fact. Derived from the clock so it cannot go stale, and
     aria-hidden because a bare number teaches a screen reader nothing.
     Replace with the real founding year once the client supplies it. */
  const year = new Date().getFullYear();

  /* FIVE, AND TWO OF THEM ARE THE OFFER RATHER THAN THE PROCESS. Wholesale
     and private label are the things the company sells that a visitor cannot
     guess from a shop full of 1 kg bags, and the strategy docs put both on the
     revenue side — so they belong in the list that says what we do, not only
     in the navigation. */
  const points = [
    { key: "pointOne", Icon: OriginIcon },
    { key: "pointTwo", Icon: DocumentIcon },
    { key: "pointThree", Icon: PackSizesIcon },
    { key: "pointWholesale", Icon: PalletIcon },
    { key: "pointPrivateLabel", Icon: LabelIcon },
  ] as const;

  return (
    <Section id="who-we-are" width="wide" ariaLabel={t("eyebrow")} className="who">
      {/* The hairline row: kicker · one small sentence · two traces · the date.
          Four elements at four sizes across the full width, which is what sets
          the section's register before the statement arrives. */}
      <div className="grid-12 who-micro">
        <p className="who-micro__kicker col-12 col-lg-3">
          <span className="eyebrow tag">{t("eyebrow")}</span>
        </p>

        <Copy>
          <p className="who-micro__note col-12 col-lg-4">{t("micro")}</p>
        </Copy>

        {/* Two curved waves follow the same rounded triangle in opposite
            directions. The faint outline keeps the shape legible throughout
            the loop, including when reduced motion stops the waves. */}
        <span className="who-micro__rule col-6 col-lg-3" aria-hidden="true">
          <svg
            viewBox="0 0 120 90"
            focusable="false"
            style={{ "--who-orbit": `path("${TRACE_ORBIT}")` } as React.CSSProperties}
          >
            <path className="who-trace who-trace--track" d={TRACE_ORBIT} />
            <g className="who-wave who-wave--a">
              <path className="who-trace" d="M-16 0 C-12-6-4-6 0 0 S12 6 16 0" />
            </g>
            <g className="who-wave who-wave--b">
              <path className="who-trace" d="M-13 0 C-10-4-3-4 0 0 S10 4 13 0" />
            </g>
          </svg>
        </span>

        <span className="who-micro__year col-6 col-lg-2" aria-hidden="true">
          {year}
        </span>
      </div>

      {/* The statement, against what the company actually does. */}
      <div className="grid-12 who-head">
        {/* One heading, two halves. They stay inside a single <h2> so the
            outline reads the whole sentence as one thing; the second half
            carries the accent, which is where the sentence turns. */}
        <Copy>
          <Heading as={2} size="hero-md" className="who-head__title col-12 col-lg-7">
            {t("titleLead")} <span className="who-head__accent">{t("titleAccent")}</span>
          </Heading>
        </Copy>

        <div className="who-head__aside col-12 col-lg-5">
          {/* The icons draw themselves in. `Reveal` is what starts them: while
              its `reveal-pending` class is on this wrapper the draw is paused,
              and removing it lets all six run, staggered by index. That keeps
              the trigger in one place and means a visitor who never scrolls
              here never pays for the animation. */}
          <Reveal>
            <ul className="who-points">
              {points.map(({ key, Icon }, i) => (
                <li
                  key={key}
                  className="who-points__item"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <Icon className="who-points__icon" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Not "Our Products" — the hero already owns that and points it at
              the range. This is the one place on the page that hands the
              reader the whole story. */}
          <Button href="/about" variant="outline">
            {t("cta")}
          </Button>
        </div>
      </div>
    </Section>
  );
}

/* Shared by the visible outline and the waves' CSS motion path. The curved
   corners let their direction change smoothly on each lap. */
const TRACE_ORBIT = "M56 15 Q60 8 64 15 L96 70 Q100 77 92 77 H28 Q20 77 24 70 Z";
