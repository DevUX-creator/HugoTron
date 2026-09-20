/**
 * One icon per capability, drawn rather than ticked.
 *
 * DRAWN FROM THIS BUSINESS, not from an icon set. A stock globe, folder and
 * headset would sit on any supplier's page; these are a container ship on the
 * Elbe, a stamped certificate, the company's own three pack sizes, a sack on a
 * pallet, and the blank arch panel a private-label bag carries where the brand
 * would go. Each one says which line it belongs to before the line is read,
 * which is the only reason to spend anything on an icon here.
 *
 * EVERY SHAPE CARRIES `pathLength="100"`. That normalises each stroke to a
 * length of 100 whatever its real geometry, so one `stroke-dasharray: 100` in
 * the stylesheet draws all of them at the same rate — no per-icon measuring,
 * and nothing to keep in sync when a path changes.
 */
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

type IconProps = { className?: string };

/** Direct import: a container ship, which is how all of it actually arrives. */
export function OriginIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 14h18l-2.2 5H5.2Z" pathLength={100} />
      <path d="M7 14V9.5h3.5V14" pathLength={100} />
      <path d="M12.5 14V6.5H17V14" pathLength={100} />
      <path d="M2.5 21.5c1.6-1 3.2-1 4.8 0s3.2 1 4.8 0 3.2-1 4.8 0 3.2 1 4.6 0" pathLength={100} />
    </svg>
  );
}

/** EU-compliant quality: a certificate with a stamped seal and its ribbon. */
export function DocumentIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4.5 3h11l3.5 3.5V15H4.5Z" pathLength={100} />
      <path d="M15.5 3v3.5H19" pathLength={100} />
      <path d="M7.5 7.5h6M7.5 10.5h4" pathLength={100} />
      <circle cx="15.5" cy="17" r="3.2" pathLength={100} />
      <path d="M13.6 19.6V23l1.9-1.3L17.4 23v-3.4" pathLength={100} />
    </svg>
  );
}

/** Flexible pack sizes: the 1 kg bag, the 5 kg bag, the 25 kg sack. */
export function PackSizesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M2.5 21v-5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v5Z" pathLength={100} />
      <path d="M9.5 21v-8.5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2V21Z" pathLength={100} />
      <path d="M16.5 21V9a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v12Z" pathLength={100} />
      <path d="M4 14v-1M11.5 10.5v-1M18.5 7V6" pathLength={100} />
    </svg>
  );
}

/** Wholesale: a tied sack standing on a pallet. */
export function PalletIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path
        d="M9.5 6.5c0-1 1.1-1.8 2.5-1.8s2.5.8 2.5 1.8c0 2 2.2 3.2 2.2 6.2V17H7.3v-4.3c0-3 2.2-4.2 2.2-6.2Z"
        pathLength={100}
      />
      <path d="M10.2 6.6h3.6" pathLength={100} />
      <path d="M3.5 19h17" pathLength={100} />
      <path d="M6 19v2.5M18 19v2.5" pathLength={100} />
      <path d="M3.5 21.5h17" pathLength={100} />
    </svg>
  );
}

/** Private label: the bag's arch panel, left blank for someone else's brand. */
export function LabelIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6.5 21V9a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v12Z" pathLength={100} />
      <path d="M10 7V5.6a2 2 0 0 1 4 0V7" pathLength={100} />
      <path d="M10 17.5v-3.2a2 2 0 0 1 4 0v3.2Z" pathLength={100} />
    </svg>
  );
}
