/**
 * One mark per capability.
 *
 * ABSTRACT GEOMETRY, NOT PICTOGRAMS — see public/reference/icon-style-geometric.png.
 * These signify by RELATIONSHIP rather than by depiction: a line running
 * straight through two circles is directness, a circle sitting exactly inside
 * a square is conformity, nested squares are the same thing at three sizes.
 *
 * An earlier set drew the literal objects — a container ship, a sack on a
 * pallet, a certificate with a ribbon. They were recognisable and they were
 * wrong for this page: at 1.35em a drawing of a ship is a smudge, and six
 * little illustrations in a column pull harder than the sentences beside them.
 * Geometry stays legible at any size and stays quiet.
 *
 * The set is deliberately built from ONE vocabulary — circle, square, diamond,
 * straight line — so the five read as a family rather than as five drawings.
 *
 * EVERY SHAPE CARRIES `pathLength="100"`, which normalises each stroke to the
 * same length whatever its real geometry. One `stroke-dasharray: 100` in the
 * stylesheet then draws all of them at one rate, with nothing to measure and
 * nothing to keep in sync when a shape changes.
 */
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

type IconProps = { className?: string };

/** Direct import — one axis, straight through origin and destination. */
export function OriginIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M2 12h20" pathLength={100} />
      <circle cx="7" cy="12" r="3" pathLength={100} />
      <circle cx="16.5" cy="12" r="5.5" pathLength={100} />
    </svg>
  );
}

/** Compliance — the circle sits exactly inside the square. */
export function DocumentIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" pathLength={100} />
      <circle cx="12" cy="12" r="5.75" pathLength={100} />
    </svg>
  );
}

/** Pack sizes — one form at three scales. */
export function PackSizesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="2.5" width="19" height="19" pathLength={100} />
      <rect x="6.5" y="6.5" width="11" height="11" pathLength={100} />
      <rect x="10.25" y="10.25" width="3.5" height="3.5" pathLength={100} />
    </svg>
  );
}

/** Wholesale — quantity as stacked layers. */
export function PalletIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 2.5 21 7.5 12 12.5 3 7.5Z" pathLength={100} />
      <path d="m3 12 9 5 9-5" pathLength={100} />
      <path d="m3 16.5 9 5 9-5" pathLength={100} />
    </svg>
  );
}

/** Private label — their mark over our product, and the overlap is the work. */
export function LabelIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="9" cy="12" r="6.25" pathLength={100} />
      <circle cx="15" cy="12" r="6.25" pathLength={100} />
    </svg>
  );
}
