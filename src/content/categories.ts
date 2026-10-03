import type { ProductSlug } from "./products";
import type { StaticPathname } from "@/i18n/routing";

/** Shared category destinations and catalogue membership. */
export const PRODUCT_CATEGORIES = [
  {
    id: "rice",
    href: "/range/rice",
    products: [
      "pardis-1121-basmati-indien",
      "aladdin-1121-basmati-pakistan",
      "pardis-basmati-indien-1kg",
      "aladdin-basmati-pakistan-1kg",
    ],
  },
  {
    id: "pistachios",
    href: "/range/pistachios",
    products: ["pistazien-mit-schale", "pistazienkerne"],
  },
  {
    id: "nuts",
    href: "/range/nuts",
    products: ["almonds-cashews", "hazelnuts-walnuts", "dried-fruits"],
  },
  { id: "spices", href: "/range/spices", products: ["ginger", "cinnamon-cardamom"] },
  { id: "tea", href: "/range/tea", products: ["vahdam-earl-grey"] },
  { id: "saffron", href: "/range/saffron", products: ["premium-negin-safran"] },
  {
    id: "pulses",
    href: "/range/pulses",
    products: [
      "kichererbsen-25kg",
      "rote-linsen-25kg",
      "gelbe-spalterbsen-25kg",
      "kidneybohnen-25kg",
      "white-mung-beans",
    ],
  },
  { id: "grains", href: "/range/grains", products: ["bulgur-25kg"] },
] as const satisfies readonly {
  id: string;
  href: StaticPathname;
  products: readonly ProductSlug[];
}[];

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
