"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/content/products";
import "./productCard.css";

type ProductCardProps = {
  product: Product;
  /** Resolved, because message keys are typed against the catalogue. */
  name: string;
  unit: string;
  /** Formatted in the active locale, or null for a quoted line. */
  price: string | null;
};

const MAX = 99;

/**
 * One product, in the card language of public/reference/product-card-style.png:
 * a tinted tile carrying the pack shot, tags in its top corners, then the name,
 * the price and one outlined control across the full width.
 *
 * THE CONTROL DEPENDS ON THE CHANNEL. A shop line gets a stepper and a cart; a
 * wholesale line gets a link to the enquiry form. That is the whole point of
 * `channel` in the seed data — the live shop fakes this today with €0.00
 * out-of-stock products and an email address in the product name.
 */
export default function ProductCard({ product, name, unit, price }: ProductCardProps) {
  const t = useTranslations("cart");
  const [qty, setQty] = useState(1);

  const step = (by: number) => setQty((q) => Math.min(MAX, Math.max(1, q + by)));
  const isShop = product.channel === "shop";

  return (
    <article className="pcard">
      <div className="pcard__tile">
        <ul className="pcard__tags">
          {product.isNew ? <li className="pcard__tag">{t("badgeNew")}</li> : null}
          {!isShop ? <li className="pcard__tag">{t("badgeWholesale")}</li> : null}
        </ul>

        <Image
          src={`/products/${product.slug}/front.png`}
          alt={name}
          fill
          sizes="(width >= 64rem) 20rem, 60vw"
          className="pcard__img"
        />
      </div>

      <h3 className="pcard__name">{name}</h3>

      <div className="pcard__meta">
        <p className="pcard__price">
          {price ? (
            <>
              {price} <span className="pcard__unit">{t("perUnit", { unit })}</span>
            </>
          ) : (
            <span className="pcard__unit">{unit}</span>
          )}
        </p>

        {isShop ? (
          <div className="pcard__stepper">
            <button
              type="button"
              className="pcard__step"
              onClick={() => step(-1)}
              disabled={qty <= 1}
              aria-label={t("decrease")}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M3.5 8h9" />
              </svg>
            </button>

            <span className="pcard__qty" aria-live="polite" aria-atomic="true">
              <span className="visually-hidden">{t("quantity")}: </span>
              {qty}
            </span>

            <button
              type="button"
              className="pcard__step"
              onClick={() => step(1)}
              disabled={qty >= MAX}
              aria-label={t("increase")}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M8 3.5v9M3.5 8h9" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      {isShop ? (
        <button
          type="button"
          className="pcard__action"
          aria-label={t("addNamed", { product: name, count: qty })}
          onClick={() => {
            /* TODO(backend): add { slug, qty } to the cart and open the drawer. */
          }}
        >
          <span aria-hidden="true">+</span> {t("add")}
        </button>
      ) : (
        <Link href="/enquiry" className="pcard__action">
          <span aria-hidden="true">+</span> {t("requestPrice")}
        </Link>
      )}
    </article>
  );
}
