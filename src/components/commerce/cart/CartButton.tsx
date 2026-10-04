"use client";

import { useTranslations } from "next-intl";
import { CartIcon } from "@/components/layout/Icons";
import { useCart } from "./CartProvider";

export default function CartButton() {
  const t = useTranslations("cart");
  const { count, setOpen } = useCart();
  return (
    <button
      type="button"
      className="header__tool header__cart"
      aria-label={t("openCart", { count })}
      aria-haspopup="dialog"
      onClick={() => setOpen(true)}
    >
      <CartIcon className="header__icon" />
      <span className="header__count" aria-hidden="true">
        {count}
      </span>
    </button>
  );
}
