"use client";

import { useId, useRef } from "react";
import { useTranslations } from "next-intl";
import ArrowLink from "@/components/ui/ArrowLink";
import ArrowIcon from "@/components/ui/ArrowIcon";
import { Link } from "@/i18n/navigation";
import EngravedFilm from "@/components/media/EngravedFilm";
import { WORLD_FILMS } from "@/content/worldFilms";
import { BuyingSketch } from "./PaperArt";
import StoryVisuals from "./StoryVisuals";
import { useStory } from "./useStory";
import "./story.css";
import PaperPack from "./PaperPack";
import PaperContact from "./PaperContact";
import PaperProductRail from "./PaperProductRail";
import PaperUniverse, { PaperRangeRock } from "./PaperUniverse";
import MobileStory from "./MobileStory";

const FILMS = [WORLD_FILMS[1]!];

/**
 * The paper story. One pinned picture plane carries the first chapters' engravings, which wipe
 * in and out as each chapter passes; the text scrolls over it like a page, and one ink line runs
 * through every chapter to the contact. `data-line` lists that chapter's line waypoints as
 * "x%,share-of-height" pairs.
 */
export default function PaperStory() {
  const t = useTranslations("paperStory");
  const root = useRef<HTMLDivElement>(null);
  const lineClip = useId();
  useStory(root);
  return (
    <div ref={root} className="paper-story">
      <svg className="story__line" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <clipPath id={lineClip} clipPathUnits="userSpaceOnUse">
            <rect className="story__line-fill" width="0" height="0" />
          </clipPath>
        </defs>
        <path className="story__line-grey" />
        <path className="story__line-ink" clipPath={`url(#${lineClip})`} />
      </svg>

      <MobileStory />

      <div className="story__pinned">
        <StoryVisuals />

        <section
          className="story-chapter paper-origin"
          data-story-chapter="source"
          data-line="50,0.08;63,0.23;72,0.5;44,0.86"
          aria-labelledby="paper-origin-title"
        >
          <header className="story-text story-text--centre">
            <p className="paper-caption">{t("origin.eyebrow")}</p>
            <h2 id="paper-origin-title">{t("origin.title")}</h2>
            <p className="story-text__note">{t("origin.annotation")}</p>
          </header>
          <div className="story-asides">
            <p>
              <span className="story-asides__rule" />
              {t("origin.left")}
            </p>
            <p>
              <span className="story-asides__rule" />
              {t("origin.right")}
            </p>
          </div>
        </section>

        <section
          className="story-chapter paper-fields"
          data-story-chapter="fields"
          data-line="24,0.1;13,0.36;50,0.78"
          aria-labelledby="paper-fields-title"
        >
          <header className="story-text story-text--centre">
            <p className="paper-caption">{t("fields.eyebrow")}</p>
            <h2 id="paper-fields-title">{t("fields.title")}</h2>
          </header>
          <div className="story-field-note story-text">
            <p className="paper-caption">{t("fields.place")}</p>
            <p className="story-text__note">{t("fields.note")}</p>
          </div>
        </section>

        <section
          className="story-chapter paper-pakistan"
          data-story-chapter="pakistan"
          data-line="67,0.1;84,0.43;55,0.85"
          aria-labelledby="paper-pakistan-title"
        >
          <header className="story-text story-text--right">
            <p className="paper-caption">{t("pakistan.eyebrow")}</p>
            <h2 id="paper-pakistan-title">{t("pakistan.title")}</h2>
            <p className="story-text__note">{t("pakistan.note")}</p>
          </header>
          <p className="story-text story-text--right story-origin-note paper-caption">
            {t("pakistan.caption")}
          </p>
        </section>

        <section
          className="story-chapter paper-hamburg"
          data-story-chapter="hamburg"
          data-line="62,0.1;78,0.42;66,0.82"
          aria-labelledby="paper-hamburg-title"
        >
          <header className="story-text story-text--right">
            <p className="paper-caption">{t("hamburg.eyebrow")}</p>
            <h2 id="paper-hamburg-title">{t("hamburg.title")}</h2>
          </header>
          <div className="story-text story-text--right story-list paper-hamburg__facts">
            <p>
              <span className="paper-point" />
              {t("hamburg.stock")}
            </p>
            <p>{t("hamburg.packs")}</p>
            <p>{t("hamburg.delivery")}</p>
            <span className="story-text__coords" aria-hidden="true">
              53.55° N / 9.99° E
            </span>
          </div>
        </section>
      </div>

      <section
        className="story-chapter paper-buying"
        data-story-chapter="buying"
        data-line="50,0.08;12,0.5;50,0.95"
        aria-labelledby="paper-buying-title"
      >
        <header className="story-text story-text--centre">
          <p className="paper-caption">{t("buying.eyebrow")}</p>
          <h2 id="paper-buying-title">{t("buying.title")}</h2>
        </header>
        <div className="paper-buying__paths">
          {(["home", "kitchen", "trade"] as const).map((kind) => (
            <Link
              key={kind}
              className="paper-buying__path"
              href={
                kind === "home" ? "/range" : { pathname: "/enquiry", query: { purpose: "quote" } }
              }
              prefetch={false}
            >
              <BuyingSketch kind={kind} />
              <h3>{t(`buying.${kind}.title`)}</h3>
              <p>{t(`buying.${kind}.note`)}</p>
              <span className="paper-buying__action">
                {t(`buying.${kind}.action`)}
                <ArrowIcon />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section
        className="story-chapter paper-label"
        data-story-chapter="label"
        data-line="82,0.2;62,0.55;20,0.9"
        aria-labelledby="paper-label-title"
      >
        <div className="paper-label__copy">
          <p className="paper-caption">{t("label.eyebrow")}</p>
          <h2 id="paper-label-title">
            {t("label.title")}
            <br />
            <em>{t("label.accent")}</em>
          </h2>
          <p className="paper-label__note">{t("label.note")}</p>
          <ArrowLink href="/private-label" prefetch={false} variant="glass">
            {t("label.action")}
          </ArrowLink>
        </div>
        <div className="paper-label__pack">
          <PaperPack />
          <p className="paper-caption">{t("label.caption")}</p>
        </div>
      </section>

      <section
        className="paper-range"
        data-story-chapter="range"
        data-line="4,0.06;3,0.55;5,0.98"
        aria-labelledby="paper-range-title"
      >
        <PaperUniverse />
        <div className="paper-range__intro">
          <div className="paper-range__heading">
            <p className="paper-caption">{t("range.eyebrow")}</p>
            <h2 id="paper-range-title">{t("range.title")}</h2>
            <ArrowLink href="/range" prefetch={false} variant="glass" size="large">
              {t("range.action")}
            </ArrowLink>
            <PaperRangeRock />
          </div>
          <div className="paper-range__film">
            <EngravedFilm films={FILMS} weight={0.7} cross={0.35} strength={0.5} pitchPx={3.5} />
          </div>
        </div>
        <PaperProductRail />
        <div className="paper-sourcing">
          <div>
            <p className="paper-caption">{t("sourcing.eyebrow")}</p>
            <h3>{t("sourcing.title")}</h3>
            <p>{t("sourcing.note")}</p>
          </div>
          <ArrowLink
            href={{ pathname: "/enquiry", query: { purpose: "quote" } }}
            prefetch={false}
            variant="glass"
          >
            {t("sourcing.action")}
          </ArrowLink>
        </div>
      </section>

      <PaperContact />
    </div>
  );
}
