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

/** Integer cents to a localised euro amount. The only place prices are formatted. */
export function formatPrice(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(cents / 100);
}
