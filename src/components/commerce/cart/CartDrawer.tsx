"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPrice, productImage } from "@/commerce/catalogue";
import QuantityStepper from "@/components/ui/QuantityStepper";
import { useScrollLock } from "@/components/providers/SmoothScroll";
import { useCart } from "./CartProvider";
import SecureNote from "./SecureNote";
import "./cart.css";

export default function CartDrawer() {
  const t = useTranslations("cart");
  const shop = useTranslations("commerce.cart");
  const names = useTranslations("products");
  const units = useTranslations("units");
  const locale = useLocale();
  const cart = useCart();
  const dialog = useRef<HTMLDialogElement>(null);
  const { lock, unlock } = useScrollLock();
  const price = (cents: number) => formatPrice(cents, locale);
  useEffect(() => {
    const element = dialog.current;
    if (!element || !cart.open) return;
    element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lock();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      unlock();
    };
  }, [cart.open, lock, unlock]);
  return (
    <dialog
      ref={dialog}
      className="cart-drawer"
      aria-labelledby="cart-title"
      onCancel={() => cart.setOpen(false)}
      onClose={() => cart.setOpen(false)}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          cart.setOpen(false);
      }}
    >
      <div className="cart-drawer__inner" data-lenis-prevent>
        <header className="cart-drawer__head">
          <h2 id="cart-title">
            {t("title")} <span>({cart.count})</span>
          </h2>
          <button
            type="button"
            autoFocus
            onClick={() => cart.setOpen(false)}
            aria-label={t("close")}
            className="cart-drawer__close"
          >
            ×
          </button>
        </header>
        {cart.items.length === 0 ? (
          <p className="cart-drawer__empty">{t("empty")}</p>
        ) : (
          <ul className="cart-drawer__items">
            {cart.items.map(({ product, quantity, lineTotal }) => (
              <li key={product.slug} className="cart-drawer__item">
                <Image src={productImage(product)} width={84} height={108} alt="" sizes="84px" />
                <div>
                  <h3>{names(product.slug)}</h3>
                  <p>
                    {units(product.unit)} · {price(lineTotal)}
                  </p>
                  <div className="cart-drawer__item-controls">
                    <QuantityStepper
                      value={quantity}
                      onChange={(next) => cart.updateQuantity(product.slug, next)}
                    />
                    <button
                      type="button"
                      onClick={() => cart.removeItem(product.slug)}
                      aria-label={t("removeNamed", { product: names(product.slug) })}
                    >
                      {t("remove")}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <footer className="cart-drawer__foot">
          <p className="cart-drawer__total">
            <span>{shop("estimatedTotal")}</span>
            <strong>{price(cart.subtotal)}</strong>
          </p>
          <p className="cart-drawer__taxes">{shop("taxesLater")}</p>
          {cart.items.length > 0 ? (
            <>
              <Link
                href="/checkout"
                className="commerce-button commerce-button--block"
                onClick={() => cart.setOpen(false)}
              >
                {t("checkout")}
              </Link>
              <Link
                href="/cart"
                className="commerce-button commerce-button--ghost commerce-button--block"
                onClick={() => cart.setOpen(false)}
              >
                {shop("viewCart")}
              </Link>
              <SecureNote />
            </>
          ) : (
            <Link
              href="/range"
              className="commerce-button commerce-button--block"
              onClick={() => cart.setOpen(false)}
            >
              {shop("browse")}
            </Link>
          )}
        </footer>
      </div>
    </dialog>
  );
}
