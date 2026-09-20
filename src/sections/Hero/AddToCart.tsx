"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import "./addToCart.css";

type AddToCartProps = {
  /** Resolved product name, for the control's accessible name. */
  productName: string;
  /** Lowest price across the product's pack sizes, already formatted. */
  priceFrom: string;
  /** The smallest unit it is sold in, already resolved. */
  fromUnit: string;
};

const MAX = 99;

/**
 * Price, a quantity stepper and a round add control, over the slide.
 *
 * Quantity is local state and the add is a stub — the cart lives on the
 * client's side of the seam. What this fixes is the shape: a "from" price and
 * the smallest unit answer the two questions a visitor has before they will
 * click anything, and neither is on the page today.
 */
export default function AddToCart({ productName, priceFrom, fromUnit }: AddToCartProps) {
  const t = useTranslations("cart");
  const [qty, setQty] = useState(1);

  const step = (by: number) => setQty((q) => Math.min(MAX, Math.max(1, q + by)));

  return (
    <div className="add-to-cart">
      <div className="add-to-cart__price">
        <p className="add-to-cart__from">{t("from", { price: priceFrom })}</p>
        <p className="add-to-cart__unit">{t("soldFrom", { unit: fromUnit })}</p>
      </div>

      <div className="add-to-cart__stepper">
        <button
          type="button"
          className="add-to-cart__step"
          onClick={() => step(-1)}
          disabled={qty <= 1}
          aria-label={t("decrease")}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M3.5 8h9" />
          </svg>
        </button>

        {/* A live region, not an input: the value only ever changes through the
            two buttons, and announcing it is what a screen reader needs. */}
        <span className="add-to-cart__qty" aria-live="polite" aria-atomic="true">
          <span className="visually-hidden">{t("quantity")}: </span>
          {qty}
        </span>

        <button
          type="button"
          className="add-to-cart__step"
          onClick={() => step(1)}
          disabled={qty >= MAX}
          aria-label={t("increase")}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M8 3.5v9M3.5 8h9" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        className="add-to-cart__add"
        aria-label={t("addNamed", { product: productName, count: qty })}
        onClick={() => {
          /* TODO(backend): add { slug, qty } to the cart and open the drawer.
             Contract: see lib/contracts once the cart is modelled. */
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M3 8h18l-1.6 10.4a2.2 2.2 0 0 1-2.2 1.9H6.8a2.2 2.2 0 0 1-2.2-1.9Z" />
          <path d="m8.5 8 3.5-5 3.5 5" />
        </svg>
        <span className="add-to-cart__add-label">{t("add")}</span>
      </button>
    </div>
  );
}
