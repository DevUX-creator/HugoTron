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
 * A rounded frame with a bite taken out of its bottom-right corner, and a
 * circular control sitting in the bite. The bite is a quarter-disc masked out
 * of the frame, so where it meets the two edges the corners run CONCAVE and
 * the picture appears to wrap around the button.
 *
 * `--notch-size` is the button's diameter and `--notch-gap` the ring of page
 * showing between picture and button; the mask radius is derived from both, so
 * the bite always clears the control by the same margin.
 *
 * Pass `action` to get the notch. Without it this is just a rounded frame —
 * a picture with nothing to press should not have a hole in it.
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
      {action ? <div className="media-frame__action">{action}</div> : null}
    </div>
  );
}
