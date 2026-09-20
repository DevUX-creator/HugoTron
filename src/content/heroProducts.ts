/**
 * Seed data for the hero's purchase control.
 *
 * TODO(backend): this is the shape the real catalogue has to supply — a
 * product's lowest price across its pack sizes, and the smallest unit it is
 * sold in. Replace with a call through the data layer; nothing here should
 * survive into production.
 *
 * Prices are INTEGER CENTS. Floats lie: 3.49 * 3 is not 10.47.
 * Figures taken from content/products/catalog.md, which is the September 2026
 * scrape of the live shop.
 */
export type UnitKey = "kg1" | "g1" | "pack1";

/** Literal, not `string`: these double as message keys under `products`, and
 *  next-intl types those against the catalogue. A widened slug here surfaces
 *  as a type error at every call site instead of a missing label at runtime. */
export type ProductSlug =
  | "pardis-1121-basmati-indien"
  | "aladdin-1121-basmati-pakistan"
  | "premium-negin-safran"
  | "vahdam-earl-grey";

export type HeroProduct = {
  slug: ProductSlug;
  /** Lowest price across the product's pack sizes, in cents. */
  priceFrom: number;
  /** The smallest unit this product is sold in. */
  fromUnit: UnitKey;
};

export const HERO_PRODUCTS: readonly HeroProduct[] = [
  /* The 1 kg bag is a separate listing at €3.90 today; it is the same rice, so
     the flagship's "from" price is that one rather than the 5 kg's €18.90. */
  { slug: "pardis-1121-basmati-indien", priceFrom: 390, fromUnit: "kg1" },
  { slug: "aladdin-1121-basmati-pakistan", priceFrom: 490, fromUnit: "kg1" },
  { slug: "premium-negin-safran", priceFrom: 490, fromUnit: "g1" },
  { slug: "vahdam-earl-grey", priceFrom: 349, fromUnit: "pack1" },
] as const;
