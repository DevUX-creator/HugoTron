import type { ReactNode } from "react";
import Container, { type ContainerWidth } from "./Container";
import "./section.css";

type SectionProps = {
  children: ReactNode;
  id?: string;
  /** Flip this subtree to the dark palette (see section.css). */
  inverse?: boolean;
  /** Tint the background one step without inverting the text palette. */
  surface?: "surface" | "muted";
  /** Set false when the section needs to bleed to the viewport edge. */
  contained?: boolean;
  width?: ContainerWidth;
  ariaLabel?: string;
  className?: string;
};

/**
 * The vertical-rhythm and surface primitive. Sections must not set their own
 * block padding — `.section` owns it, so rhythm stays consistent site-wide.
 */
export default function Section({
  children,
  id,
  inverse = false,
  surface,
  contained = true,
  width = "default",
  ariaLabel,
  className,
}: SectionProps) {
  const classes = [
    "section",
    "section-block",
    inverse ? "section-block--inverse" : null,
    surface ? `section-block--${surface}` : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section id={id} className={classes} aria-label={ariaLabel}>
      {contained ? <Container width={width}>{children}</Container> : children}
    </section>
  );
}
