"use client";

import Image from "next/image";
import { useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { formatPrice, productImage } from "@/commerce/catalogue";
import { COMMERCE } from "@/commerce/config";
import QuantityStepper from "@/components/ui/QuantityStepper";
import StatusMessage from "../feedback/StatusMessage";
import OrderSummary from "./OrderSummary";
import SecureNote from "./SecureNote";
import VoucherField from "./VoucherField";
import { useCart } from "./CartProvider";
import { useVoucher } from "./useVoucher";
import "./cartView.css";

/** The cart page: review and adjust lines, add a voucher and a note, then check out. */
export default function CartView() {
  const t = useTranslations("commerce.cart");
  const names = useTranslations("products");
  const units = useTranslations("units");
  const legacy = useTranslations("cart");
  const locale = useLocale();
  const cart = useCart();
  const voucher = useVoucher();
  const noteId = useId();
  const price = (cents: number) => formatPrice(cents, locale);

  if (!cart.ready) return <div className="cart-view cart-view--loading" aria-busy="true" />;
  if (cart.items.length === 0) {
    return (
      <StatusMessage
        tone="info"
        title={t("emptyTitle")}
        illustration="cartEmpty"
        actions={
          <Link href="/range" className="commerce-button">
            {t("browse")}
          </Link>
        }
      >
        <p>{t("emptyBody")}</p>
      </StatusMessage>
    );
  }
  return (
    <div className="cart-view">
      <header className="cart-view__head">
        <h1>{t("title")}</h1>
        <p className="commerce-caption">{t("count", { count: cart.count })}</p>
      </header>
      <div className="cart-view__layout">
        <div>
          <ul className="cart-view__lines">
            {cart.items.map(({ product, quantity, lineTotal }) => (
              <li key={product.slug} className="cart-line">
                <span className="cart-line__image">
                  <Image src={productImage(product)} alt="" width={96} height={124} sizes="96px" />
                </span>
                <div className="cart-line__body">
                  <h2>{names(product.slug)}</h2>
                  <p>
                    {units(product.unit)} · {price(product.price ?? 0)}
                  </p>
                  <div className="cart-line__controls">
                    <QuantityStepper
                      value={quantity}
                      onChange={(next) => cart.updateQuantity(product.slug, next)}
                    />
                    <button
                      type="button"
                      className="commerce-link"
                      onClick={() => cart.removeItem(product.slug)}
                      aria-label={legacy("removeNamed", { product: names(product.slug) })}
                    >
                      {legacy("remove")}
                    </button>
                  </div>
                </div>
                <strong className="cart-line__total">{price(lineTotal)}</strong>
              </li>
            ))}
          </ul>
          <div className="cart-view__extras">
            <VoucherField />
            <div className="commerce-field">
              <label htmlFor={noteId}>{t("noteLabel")}</label>
              <textarea
                id={noteId}
                value={cart.note}
                maxLength={COMMERCE.checkout.noteMaxLength}
                onChange={(event) => cart.setNote(event.target.value)}
                placeholder={t("notePlaceholder")}
              />
            </div>
          </div>
        </div>
        <aside className="cart-view__aside">
          <OrderSummary shippingMethod={null} voucher={voucher.voucher} />
          <p className="cart-view__taxes">{t("taxesLater")}</p>
          <Link href="/checkout" className="commerce-button commerce-button--block">
            {legacy("checkout")}
          </Link>
          <Link
            href="/range"
            className="commerce-button commerce-button--ghost commerce-button--block"
          >
            {legacy("continueShopping")}
          </Link>
          <SecureNote />
        </aside>
      </div>
    </div>
  );
}
