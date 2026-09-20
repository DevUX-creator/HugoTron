import "./placeholder.css";

type PlaceholderProps = {
  /** CSS aspect-ratio, e.g. "16 / 9". Omit when a parent sets the box. */
  ratio?: string;
  /** Shown faintly in the corner so a grey wall is still readable in review. */
  label?: string;
  className?: string;
  /** Rounds the box. Off for full-bleed media. */
  rounded?: boolean;
  /**
   * `dark` stands in for a photograph that light type will sit on.
   *
   * Not cosmetic: a light placeholder under white hero copy hides a contrast
   * problem that only appears when the real photograph arrives. Standing in at
   * roughly a photo's weight means the layout is reviewed under the conditions
   * it will actually ship in.
   */
  tone?: "light" | "dark";
};

/**
 * Stand-in for photography that does not exist yet.
 *
 * Every product and lifestyle image on the site is a grey box until the client
 * supplies originals (content/strategy/kundenfragebogen.md §A). Keeping them
 * behind ONE component means swapping in `next/image` later is a search for
 * `<Placeholder`, not a hunt through every section.
 *
 * `aria-hidden` and no alt text: an image that does not exist should say
 * nothing to a screen reader rather than announce a placeholder.
 */
export default function Placeholder({
  ratio,
  label,
  className,
  rounded = true,
  tone = "light",
}: PlaceholderProps) {
  return (
    <div
      className={[
        "placeholder",
        `placeholder--${tone}`,
        rounded ? "placeholder--rounded" : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={ratio ? { aspectRatio: ratio } : undefined}
      aria-hidden="true"
    >
      {label ? <span className="placeholder__label">{label}</span> : null}
    </div>
  );
}
