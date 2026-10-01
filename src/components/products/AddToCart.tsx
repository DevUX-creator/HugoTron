"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import QuantityStepper from "@/components/ui/QuantityStepper";
import { useCart } from "@/components/cart/CartProvider";
import { MAX_CART_QUANTITY } from "@/lib/cart/model";
import type { Product } from "@/lib/catalogue";
import "./addToCart.css";

/**
 * Quantity and add-to-cart state for one product. Every purchasable surface (catalogue card,
 * hero, rice page) uses this, so the 99 cap, the "added" confirmation and the announcement
 * behave the same everywhere.
 */
export function useAddToCart(product: Product, name: string) {
  const t = useTranslations("cart");
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const inCart = cart.items.find((line) => line.productId === product.slug)?.quantity ?? 0;
  const remaining = MAX_CART_QUANTITY - inCart;
  const max = Math.max(1, remaining);
  const count = Math.min(quantity, remaining);
  return {
    quantity: Math.min(quantity, max),
    max,
    setQuantity,
    added,
    disabled: !cart.ready || remaining === 0 || added,
    label: added ? t("added") : remaining === 0 ? t("limitReached") : t("add"),
    ariaLabel: t("addNamed", { product: name, count }),
    status: added ? t("addedNamed", { product: name }) : "",
    add() {
      cart.addItem(product.slug, count);
      setAdded(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setAdded(false), 1400);
    },
  };
}

type AddToCartState = ReturnType<typeof useAddToCart>;

/** The quantity stepper bound to an add-to-cart state. */
export function AddToCartQuantity({ state }: { state: AddToCartState }) {
  return <QuantityStepper value={state.quantity} max={state.max} onChange={state.setQuantity} />;
}

/**
 * The add-to-cart button. `bar` is the catalogue card's full-width action; `link` matches the
 * glass arrow links of the hero and rice page.
 */
export function AddToCartButton({
  state,
  appearance,
  className,
}: {
  state: AddToCartState;
  appearance: "bar" | "link";
  className?: string;
}) {
  const classes =
    appearance === "link"
      ? ["arrow-link arrow-link--large arrow-link--glass add-to-cart--link", className]
      : ["add-to-cart--bar", className];
  return (
    <>
      <button
        type="button"
        className={classes.filter(Boolean).join(" ")}
        data-cursor="wrap"
        // The cart plays its own confirmation; a generic click sound would double it.
        data-sound-click="none"
        disabled={state.disabled}
        aria-label={state.ariaLabel}
        onClick={state.add}
      >
        <span className={appearance === "link" ? "arrow-link__label" : undefined}>
          {state.label}
        </span>
        <span className={appearance === "link" ? "arrow-link__mark" : undefined} aria-hidden="true">
          {state.added ? "✓" : "+"}
        </span>
      </button>
      <span className="visually-hidden" role="status">
        {state.status}
      </span>
    </>
  );
}
