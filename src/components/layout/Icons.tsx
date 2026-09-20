/**
 * Header icons.
 *
 * Inline SVG rather than a sprite or an icon package — there are four, they
 * never change, and this keeps the header free of a runtime dependency.
 *
 * Drawn to carry some weight: a heavier stroke than a default icon set, square
 * joins on the geometric marks, and silhouettes with a bit of asymmetry, so
 * they read as part of the design rather than as placeholders. All are
 * `aria-hidden` — the accessible name lives on the control that wraps them.
 */
type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

/** Two bars, the lower one short — the asymmetry is the whole point. */
export function MenuIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 9h18M3 16h11" />
    </svg>
  );
}

/** Magnifier with a short, heavy handle set at 45°. */
export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.6 15.6 4.4 4.4" />
    </svg>
  );
}

/** Head and shoulders, both drawn as arcs so the pair reads as one gesture. */
export function AccountIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8" r="3.75" />
      <path d="M4.5 20.5c0-4 3.4-6.25 7.5-6.25s7.5 2.25 7.5 6.25" />
    </svg>
  );
}

/** A market basket rather than a shopping bag — closer to what is being sold,
 *  and the two staves give it a silhouette a plain bag does not have. */
export function CartIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 8h18l-1.6 10.4a2.2 2.2 0 0 1-2.2 1.9H6.8a2.2 2.2 0 0 1-2.2-1.9Z" />
      <path d="m8.5 8 3.5-5 3.5 5" />
      <path d="M9.5 12v4M14.5 12v4" />
    </svg>
  );
}
