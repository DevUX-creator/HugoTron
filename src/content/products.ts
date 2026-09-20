/**
 * The catalogue, as seed data.
 *
 * TODO(backend): this is the shape the real catalogue has to supply. Replace
 * with a call through the data layer; nothing here should survive into
 * production.
 *
 * Prices are INTEGER CENTS. Floats lie: 3.49 * 3 is not 10.47.
 * Figures are the September 2026 scrape in content/products/catalog.md.
 */
export type ProductSlug =
  | "pardis-1121-basmati-indien"
  | "aladdin-1121-basmati-pakistan"
  | "pardis-basmati-indien-1kg"
  | "aladdin-basmati-pakistan-1kg"
  | "premium-negin-safran"
  | "vahdam-earl-grey"
  | "pistazien-mit-schale"
  | "pistazienkerne"
  | "kichererbsen-25kg";

export type UnitKey = "kg1" | "kg5" | "g1" | "pack1" | "sack25" | "sack10";

export type Product = {
  slug: ProductSlug;
  /** Cents, or null when the product is quoted rather than priced. */
  price: number | null;
  /** The unit that price buys. */
  unit: UnitKey;
  /**
   * THE FIELD THAT REPLACES THE €0.00 HACK. The live shop lists its wholesale
   * lines as zero-price, out-of-stock products with an email address in the
   * name (see content/strategy/audit.md §2). Here the channel decides whether
   * a card offers a cart or a quote, and nothing has to be faked.
   */
  channel: "shop" | "wholesale";
  /** Matches the "Neu" ribbon the live shop puts on these. */
  isNew?: boolean;
};

export const PRODUCTS: readonly Product[] = [
  { slug: "pardis-1121-basmati-indien", price: 1890, unit: "kg5", channel: "shop", isNew: true },
  {
    slug: "aladdin-1121-basmati-pakistan",
    price: 1990,
    unit: "kg5",
    channel: "shop",
    isNew: true,
  },
  { slug: "pardis-basmati-indien-1kg", price: 390, unit: "kg1", channel: "shop", isNew: true },
  { slug: "aladdin-basmati-pakistan-1kg", price: 490, unit: "kg1", channel: "shop", isNew: true },
  { slug: "premium-negin-safran", price: 490, unit: "g1", channel: "shop" },
  { slug: "vahdam-earl-grey", price: 349, unit: "pack1", channel: "shop" },
  { slug: "pistazien-mit-schale", price: null, unit: "sack10", channel: "wholesale" },
  { slug: "pistazienkerne", price: null, unit: "sack25", channel: "wholesale" },
  { slug: "kichererbsen-25kg", price: null, unit: "sack25", channel: "wholesale" },
] as const;
