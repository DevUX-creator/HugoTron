import type { ReactNode, Ref } from "react";
import "./sectionTag.css";

/** Shared outlined label for a section, matching the Who We Are marker. */
export default function SectionTag({
  children,
  className,
  ref,
}: {
  children: ReactNode;
  className?: string;
  ref?: Ref<HTMLParagraphElement>;
}) {
  return (
    <p ref={ref} className={["section-tag", className].filter(Boolean).join(" ")}>
      <span className="eyebrow tag">{children}</span>
    </p>
  );
}
