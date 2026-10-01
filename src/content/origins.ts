import type { ProductSlug } from "./products";

export type OriginCountry = "india" | "pakistan" | "iran";

/** A place a range is sourced from, and the products that come from it. */
export type Origin = {
  id: string;
  country: OriginCountry;
  /** The category the products belong to; drives the label and the "explore" link. */
  category: "rice" | "tea" | "saffron";
  products: readonly ProductSlug[];
  /** Approximately where it grows, placed by eye on the map; not a precise source address. */
  lon: number;
  lat: number;
};

/** Where every line ends: the Hugo Tron warehouse. */
export const ORIGIN_HUB = { lon: 9.99, lat: 53.55 } as const;

/**
 * Only origins the catalogue itself states (basmati brand and country) or the brand makes
 * plain (Vahdam is an Indian tea house, Negin a Persian saffron grade). Pistachios and pulses
 * are left out until Hugo Tron confirms where they are sourced.
 */
export const ORIGINS: readonly Origin[] = [
  {
    id: "rice-india",
    country: "india",
    category: "rice",
    products: ["pardis-1121-basmati-indien", "pardis-basmati-indien-1kg"],
    lon: 76.2,
    lat: 30.2,
  },
  {
    id: "rice-pakistan",
    country: "pakistan",
    category: "rice",
    products: ["aladdin-1121-basmati-pakistan", "aladdin-basmati-pakistan-1kg"],
    lon: 73.6,
    lat: 31.9,
  },
  {
    id: "saffron-iran",
    country: "iran",
    category: "saffron",
    products: ["premium-negin-safran"],
    lon: 59.4,
    lat: 34.2,
  },
  {
    id: "tea-india",
    country: "india",
    category: "tea",
    products: ["vahdam-earl-grey"],
    lon: 88.3,
    lat: 26.9,
  },
];
