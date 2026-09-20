/**
 * One icon per capability, drawn rather than ticked.
 *
 * Six identical ticks said only "this is a list". A mark per line says what
 * the line is about before it is read, which is the whole reason to spend
 * anything on an icon here.
 *
 * EVERY PATH CARRIES `pathLength="100"`. That normalises each stroke to a
 * length of 100 whatever its real geometry, so one `stroke-dasharray: 100` in
 * the stylesheet draws all of them at the same rate — no per-icon measuring,
 * and nothing to keep in sync when a path changes.
 */
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  pathLength: 100,
  "aria-hidden": true,
  focusable: false,
} as const;

type IconProps = { className?: string };

/** Direct import: a route leaving a point of origin. */
export function OriginIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="5" cy="19" r="2.5" pathLength={100} />
      <path d="M7.5 17C11 13 14 9.5 20 5" pathLength={100} />
      <path d="M20 10.5V5h-5.5" pathLength={100} />
    </svg>
  );
}

/** EU-compliant quality and documentation: a stamped document. */
export function DocumentIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 3h8l4 4v14H6Z" pathLength={100} />
      <path d="M14 3v4h4" pathLength={100} />
      <path d="m9 14 2 2 4-4" pathLength={100} />
    </svg>
  );
}

/** Flexible pack sizes: three packs, three sizes. */
export function PackSizesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="13" width="6" height="8" rx="1" pathLength={100} />
      <rect x="10" y="9" width="5" height="12" rx="1" pathLength={100} />
      <rect x="16" y="4" width="5" height="17" rx="1" pathLength={100} />
    </svg>
  );
}

/** Wholesale: sacks stacked on a pallet. */
export function PalletIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 18h18" pathLength={100} />
      <path d="M6 18v3M18 18v3" pathLength={100} />
      <rect x="5" y="10" width="6" height="6" rx="1" pathLength={100} />
      <rect x="13" y="10" width="6" height="6" rx="1" pathLength={100} />
      <rect x="9" y="3" width="6" height="6" rx="1" pathLength={100} />
    </svg>
  );
}

/** Private label: a tag, for someone else's brand. */
export function LabelIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12.5 3H21v8.5L11 21.5 2.5 13Z" pathLength={100} />
      <circle cx="17" cy="7" r="1.6" pathLength={100} />
    </svg>
  );
}

/** Personal support: someone on the other end of it. */
export function SupportIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 18v-5a8 8 0 0 1 16 0v5" pathLength={100} />
      <path d="M4 14h2.5a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4Z" pathLength={100} />
      <path d="M20 14h-2.5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1H20Z" pathLength={100} />
    </svg>
  );
}
