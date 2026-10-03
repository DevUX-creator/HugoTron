import { useId } from "react";

/** Hatched rocks adrift around the products, like the opening World's fragments, in ink. */
const ROCKS = [
  {
    x: 1270,
    y: 190,
    scale: 1.9,
    turn: -14,
    path: "M0 22 26-6 74 0 92 34 48 70 10 58Z",
    facets: "M0 22 38 28 26-6M38 28 74 0M38 28 48 70M38 28 92 34",
  },
  {
    x: 30,
    y: 880,
    scale: 1.7,
    turn: 22,
    path: "M0 30 18 0 60 6 80 40 50 66 12 56Z",
    facets: "M18 0 34 30 60 6M34 30 80 40M34 30 12 56M0 30 34 30",
  },
  {
    x: 1310,
    y: 960,
    scale: 1.3,
    turn: 40,
    path: "M0 18 22 0 58 10 62 44 26 56 4 44Z",
    facets: "M22 0 30 26 58 10M30 26 62 44M30 26 4 44",
  },
] as const;

const RANGE_ROCK = {
  path: "M0 16 20 0 48 8 52 34 22 44Z",
  facets: "M20 0 26 20 48 8M26 20 22 44M26 20 52 34",
};

/** A few small crosses and floating rocks behind the products. Nothing crosses the cards. */
export default function PaperUniverse() {
  const hatch = useId();
  return (
    <div className="paper-universe" aria-hidden="true">
      <svg viewBox="0 0 1440 1100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern
            id={hatch}
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(28)"
          >
            <path d="M0 0V4" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <g className="paper-universe__stars">
          {Array.from({ length: 38 }, (_, i) => (
            <path key={i} d={`M${(i * 347 + 59) % 1410} ${(i * 181 + 71) % 1000}h6m-3 -3v6`} />
          ))}
        </g>
        <g className="paper-universe__rocks">
          {ROCKS.map((rock, i) => (
            <g
              key={i}
              className="paper-universe__rock"
              transform={`translate(${rock.x} ${rock.y}) rotate(${rock.turn}) scale(${rock.scale})`}
            >
              <path d={rock.path} fill={`url(#${hatch})`} />
              <path d={rock.path} />
              <path d={rock.facets} />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

/** Anchored beside the range heading so the background's crop cannot put it on the CTA. */
export function PaperRangeRock() {
  const hatch = useId();
  const rock = RANGE_ROCK;
  return (
    <svg className="paper-range__rock" viewBox="-5 -5 65 58" aria-hidden="true">
      <defs>
        <pattern
          id={hatch}
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(28)"
        >
          <path d="M0 0V4" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
      </defs>
      <path d={rock.path} fill={`url(#${hatch})`} />
      <path d={rock.path} />
      <path d={rock.facets} />
    </svg>
  );
}
