import type { ReactNode } from "react";
import "./sectionLabel.css";

/**
 * A section's kicker, with the turned arrow in front of it.
 *
 * THE ARROW IS THE DEVICE AND THE TYPE IS NOT. This sets no size, no weight and
 * no colour — it lays out an arrow beside whatever the caller passes and scales
 * the arrow in `em`, so the same mark sits in front of the home page's small
 * uppercase eyebrows and in front of the About chapters' larger gold labels
 * without either having to give up its own voice. A component that also decided
 * the type would force one of those two to change to get the other.
 *
 * Drawn inline rather than pulled from an icon package: it is one path, it
 * inherits `currentColor`, and this project has no icon dependency to add one
 * to. `aria-hidden` because it is a bullet, not information.
 */
export default function SectionLabel({
  children,
  id,
  className,
}: {
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <p className={["section-label", className].filter(Boolean).join(" ")} id={id}>
      <svg
        className="section-label__arrow"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M4 4V5.4C4 8.76031 4 10.4405 4.65396 11.7239C5.2292 12.8529 6.14708 13.7708 7.27606 14.346C8.55953 15 10.2397 15 13.6 15H20M20 15L15 10M20 15L15 20"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{children}</span>
    </p>
  );
}
