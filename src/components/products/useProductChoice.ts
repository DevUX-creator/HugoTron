"use client";

import { useState } from "react";
import { isPurchasable, type Product, type UnitKey } from "@/lib/catalogue";

/** A buyer's type and pack size within one category. */
export type ProductChoice = { brand?: Product["brand"] | undefined; unit?: UnitKey | undefined };

/** Keeps first-seen order, so the catalogue decides which type and size lead. */
function unique<T>(values: T[]) {
  return [...new Set(values)];
}

/**
 * Type and pack-size selection derived from the catalogue: ranges sold as several brands and
 * sizes (basmati) offer both choices, single products offer none. Pass `choice`/`onChoose` to
 * keep the selection outside (the hero remembers it across previews); omit them to keep it here.
 */
export function useProductChoice(
  products: readonly Product[],
  controlled?: { choice: ProductChoice | undefined; onChoose: (choice: ProductChoice) => void },
) {
  const [own, setOwn] = useState<ProductChoice>({});
  const choice = controlled ? (controlled.choice ?? {}) : own;
  const choose = controlled ? controlled.onChoose : setOwn;
  const shop = products.filter(isPurchasable);
  const brands = unique(shop.map((item) => item.brand).filter((brand) => brand !== undefined));
  const brand = choice.brand ?? brands[0];
  const sizes = unique(shop.filter((item) => item.brand === brand).map((item) => item.unit));
  const unit = choice.unit && sizes.includes(choice.unit) ? choice.unit : sizes[0];
  const product =
    shop.find((item) => item.brand === brand && item.unit === unit) ??
    shop.find((item) => item.brand === brand) ??
    shop[0] ??
    products[0] ??
    null;
  return {
    product,
    brands,
    brand,
    sizes,
    unit,
    originOf: (option: NonNullable<Product["brand"]>) =>
      shop.find((item) => item.brand === option)?.origin,
    chooseBrand: (option: NonNullable<Product["brand"]>) => choose({ brand: option, unit }),
    chooseUnit: (option: UnitKey) => choose({ brand, unit: option }),
  };
}
