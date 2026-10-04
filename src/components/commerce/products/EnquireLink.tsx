"use client";

import { useTranslations } from "next-intl";
import ArrowLink from "@/components/ui/ArrowLink";
import type { Product } from "@/commerce/catalogue";

/** The one way to ask about a quoted product: opens the enquiry form already filled in. */
export default function EnquireLink({
  product,
  name,
  className,
  size,
  variant,
}: {
  product: Product | null;
  name: string;
  className?: string;
  size?: "default" | "large";
  variant?: "solid" | "glass";
}) {
  const t = useTranslations("cart");
  return (
    <ArrowLink
      href={
        product
          ? { pathname: "/contact", query: { product: product.slug } }
          : { pathname: "/contact" }
      }
      prefetch={false}
      {...(className ? { className } : {})}
      {...(size ? { size } : {})}
      {...(variant ? { variant } : {})}
      aria-label={t("enquireNamed", { product: name })}
    >
      {t("enquire")}
    </ArrowLink>
  );
}
