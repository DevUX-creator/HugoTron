import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import ArrowIcon from "./ArrowIcon";
import "./arrowLink.css";

type NativeHref = `#${string}` | `mailto:${string}` | `tel:${string}`;
type InternalAttributes = Omit<ComponentProps<typeof Link>, "children" | "className">;
type NativeAttributes = Omit<ComponentProps<"a">, "children" | "className" | "href"> & {
  href: NativeHref;
};
type ArrowLinkProps = (InternalAttributes | NativeAttributes) & {
  children: ReactNode;
  className?: string;
  size?: "default" | "large";
  variant?: "solid" | "glass";
};

function isNative(
  attributes: InternalAttributes | NativeAttributes,
): attributes is NativeAttributes {
  return typeof attributes.href === "string" && /^(#|mailto:|tel:)/.test(attributes.href);
}

/** Navigation uses a real anchor, with locale-aware internal URLs and native link attributes. */
export default function ArrowLink({
  children,
  className,
  size = "default",
  variant = "solid",
  ...attributes
}: ArrowLinkProps) {
  const classes = ["arrow-link", `arrow-link--${size}`, `arrow-link--${variant}`, className]
    .filter(Boolean)
    .join(" ");
  const content = (
    <>
      <span className="arrow-link__label">{children}</span>
      <span className="arrow-link__mark" aria-hidden="true">
        <ArrowIcon />
      </span>
    </>
  );
  return isNative(attributes) ? (
    <a {...attributes} className={classes} data-cursor="wrap" data-sound-hover>
      {content}
    </a>
  ) : (
    <Link {...attributes} className={classes} data-cursor="wrap" data-sound-hover>
      {content}
    </Link>
  );
}
