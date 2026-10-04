"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import Copy from "@/animations/Copy";
import Reveal from "@/animations/Reveal";
import { formatPrice, isPurchasable, productImage, type Product } from "@/commerce/catalogue";
import {
  AddToCartButton,
  AddToCartQuantity,
  useAddToCart,
} from "@/components/commerce/products/AddToCart";
import EnquireLink from "@/components/commerce/products/EnquireLink";
import "./riceProductCard.css";

/** Compact product selection beside the rice scene, bought through the shared cart. */
export default function RiceProductCard({ product }: { product: Product }) {
  const names = useTranslations("products");
  const units = useTranslations("units");
  const locale = useLocale();
  const name = names(product.slug);
  return (
    <article className="rice-product">
      <Reveal className="rice-product__tile">
        <Image
          src={productImage(product)}
          alt={name}
          fill
          sizes="(max-width: 767px) 112px, (max-width: 1023px) 208px, 272px"
          className="rice-product__img"
        />
      </Reveal>
      <Copy>
        <h3 className="rice-product__name">{name}</h3>
      </Copy>
      {product.price !== null && (
        <Copy delay={0.08}>
          <p className="rice-product__price">
            {formatPrice(product.price, locale)}{" "}
            <span className="rice-product__unit">/ {units(product.unit)}</span>
          </p>
        </Copy>
      )}
      {isPurchasable(product) ? (
        <RicePurchase product={product} name={name} />
      ) : (
        <EnquireLink product={product} name={name} className="rice-product__enquiry" />
      )}
    </article>
  );
}

function RicePurchase({ product, name }: { product: Product; name: string }) {
  const cart = useAddToCart(product, name);
  return (
    <div className="rice-product__buy">
      <AddToCartQuantity state={cart} />
      <AddToCartButton state={cart} appearance="link" className="rice-product__add" />
    </div>
  );
}
