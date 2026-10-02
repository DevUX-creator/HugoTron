import { useId, type CSSProperties } from "react";
import Image from "next/image";
import HarbourFilm from "./HarbourFilm";

/**
 * The pinned picture plane of the paper story. Text scrolls over it; each chapter's pictures
 * wipe in and out (story.css) as that chapter passes. Every picture is decorative.
 *
 * A layer is placed by `x`/`y`/`w` (percent of the frame) and timed against its chapter's
 * progress: `a` is when it starts to wipe in, `z` when it starts to wipe out. `wipe` names the
 * directions (in-*, out-*); `depth` drives pointer parallax.
 */
type Layer = {
  src: string;
  width: number;
  height: number;
  x: number;
  y: number;
  w: number;
  a: number;
  z: number;
  wipe: string;
  depth?: number;
  className?: string;
  /** Joins the scene a few seconds after its chapter settles, rather than with the scroll. */
  timed?: boolean;
  /** Shifts the layer up by this share of its own height: `y` then marks where it rests. */
  lift?: number;
};

const IMG = "/images/paper-world";

const CHAPTERS: Record<"source" | "fields" | "pakistan" | "hamburg", Layer[]> = {
  source: [
    {
      src: `${IMG}/source-column.webp`,
      width: 720,
      height: 1080,
      x: -9,
      y: 18,
      w: 38,
      a: 0.08,
      z: 0.67,
      wipe: "in-up out-left",
      depth: -1.1,
      className: "story-layer--tilt-left story-layer--depart-left",
    },
    {
      src: `${IMG}/source-column.webp`,
      width: 720,
      height: 1080,
      x: 71,
      y: 22,
      w: 33,
      a: 0.12,
      z: 0.68,
      wipe: "in-up out-right",
      depth: -0.6,
      className: "story-layer--mirror story-layer--tilt-right story-layer--depart-right",
    },
    {
      src: `${IMG}/source-cloud.webp`,
      width: 1200,
      height: 480,
      x: -9,
      y: 69,
      w: 43,
      a: 0.22,
      z: 0.69,
      wipe: "in-right out-left",
      depth: 1.3,
      className: "story-layer--low-cloud story-layer--depart-left",
    },
    {
      src: `${IMG}/source-cloud.webp`,
      width: 1200,
      height: 480,
      x: 74,
      y: 26,
      w: 33,
      a: 0.19,
      z: 0.7,
      wipe: "in-left out-right",
      depth: 0.4,
      className: "story-layer--faint story-layer--depart-right",
    },
  ],
  fields: [
    {
      src: `${IMG}/mountains.webp`,
      width: 1400,
      height: 933,
      x: 18,
      y: 20,
      w: 70,
      a: 0.29,
      z: 0.74,
      wipe: "in-up out-up",
      depth: -0.25,
      className: "story-layer--mountains",
      timed: true,
    },
    {
      src: `${IMG}/field.webp`,
      width: 1400,
      height: 933,
      x: -2,
      y: 16,
      w: 104,
      a: 0.14,
      z: 0.77,
      wipe: "in-up out-left",
      depth: 0.55,
      className: "story-layer--field-left story-layer--depart-left",
    },
    {
      src: `${IMG}/field.webp`,
      width: 1400,
      height: 933,
      x: -2,
      y: 16,
      w: 104,
      a: 0.14,
      z: 0.77,
      wipe: "in-up out-right",
      depth: 0.55,
      className: "story-layer--field-right story-layer--depart-right",
    },
    {
      src: `${IMG}/growers.webp`,
      width: 700,
      height: 700,
      x: 65,
      y: 55,
      w: 13,
      a: 0.34,
      z: 0.73,
      wipe: "in-up out-right",
      depth: 1.25,
      timed: true,
      className: "story-layer--growers story-layer--depart-right",
    },
    {
      src: `${IMG}/rice.webp`,
      width: 744,
      height: 1256,
      x: 2,
      y: 50,
      w: 13,
      a: 0.24,
      z: 0.74,
      wipe: "in-up out-left",
      depth: 1.7,
      className: "story-layer--sway story-layer--depart-left",
    },
  ],
  pakistan: [
    {
      src: `${IMG}/mountains.webp`,
      width: 1400,
      height: 933,
      x: -4,
      y: -6,
      w: 95,
      a: 0.16,
      z: 0.76,
      wipe: "in-left out-up",
      depth: -0.6,
      className: "story-layer--mirror story-layer--mountains",
    },
    {
      src: `${IMG}/origins.webp`,
      width: 1280,
      height: 853,
      x: -11,
      y: 32,
      w: 68,
      a: 0.2,
      z: 0.76,
      wipe: "in-up out-left",
      depth: 0.5,
      className: "story-layer--depart-left",
    },
    {
      src: `${IMG}/rice.webp`,
      width: 744,
      height: 1256,
      x: 80,
      y: 59,
      w: 16,
      a: 0.35,
      z: 0.72,
      wipe: "in-up out-right",
      depth: 1.5,
      className: "story-layer--sway story-layer--depart-right",
    },
    {
      src: `${IMG}/source-cloud.webp`,
      width: 1200,
      height: 480,
      x: -12,
      y: 65,
      w: 43,
      a: 0.34,
      z: 0.69,
      wipe: "in-right out-left",
      depth: 1.3,
      className: "story-layer--faint story-layer--depart-left",
    },
  ],
  hamburg: [
    {
      src: `${IMG}/sacks.webp`,
      width: 974,
      height: 728,
      x: 45,
      y: 69,
      w: 14,
      a: 0.36,
      z: 0.75,
      wipe: "in-up out-right",
      depth: 1.1,
      className: "story-layer--depart-right",
    },
    {
      src: `${IMG}/gulls.webp`,
      width: 1264,
      height: 655,
      x: 8,
      y: 24,
      w: 22,
      a: 0.26,
      z: 0.69,
      wipe: "in-right out-up",
      depth: 0.7,
      className: "story-layer--flock",
      timed: true,
    },
    {
      src: `${IMG}/truck.webp`,
      width: 1192,
      height: 592,
      x: 58,
      y: 76,
      w: 17,
      a: 0.4,
      z: 0.75,
      wipe: "in-left out-right",
      depth: 1.1,
      className: "story-layer--drive",
    },
  ],
};

export type StoryChapter = keyof typeof CHAPTERS;
export const VISUAL_CHAPTERS = Object.keys(CHAPTERS) as StoryChapter[];

function style(layer: Layer) {
  return {
    "--x": `${layer.x}%`,
    "--y": `${layer.y}%`,
    "--w": `${layer.w}%`,
    "--a": layer.a,
    "--z": layer.z,
    "--depth": layer.depth ?? 0,
    "--lift": `${-(layer.lift ?? 0) * 100}%`,
  } as CSSProperties;
}

function Picture({
  layer,
  ink,
  sizes,
}: {
  layer: Pick<Layer, "src" | "width" | "height">;
  ink: string;
  sizes: string;
}) {
  return (
    <Image
      src={layer.src}
      alt=""
      width={layer.width}
      height={layer.height}
      sizes={sizes}
      style={{ filter: `url(#${ink})` }}
    />
  );
}

export default function StoryVisuals() {
  const ink = useId();
  return (
    <div className="story__visuals" aria-hidden="true">
      <svg width="0" height="0" className="story__defs">
        <defs>
          {/* Maps every engraving's ink and highlights into the paper palette. */}
          <filter id={ink} colorInterpolationFilters="sRGB">
            <feComponentTransfer>
              <feFuncR type="linear" slope="0.8" intercept="0.05" />
              <feFuncG type="linear" slope="0.67" intercept="0.13" />
              <feFuncB type="linear" slope="0.527" intercept="0.19" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      {VISUAL_CHAPTERS.map((chapter) => (
        <div key={chapter} className="story__group" data-story-group={chapter}>
          {chapter === "hamburg" && <HarbourFilm ink={ink} />}
          {CHAPTERS[chapter].map((layer, index) => (
            <div
              key={index}
              className={["story-layer", layer.wipe, layer.className].filter(Boolean).join(" ")}
              data-timed={layer.timed || undefined}
              style={style(layer)}
            >
              <div className="story-layer__motion">
                <Picture layer={layer} ink={ink} sizes={`${Math.round(layer.w * 1.2)}vw`} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
