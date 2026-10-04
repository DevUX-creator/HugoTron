import { PRODUCTS, type Product, type ProductSlug, type UnitKey } from "@/content/products";
import { PRODUCT_CATEGORIES, type ProductCategory } from "@/content/categories";

/**
 * THE CATALOGUE SEAM. Every product, category and price the site shows is read through this
 * module, never from `content/` directly. Today it serves the seed data; to connect the real
 * catalogue (a PIM, the shop backend, a database), change the bodies here and nothing above.
 *
 * The functions are synchronous because the seed is static. A remote catalogue should be read
 * once on the server (a page or layout) and passed down, keeping these shapes.
 */
export type { Product, ProductCategory, ProductSlug, UnitKey };

export function getProducts(): readonly Product[] {
  return PRODUCTS;
}

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((product) => product.slug === slug);
}

export function getCategories(): readonly ProductCategory[] {
  return PRODUCT_CATEGORIES;
}

export function getCategory(id: string): ProductCategory | undefined {
  return PRODUCT_CATEGORIES.find((category) => category.id === id);
}

/** A category's products, in catalogue order. */
export function categoryProducts(category: ProductCategory): Product[] {
  return category.products
    .map((slug) => getProduct(slug))
    .filter((product): product is Product => product !== undefined);
}

/** Broader editorial ranges can combine existing catalogue groups without duplicate cards. */
export function productsForCategories(...ids: (string | undefined)[]): Product[] {
  const products = ids.flatMap((id) => {
    const category = id ? getCategory(id) : undefined;
    return category ? categoryProducts(category) : [];
  });
  return [...new Map(products.map((product) => [product.slug, product])).values()];
}

/** Sold online at a fixed price; everything else is quoted on enquiry. */
export function isPurchasable(product: Product): boolean {
  return product.channel === "shop" && product.price !== null;
}

/** Whether any of a category's products can be bought online. */
export function isSellable(category: ProductCategory): boolean {
  return categoryProducts(category).some(isPurchasable);
}

/** The image a card shows: a transparent pack shot when there is one, else the portrait. */
export function productImage(product: Product): string {
  return product.cardImage ?? `/products/${product.slug}/card-portrait.png`;
}

export const BRAND_NAMES: Record<NonNullable<Product["brand"]>, string> = {
  pardis: "Pardis",
  aladdin: "Aladdin",
};

/** Net weight in grams for the units sold by weight; packs of unconfirmed weight are absent. */
const UNIT_GRAMS: Partial<Record<Product["unit"], number>> = {
  kg1: 1000,
  kg5: 5000,
  sack10: 10000,
  sack25: 25000,
};

/**
 * The price per kilogram (PAngV § 4), in cents, when it must be shown next to the price.
 * Not for 1-kg units, where it equals the price, nor for packs of 10 g or less (§ 4 Abs. 3).
 */
export function pricePerKg(product: Product): number | null {
  const grams = UNIT_GRAMS[product.unit];
  if (product.price === null || !grams || grams === 1000) return null;
  return Math.round((product.price * 1000) / grams);
}

/** Integer cents to a localised euro amount. The only place prices are formatted. */
export function formatPrice(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(cents / 100);
}
