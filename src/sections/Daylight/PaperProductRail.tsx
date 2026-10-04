"use client";

import { getProducts, type ProductSlug } from "@/commerce/catalogue";
import RangeProductCard from "@/components/commerce/products/RangeProductCard";
import ProductRail from "@/components/commerce/products/ProductRail";

// Show the breadth of the range before repeating pack sizes of the same rice.
const FEATURED: readonly ProductSlug[] = [
  "pardis-1121-basmati-indien",
  "pistazien-mit-schale",
  "almonds-cashews",
  "cinnamon-cardamom",
  "premium-negin-safran",
  "kichererbsen-25kg",
  "hazelnuts-walnuts",
  "ginger",
  "dried-fruits",
  "white-mung-beans",
];
const products = getProducts();
const PRODUCTS = [
  ...FEATURED.flatMap((slug) => products.filter((product) => product.slug === slug)),
  ...products.filter((product) => !FEATURED.includes(product.slug)),
];

export default function PaperProductRail() {
  return (
    <ProductRail
      items={PRODUCTS.map((product, index) => (
        <RangeProductCard key={product.slug} product={product} index={index} />
      ))}
    />
  );
}
