import "./grainCluster.css";

/** Which arrangement to draw. */
type GrainClusterShape = "chevron" | "square" | "stack";

/**
 * EVERY NUMBER BELOW WAS MEASURED, NOT DRAWN.
 *
 * Three attempts at these marks were eyeballed from the reference and all
 * three were wrong the same way: the grains were too small, too upright, and
 * taller than they were wide. Connected-component analysis over the reference
 * strip gave the truth — each grain is rx 3.6 / ry 2.7 in a 32-unit box, laid
 * over between 55° and 80°.
 *
 * THE ANGLE IS WHAT MAKES IT RICE. At ±20° a cluster reads as a handful of
 * dots; at ±57° the same five ellipses read as grain, because that is the
 * angle long grain actually falls at. It was the single biggest error in the
 * earlier versions and the hardest to see by looking.
 */
const GRAIN = { rx: 3.6, ry: 2.7 };

/** Measured centroids, normalised to the 32-unit box, with the ribbon between. */
const SHAPES: Record<GrainClusterShape, { ribbon: string; grains: [number, number, number][] }> = {
  /* Three grains, the ribbon a chevron through them: two on the left edge,
     one out at the point. */
  chevron: {
    ribbon: "M7.5 8 L24.1 15.7 L7.5 23.5",
    grains: [
      [7.5, 8, -58],
      [24.1, 15.7, -59],
      [7.5, 23.5, 59],
    ],
  },
  /* Four corners and one in the middle, all laid over near vertical. The
     ribbon runs the rising diagonal behind them. */
  square: {
    ribbon: "M7.3 23.2 L24.3 8.2",
    grains: [
      [7.3, 8.2, -78],
      [24.3, 8.2, 77],
      [15.6, 15.7, -77],
      [7.3, 23.2, -79],
      [24.3, 23.2, 80],
    ],
  },
  /* A STAIRCASE: a bottom row of three, one stepping up at the middle, one
     higher again at the right, with the ribbon vertical up the right-hand
     column. This is the mark that says the claim beside it — grain
     accumulating into a load.

     It took four goes, and the three before it were all invented rather than
     measured: four grains round a bar (a smudge at 32px), one grain leading
     into a handful (a comet), and a six-grain pyramid that was the right idea
     at the wrong count and the wrong angle. The reference has five grains and
     the staircase is the whole figure. */
  stack: {
    ribbon: "M23.7 9 L23.7 23",
    grains: [
      [23.7, 8.1, -55],
      [15.9, 13.6, -58],
      [8, 23.8, -59],
      [15.9, 23.8, 56],
      [23.7, 23.8, -55],
    ],
  },
};

/**
 * A handful of rice, as a mark.
 *
 * The language comes from the reference strip: dark grains set at the vertices
 * of a simple figure, with a pale ribbon running between them. The ribbon is
 * what makes it a MARK rather than a scatter; the grains are what stop the
 * figure being an abstract icon that could belong to anyone.
 *
 * BOTH PARTS ARE `currentColor`. The grains take it straight and the ribbon
 * takes it at a fraction (see grainCluster.css), so the whole thing inverts
 * with the theme instead of needing a light copy and a dark one. In the
 * reference the grains are dark on pale; on this ground it is the other way
 * round and neither file had to change.
 *
 * Decorative: `aria-hidden`, and the paragraph beside it carries the meaning.
 */
export default function GrainCluster({
  shape,
  className,
}: {
  shape: GrainClusterShape;
  className?: string;
}) {
  const { ribbon, grains } = SHAPES[shape];

  return (
    <svg
      className={["grain-cluster", className].filter(Boolean).join(" ")}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path className="grain-cluster__ribbon" d={ribbon} strokeLinecap="round" />
      {grains.map(([cx, cy, angle]) => (
        <ellipse
          key={`${cx}-${cy}-${angle}`}
          className="grain-cluster__grain"
          cx={cx}
          cy={cy}
          rx={GRAIN.rx}
          ry={GRAIN.ry}
          transform={`rotate(${angle} ${cx} ${cy})`}
        />
      ))}
    </svg>
  );
}
