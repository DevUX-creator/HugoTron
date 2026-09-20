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
   * this takes. A scene that clicks a link on the reader's behalf finds it by
   * one of these (`data-service-route`), and the link has to be a real
   * `<Button>` so it looks like every other call to action.
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
 * The inner structure is what makes the hover wipe work: `__fill` is the layer
 * that slides up, and the label and arrow sit above it. `__fill` is
 * `aria-hidden` because it is purely decorative, and the label is wrapped so
 * its colour can flip in step with the wipe without touching the arrow.
 */
export default function Button(props: LinkProps | ActionProps) {
  const { children, variant = "primary", showArrow = true, className, data } = props;

  const classes = ["btn", `btn--${variant}`, className].filter(Boolean).join(" ");

  const content = (
    <>
      <span className="btn__fill" aria-hidden="true" />
      <span className="btn__label">{children}</span>
      {showArrow ? (
        <svg
          className="btn__arrow"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
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
