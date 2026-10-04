/**
 * The catalogue, as seed data.
 *
 * TODO(backend): this is the shape the real catalogue has to supply. Replace
 * with a call through the data layer; nothing here should survive into
 * production.
 *
 * Prices are INTEGER CENTS. Floats lie: 3.49 * 3 is not 10.47.
 * Figures are the September 2026 prices from the live hugo-tron.com shop.
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
  | "kichererbsen-25kg"
  | "rote-linsen-25kg"
  | "gelbe-spalterbsen-25kg"
  | "kidneybohnen-25kg"
  | "bulgur-25kg"
  | "almonds-cashews"
  | "hazelnuts-walnuts"
  | "dried-fruits"
  | "ginger"
  | "cinnamon-cardamom"
  | "white-mung-beans";

export type UnitKey = "kg1" | "kg5" | "g1" | "pack1" | "sack25" | "sack10" | "onRequest";

export type Product = {
  slug: ProductSlug;
  /** Cents, or null when the product is quoted rather than priced. */
  price: number | null;
  /** The unit that price buys. */
  unit: UnitKey;
  /**
   * THE FIELD THAT REPLACES THE €0.00 HACK. The live shop lists its wholesale
   * lines as zero-price, out-of-stock products with an email address in the
   * name. Here the channel decides whether
   * a card offers a cart or a quote, and nothing has to be faked.
   * Sourcing selections have no confirmed pack size, price or stock promise.
   */
  channel: "shop" | "wholesale" | "sourcing";
  /** Matches the "Neu" ribbon the live shop puts on these. */
  isNew?: boolean;
  /**
   * The views a card can page through, front first. File names under
   * public/products/<slug>/ — read off disk when this list was written, so a
   * new angle means adding the file AND naming it here.
   */
  views: readonly string[];
  /** Optional transparent catalogue image, suitable for fitting the whole pack. */
  cardImage?: string;
  /**
   * Brand and origin, for ranges sold as more than one type of the same thing — basmati comes
   * as Pardis from India and Aladdin from Pakistan — so a buyer can choose between them.
   */
  brand?: "pardis" | "aladdin";
  origin?: "india" | "pakistan";
};

export const PRODUCTS: readonly Product[] = [
  {
    views: ["front", "side", "back"],
    slug: "pardis-1121-basmati-indien",
    brand: "pardis",
    origin: "india",
    cardImage: "/products/pardis-1121-basmati-indien/front-cutout.png",
    price: 1890,
    unit: "kg5",
    channel: "shop",
    isNew: true,
  },
  {
    views: ["front", "side", "back"],
    slug: "aladdin-1121-basmati-pakistan",
    brand: "aladdin",
    origin: "pakistan",
    cardImage: "/products/aladdin-1121-basmati-pakistan/front-cutout.png",
    price: 1990,
    unit: "kg5",
    channel: "shop",
    isNew: true,
  },
  {
    views: ["front", "angle"],
    slug: "pardis-basmati-indien-1kg",
    brand: "pardis",
    origin: "india",
    cardImage: "/products/pardis-basmati-indien-1kg/front-cutout.png",
    price: 390,
    unit: "kg1",
    channel: "shop",
    isNew: true,
  },
  {
    views: ["front", "angle", "back"],
    slug: "aladdin-basmati-pakistan-1kg",
    brand: "aladdin",
    origin: "pakistan",
    cardImage: "/products/aladdin-basmati-pakistan-1kg/front-cutout.png",
    price: 490,
    unit: "kg1",
    channel: "shop",
    isNew: true,
  },
  {
    views: ["front", "angle", "detail"],
    slug: "premium-negin-safran",
    cardImage: "/products/premium-negin-safran/card-cutout.webp",
    price: 490,
    unit: "g1",
    channel: "shop",
  },
  {
    views: ["front", "angle"],
    slug: "vahdam-earl-grey",
    cardImage: "/products/vahdam-earl-grey/card-cutout.webp",
    price: 349,
    unit: "pack1",
    channel: "shop",
  },
  {
    views: ["front", "top"],
    slug: "pistazien-mit-schale",
    cardImage: "/products/pistazien-mit-schale/card-cutout.webp",
    price: null,
    unit: "sack10",
    channel: "wholesale",
  },
  {
    views: ["front", "top"],
    slug: "pistazienkerne",
    cardImage: "/products/pistazienkerne/card-cutout.webp",
    price: null,
    unit: "sack25",
    channel: "wholesale",
  },
  {
    views: ["front", "top"],
    slug: "kichererbsen-25kg",
    cardImage: "/products/kichererbsen-25kg/card-cutout.webp",
    price: null,
    unit: "sack25",
    channel: "wholesale",
  },
  {
    // Imported to order for trade; listed from the live wholesale page, quoted on request.
    views: ["sack-cutout"],
    slug: "rote-linsen-25kg",
    cardImage: "/products/rote-linsen-25kg/sack-cutout.png",
    price: null,
    unit: "sack25",
    channel: "wholesale",
  },
  {
    // Imported to order for trade; listed from the live wholesale page, quoted on request.
    views: ["sack-cutout"],
    slug: "gelbe-spalterbsen-25kg",
    cardImage: "/products/gelbe-spalterbsen-25kg/sack-cutout.png",
    price: null,
    unit: "sack25",
    channel: "wholesale",
  },
  {
    // Imported to order for trade; listed from the live wholesale page, quoted on request.
    views: ["sack-cutout"],
    slug: "kidneybohnen-25kg",
    cardImage: "/products/kidneybohnen-25kg/sack-cutout.png",
    price: null,
    unit: "sack25",
    channel: "wholesale",
  },
  {
    // Imported to order for trade; listed from the live wholesale page, quoted on request.
    views: ["sack-cutout"],
    slug: "bulgur-25kg",
    cardImage: "/products/bulgur-25kg/sack-cutout.png",
    price: null,
    unit: "sack25",
    channel: "wholesale",
  },
  // Client-confirmed sourcing scope, 3 October 2026. The images illustrate the
  // ingredients; these are enquiry selections, not priced retail pack variants.
  ...(
    [
      "almonds-cashews",
      "hazelnuts-walnuts",
      "dried-fruits",
      "ginger",
      "cinnamon-cardamom",
      "white-mung-beans",
    ] as const
  ).map((slug) => ({
    slug,
    views: ["selection-cutout"],
    cardImage: `/products/${slug}/selection-cutout.webp`,
    price: null,
    unit: "onRequest" as const,
    channel: "sourcing" as const,
  })),
] as const;
