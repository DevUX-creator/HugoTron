import type { ComponentProps } from "react";
import ArrowIcon from "./ArrowIcon";
import "./button.css";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "outline" | "ghost";
  showArrow?: boolean;
};

/** Actions use a native button; navigation uses ArrowLink. Native props, ARIA and ref pass through. */
export default function Button({
  children,
  variant = "primary",
  showArrow = true,
  className,
  type = "button",
  ...attributes
}: ButtonProps) {
  const classes = ["btn", `btn--${variant}`, className].filter(Boolean).join(" ");
  return (
    <button {...attributes} type={type} className={classes}>
      <span className="btn__fill" aria-hidden="true" />
      <span className="btn__label">{children}</span>
      {showArrow && <ArrowIcon className="btn__arrow" />}
    </button>
  );
}
