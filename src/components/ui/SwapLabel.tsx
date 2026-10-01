import type { ReactNode } from "react";

type SwapLabelProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Two stacked copies of a label. The host shifts the pair up by exactly one
 * row on hover, so the second copy takes the first's place — a swap rather
 * than a colour change.
 *
 * EXTRACTED because it was written twice, in the header's nav and in the
 * menu's, and the two had already drifted. More to the point, the mechanic has
 * one trap and it caught me in both copies: `overflow` clips at the PADDING
 * box, not the content box, so any padding on the host sits INSIDE the window
 * and both faces show. `.swap-host` in globals.css owns the height, the clip
 * and the rule that padding belongs on the element around it.
 *
 * The second copy is `aria-hidden`, so the label is announced once.
 */
export default function SwapLabel({ children, className }: SwapLabelProps) {
  return (
    <span className={["swap", className].filter(Boolean).join(" ")}>
      <span className="swap__face">{children}</span>
      <span className="swap__face" aria-hidden="true">
        {children}
      </span>
    </span>
  );
}
