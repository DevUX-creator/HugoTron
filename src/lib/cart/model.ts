import {
  getProduct,
  getProducts,
  isPurchasable,
  type Product,
  type ProductSlug,
} from "@/lib/catalogue";

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

export function parseCart(raw: string | null): CartLine[] {
  if (!raw || raw.length > 32768) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (
      !data ||
      typeof data !== "object" ||
      !("version" in data) ||
      data.version !== 1 ||
      !("lines" in data)
    )
      return [];
    return normalizeCart(data.lines);
  } catch {
    return [];
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
