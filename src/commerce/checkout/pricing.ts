import { getProduct, isPurchasable } from "../catalogue";
import { COMMERCE, shippingCost, shippingMethod } from "../config";
import type { OrderLine, OrderTotals } from "../types";
import { cartLinesSchema } from "./schema";

/**
 * Totals from a subtotal, a delivery method and a discount. Pure, so the order summary in the
 * browser and the server agree to the cent; the server's result is the one that counts.
 */
export function computeTotals(
  subtotal: number,
  shippingMethodId: string,
  discount = 0,
): OrderTotals {
  const method = shippingMethod(shippingMethodId) ?? COMMERCE.shipping[0];
  const shipping = shippingCost(method, subtotal);
  const applied = Math.min(Math.max(0, discount), subtotal + (shipping ?? 0));
  const total = subtotal + (shipping ?? 0) - applied;
  return {
    subtotal,
    shipping,
    discount: applied,
    total,
    vatIncluded: Math.round(total - total / (1 + COMMERCE.vatRate)),
  };
}

/**
 * Prices cart lines from the catalogue, never from the browser. Returns null when any line is
 * not sold online (unknown, quoted or repeated): a stale or tampered cart is refused as a whole
 * so the buyer pays for exactly what they saw.
 */
export function priceLines(
  lines: readonly { productId: string; quantity: number }[],
): { lines: OrderLine[]; subtotal: number } | null {
  if (!cartLinesSchema.safeParse(lines).success) return null;
  const seen = new Set<string>();
  const priced: OrderLine[] = [];
  for (const line of lines) {
    const product = getProduct(line.productId);
    if (!product || !isPurchasable(product) || seen.has(product.slug)) return null;
    seen.add(product.slug);
    priced.push({
      productId: product.slug,
      quantity: line.quantity,
      unit: product.unit,
      unitPrice: product.price!,
      lineTotal: product.price! * line.quantity,
    });
  }
  return { lines: priced, subtotal: priced.reduce((sum, line) => sum + line.lineTotal, 0) };
}
