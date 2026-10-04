"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  formatPrice,
  isPurchasable,
  pricePerKg,
  productImage,
  type Product,
} from "@/commerce/catalogue";
import { AddToCartButton, AddToCartQuantity, useAddToCart } from "./AddToCart";
import EnquireLink from "./EnquireLink";
import "./rangeProductCard.css";

/** One catalogue entry: bought through the shared cart, or enquired about when it is quoted. */
export default function RangeProductCard({ product, index }: { product: Product; index: number }) {
  const t = useTranslations("cart");
  const names = useTranslations("products");
  const units = useTranslations("units");
  const locale = useLocale();
  const name = names(product.slug);
  return (
    <article
      className="range-product"
      data-product-id={product.slug}
      aria-labelledby={`range-product-${product.slug}`}
    >
      <div className="range-product__top">
        <span>{String(index + 1).padStart(2, "0")}</span>
        <span>{units(product.unit)}</span>
      </div>
      <div
        className={`range-product__image${product.cardImage ? " range-product__image--pack" : ""}`}
      >
        <Image
          src={productImage(product)}
          alt={name}
          fill
          sizes="(max-width: 767px) 260px, 368px"
        />
        {product.channel !== "shop" && (
          <span className="range-product__badge">
            {t(product.channel === "sourcing" ? "badgeSourcing" : "badgeWholesale")}
          </span>
        )}
      </div>
      <h3 id={`range-product-${product.slug}`}>{name}</h3>
      {isPurchasable(product) ? (
        <CardPurchase product={product} name={name} price={formatPrice(product.price!, locale)} />
      ) : (
        <>
          <div className="range-product__meta">
            <p>{t(product.channel === "sourcing" ? "toSpecification" : "requestPrice")}</p>
          </div>
          <EnquireLink product={product} name={name} className="range-product__enquiry" />
        </>
      )}
    </article>
  );
}

function CardPurchase({ product, name, price }: { product: Product; name: string; price: string }) {
  const t = useTranslations("cart");
  const locale = useLocale();
  const cart = useAddToCart(product, name);
  const perKg = pricePerKg(product);
  return (
    <>
      <div className="range-product__meta">
        <p>
          {price}
          <small>
            {perKg !== null && <>{t("perKg", { price: formatPrice(perKg, locale) })} · </>}
            {t("priceTerms")}
          </small>
        </p>
        <AddToCartQuantity state={cart} />
      </div>
      <AddToCartButton state={cart} appearance="bar" />
    </>
  );
}
