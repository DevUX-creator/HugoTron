import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import "./button.css";

type Variant = "primary" | "outline" | "ghost";

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  showArrow?: boolean;
  className?: string;
  /**
   * `data-*` attributes for the rendered element — the only extra attributes
   * this takes.
   */
  data?: Record<`data-${string}`, string>;
};

type LinkProps = CommonProps & {
  href: ComponentProps<typeof Link>["href"];
  onClick?: never;
  type?: never;
  disabled?: never;
};

type ActionProps = CommonProps & {
  href?: never;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

/**
 * Discriminated on `href`: renders a locale-aware Link or a real `<button>`.
 * Never a `<div>` with a click handler — keyboard and screen-reader behaviour
 * come free from the correct element.
 *
 * THE SHAPE is the morph cut from public/reference/shape-notch-card.png: the
 * label and the arrow are two fully-rounded surfaces separated by a hairline
 * gap, so they read as one form cut in two rather than as two controls. The
 * whole thing is a single focusable element — the gap is decoration.
 *
 * The arrow disc carries the accent. The accent used to fill the entire
 * button, which put a large muddy red field next to everything; as a disc it
 * lands as a small deliberate note instead.
 */
export default function Button(props: LinkProps | ActionProps) {
  const { children, variant = "primary", showArrow = true, className, data } = props;

  const classes = ["btn", `btn--${variant}`, className].filter(Boolean).join(" ");

  const content = (
    <>
      <span className="btn__label">{children}</span>
      {showArrow ? (
        <span className="btn__disc" aria-hidden="true">
          <svg
            className="btn__arrow"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            focusable="false"
          >
            <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      ) : null}
    </>
  );

  if ("href" in props && props.href !== undefined) {
    return (
      <Link href={props.href} className={classes} {...data}>
        {content}
      </Link>
    );
  }

  const { onClick, type = "button", disabled = false } = props as ActionProps;

  return (
    <button className={classes} type={type} onClick={onClick} disabled={disabled} {...data}>
      {content}
    </button>
  );
}
