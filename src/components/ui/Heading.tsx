import type { ReactNode, Ref } from "react";
import "./heading.css";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
/** Non-heading elements that may carry display type — see `as` below. */
type DisplayElement = "p" | "dd";
type HeadingSize =
  "claim" | "hero-xl" | "hero-lg" | "hero-md" | "title-xl" | "title-lg" | "title-md" | "title-sm";

type HeadingProps = {
  children: ReactNode;
  ref?: Ref<HTMLHeadingElement>;
  /**
   * Document outline level — chosen for semantics, independent of size.
   *
   * Or a non-heading element, for display type that is NOT a heading: a
   * figure's value is a number, and "8+" is not an entry in the outline. A
   * `<dd>` at `hero-lg` is drawn exactly as an `<h2>` at `hero-lg` is — the
   * type comes from the classes, not the tag — and says nothing to a screen
   * reader's heading list.
   */
  as: HeadingLevel | DisplayElement;
  /** Visual size token — chosen for design, independent of level. */
  size: HeadingSize;
  uppercase?: boolean;
  id?: string;
  className?: string;
};

/**
 * Decoupling `as` from `size` is the point: a section's second heading can look
 * large without becoming an <h1>, so the document outline stays correct for
 * screen readers and search engines.
 */
export default function Heading({
  children,
  ref,
  as,
  size,
  uppercase = false,
  id,
  className,
}: HeadingProps) {
  const Tag = typeof as === "number" ? (`h${as}` as const) : as;
  const classes = [
    "heading",
    `heading--${size}`,
    uppercase ? "heading--uppercase" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag ref={ref} id={id} className={classes}>
      {children}
    </Tag>
  );
}
