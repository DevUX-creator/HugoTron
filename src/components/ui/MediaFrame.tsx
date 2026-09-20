import type { ReactNode } from "react";
import Placeholder from "./Placeholder";
import "./mediaFrame.css";

type MediaFrameProps = {
  /** CSS aspect-ratio, e.g. "4 / 3". */
  ratio?: string;
  /** Shown faintly while the box is still a placeholder. */
  label?: string;
  /** A circular control sitting in the notch — usually an arrow. */
  action?: ReactNode;
  /** Text that sits over the picture, top-left. */
  caption?: ReactNode;
  tone?: "light" | "dark";
  className?: string;
  children?: ReactNode;
};

/**
 * The shape every photograph sits in — see public/reference/shape-notch-card.png.
 *
 * A rounded frame with a STEP cut out of its bottom-right corner and a
 * circular control sitting in it. The step's inner corner is rounded convex
 * and both places where it meets the frame's edges run CONCAVE, at the same
 * radius — the geometry of the reference SVG.
 *
 * `--notch-size` is the control's diameter and `--notch-gap` the ring of page
 * showing around it, so the step always clears the control by the same margin.
 * `--notch-radius` rounds every corner of the step at once.
 *
 * Pass `action` to get the step. Without it this is just a rounded frame — a
 * picture with nothing to press should not have a corner missing.
 */
export default function MediaFrame({
  ratio,
  label,
  action,
  caption,
  tone = "dark",
  className,
  children,
}: MediaFrameProps) {
  return (
    <div
      className={["media-frame", action ? "media-frame--notched" : null, className]
        .filter(Boolean)
        .join(" ")}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      <div className="media-frame__picture">
        {children ?? <Placeholder rounded={false} tone={tone} {...(label ? { label } : {})} />}
      </div>

      {caption ? <div className="media-frame__caption">{caption}</div> : null}

      {action ? (
        <>
          {/* The step, and the two concave joins where it leaves the frame's
              edges. Ground-coloured boxes over the picture rather than a mask
              on it — see mediaFrame.css. */}
          <div className="media-frame__notch" aria-hidden="true">
            <span className="morph-fillet morph-fillet--inner media-frame__fillet media-frame__fillet--bottom" />
            <span className="morph-fillet morph-fillet--inner media-frame__fillet media-frame__fillet--right" />
          </div>
          <div className="media-frame__action">{action}</div>
        </>
      ) : null}
    </div>
  );
}
