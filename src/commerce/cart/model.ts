import {
  getProduct,
  getProducts,
  isPurchasable,
  type Product,
  type ProductSlug,
} from "@/commerce/catalogue";

export const MAX_CART_QUANTITY = 99;
export type CartLine = { productId: ProductSlug; quantity: number };
export type CartCommand =
  | { type: "add" | "quantity"; productId: string; quantity: number }
  | { type: "remove"; productId: string }
  | { type: "clear" };

/** Cart requests carry identifiers and quantities, never client-supplied prices. */
export function normalizeCart(
  input: unknown,
  catalogue: readonly Product[] = getProducts(),
): CartLine[] {
  if (!Array.isArray(input)) return [];
  const quantities = new Map<ProductSlug, number>();
  for (const candidate of input.slice(0, 500)) {
    if (!candidate || typeof candidate !== "object") continue;
    const { productId, quantity } = candidate as Record<string, unknown>;
    const product = catalogue.find((item) => item.slug === productId);
    if (
      !product ||
      !isPurchasable(product) ||
      typeof quantity !== "number" ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    )
      continue;
    quantities.set(
      product.slug,
      Math.min(MAX_CART_QUANTITY, (quantities.get(product.slug) ?? 0) + quantity),
    );
  }
  return [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
}

export function changeCart(lines: readonly CartLine[], command: CartCommand): CartLine[] {
  if (command.type === "clear") return [];
  const current = normalizeCart(lines);
  if (command.type === "remove" || (command.type === "quantity" && command.quantity === 0)) {
    return current.filter((line) => line.productId !== command.productId);
  }
  if (!Number.isSafeInteger(command.quantity) || command.quantity < 1) return current;
  const product = getProduct(command.productId);
  if (!product || !isPurchasable(product)) return current;
  const existing = current.find((line) => line.productId === product.slug);
  const quantity = Math.min(
    MAX_CART_QUANTITY,
    command.quantity + (command.type === "add" ? (existing?.quantity ?? 0) : 0),
  );
  return existing
    ? current.map((line) => (line.productId === product.slug ? { ...line, quantity } : line))
    : [...current, { productId: product.slug, quantity }];
}

/** What the cart carries besides its lines, entered on the cart page and used at checkout. */
export type CartExtras = { voucher: string; note: string };
export const NO_EXTRAS: CartExtras = { voucher: "", note: "" };

/**
 * Reads the stored cart. Version 1 held lines only; version 2 adds the voucher code and the
 * buyer's note. Anything unreadable becomes an empty cart.
 */
export function parseCart(raw: string | null): { lines: CartLine[] } & CartExtras {
  const empty = { lines: [], ...NO_EXTRAS };
  if (!raw || raw.length > 32768) return empty;
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || !("lines" in data) || !("version" in data))
      return empty;
    if (data.version !== 1 && data.version !== 2) return empty;
    const text = (key: string, max: number) => {
      const value = (data as Record<string, unknown>)[key];
      return typeof value === "string" ? value.slice(0, max) : "";
    };
    return {
      lines: normalizeCart(data.lines),
      voucher: text("voucher", 40),
      note: text("note", 1000),
    };
  } catch {
    return empty;
  }
}

export function cartSummary(lines: readonly CartLine[]) {
  const items = normalizeCart(lines).flatMap((line) => {
    const product = getProduct(line.productId);
    return product && product.price !== null
      ? [{ ...line, product, lineTotal: product.price * line.quantity }]
      : [];
  });
  return {
    items,
    count: items.reduce((count, line) => count + line.quantity, 0),
    subtotal: items.reduce((total, line) => total + line.lineTotal, 0),
  };
}
