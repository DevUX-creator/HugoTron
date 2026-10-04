"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatPrice, productImage } from "@/commerce/catalogue";
import { computeTotals } from "@/commerce/checkout/pricing";
import { COMMERCE } from "@/commerce/config";
import type { Voucher } from "@/commerce/types";
import { useCart } from "./CartProvider";
import "./summary.css";

/**
 * The cart's lines and totals, as shown beside the checkout and on the cart page. Totals come
 * from the same pricing module the server uses; the server's figures are the ones charged.
 */
export default function OrderSummary({
  shippingMethod,
  voucher,
  children,
}: {
  /** Null on the cart page: shipping is then "calculated at checkout". */
  shippingMethod: string | null;
  voucher: Voucher | null;
  children?: ReactNode;
}) {
  const t = useTranslations("commerce.summary");
  const names = useTranslations("products");
  const units = useTranslations("units");
  const locale = useLocale();
  const cart = useCart();
  const price = (cents: number) => formatPrice(cents, locale);
  const totals = computeTotals(
    cart.subtotal,
    shippingMethod ?? COMMERCE.shipping[0].id,
    voucher?.discount,
  );
  return (
    <section className="summary commerce-panel" aria-labelledby="summary-title">
      <h2 id="summary-title" className="summary__title">
        {t("title")}
      </h2>
      <ul className="summary__lines">
        {cart.items.map(({ product, quantity, lineTotal }) => (
          <li key={product.slug}>
            <span className="summary__image">
              <Image src={productImage(product)} alt="" width={56} height={72} sizes="56px" />
              <span className="summary__qty" aria-label={t("quantity", { count: quantity })}>
                {quantity}
              </span>
            </span>
            <span className="summary__name">
              {names(product.slug)}
              <small>{units(product.unit)}</small>
            </span>
            <span className="summary__price">{price(lineTotal)}</span>
          </li>
        ))}
      </ul>
      {children}
      <dl className="summary__totals">
        <div>
          <dt>{t("subtotal")}</dt>
          <dd>{price(totals.subtotal)}</dd>
        </div>
        <div>
          <dt>{t("shipping")}</dt>
          <dd>
            {shippingMethod === null
              ? t("shippingLater")
              : totals.shipping === null
                ? t("shippingOnRequest")
                : totals.shipping === 0
                  ? t("free")
                  : price(totals.shipping)}
          </dd>
        </div>
        {totals.discount > 0 && (
          <div className="summary__discount">
            <dt>{t("discount", { code: voucher?.code ?? "" })}</dt>
            <dd>−{price(totals.discount)}</dd>
          </div>
        )}
        <div className="summary__total">
          <dt>
            {shippingMethod === null
              ? t("estimatedTotal")
              : totals.shipping === null
                ? t("totalExclShipping")
                : t("total")}
          </dt>
          <dd>{price(totals.total)}</dd>
        </div>
      </dl>
      <p className="summary__vat">{t("vatIncluded", { amount: price(totals.vatIncluded) })}</p>
    </section>
  );
}
