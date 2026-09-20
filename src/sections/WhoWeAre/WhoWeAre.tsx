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
        <p className="who-micro__kicker eyebrow col-12 col-lg-3">{t("eyebrow")}</p>

        <Copy>
          <p className="who-micro__note col-12 col-lg-4">{t("micro")}</p>
        </Copy>

        {/* TWO TRACES, RUNNING PAST EACH OTHER — goods out, orders back. The
            only thing in this row that moves, and the only mark on the page
            that says what the company is for without using a word.

            The lines themselves are triangle waves and they TRAVEL on a
            triangular path as well — see the keyframes in the stylesheet.

            Each path is drawn at TWICE the window's width and slid by exactly
            one window, so the loop is seamless: the wave at 120 is the wave at
            0. That only holds while the window is a whole number of each
            line's own periods — 120 is four of A's thirty and three of B's
            forty — so the two can run at different wavelengths, and in
            opposite directions, without either stuttering at the wrap. */}
        <span className="who-micro__rule col-6 col-lg-3" aria-hidden="true">
          <svg viewBox={`0 0 ${TRACE_WIDTH} 24`} preserveAspectRatio="none" focusable="false">
            <path className="who-trace who-trace--a" d={wavePath(15, 7)} />
            <path className="who-trace who-trace--b" d={wavePath(20, 4)} />
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

/* The window the traces are seen through, in the SVG's own units. The
   stylesheet slides each path by exactly this much — the two numbers are the
   same distance and have to stay that way. */
const TRACE_WIDTH = 120;
/** Twice the window, so there is always a second copy waiting off the right. */
const TRACE_RUN = TRACE_WIDTH * 2;
/** The traces' centre line, half of the 24-unit viewBox. */
const TRACE_MID = 12;

/**
 * One continuous TRIANGLE wave, `TRACE_RUN` units long.
 *
 * `halfPeriod` is centre crossing to centre crossing and `lift` is how far the
 * apex sits off the centre line. Each segment runs straight out to an apex and
 * straight back, alternating above and below — no curves, so the mark reads as
 * a signal trace rather than as water.
 *
 * THE WRAP IS WHY THE NUMBERS ARE WHAT THEY ARE. The window is 120 units and
 * the path is drawn at 240, then slid by exactly 120, so the loop is seamless
 * only while 120 is a whole number of periods: it is four of A's thirty and
 * three of B's forty. Both counts are even, so each line leaves the window
 * travelling the same way it entered and there is no kink at the joint.
 *
 * Pure arithmetic on two constants, so the server and the client draw an
 * identical `d` and there is nothing for hydration to disagree about.
 */
function wavePath(halfPeriod: number, lift: number) {
  let d = `M0 ${TRACE_MID}`;
  let up = true;

  for (let x = 0; x < TRACE_RUN; x += halfPeriod) {
    const apex = TRACE_MID + (up ? -lift : lift);
    d += ` L ${x + halfPeriod / 2} ${apex} L ${x + halfPeriod} ${TRACE_MID}`;
    up = !up;
  }

  return d;
}
