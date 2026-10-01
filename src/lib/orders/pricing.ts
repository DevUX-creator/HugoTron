import { getProduct, isPurchasable, type ProductSlug, type UnitKey } from "@/lib/catalogue";
import type { OrderInput } from "./schema";

export type PricedLine = {
  productId: ProductSlug;
  quantity: number;
  unit: UnitKey;
  /** Integer cents, from the catalogue at the moment of the request. */
  unitPrice: number;
  lineTotal: number;
};

export type PricedOrder = { lines: PricedLine[]; subtotal: number };

/**
 * Prices an order from the catalogue, never from the browser. Returns null when any line is not
 * something the shop sells online (unknown, quoted or repeated), so a stale or tampered cart is
 * refused as a whole rather than silently trimmed: the buyer must see exactly what they request.
 */
export function priceOrder(lines: OrderInput["lines"]): PricedOrder | null {
  const seen = new Set<string>();
  const priced: PricedLine[] = [];
  for (const line of lines) {
    const product = getProduct(line.productId);
    if (!product || !isPurchasable(product) || seen.has(product.slug)) return null;
    seen.add(product.slug);
    const unitPrice = product.price!;
    priced.push({
      productId: product.slug,
      quantity: line.quantity,
      unit: product.unit,
      unitPrice,
      lineTotal: unitPrice * line.quantity,
    });
  }
  return { lines: priced, subtotal: priced.reduce((sum, line) => sum + line.lineTotal, 0) };
}
