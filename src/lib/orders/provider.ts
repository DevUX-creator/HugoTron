import type { OrderInput } from "./schema";
import type { PricedOrder } from "./pricing";

/** An accepted order request, as a provider receives it. */
export type Order = Omit<OrderInput, "lines"> &
  PricedOrder & {
    /** Shown to the buyer and quoted on the invoice. */
    reference: string;
    /** ISO 8601, set by the server. */
    receivedAt: string;
  };

/**
 * Where an accepted order request goes.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * THIS IS THE ORDERS SEAM FOR THE BACKEND. Nothing above this file knows how an
 * order is processed; nothing below it knows about forms or React. To connect
 * order management (ERP, invoicing tool, shop backend, an email to sales), add a
 * provider here and select it with `ORDER_PROVIDER`. The checkout action, form
 * and cart do not change.
 *
 * `console` is the default so checkout works on a fresh clone. It delivers
 * nothing and says so. A provider MUST throw when it fails: the buyer is then
 * told the request did not go through, instead of believing it did.
 * ────────────────────────────────────────────────────────────────────────────
 */
export type OrderProvider = (order: Order) => Promise<void>;

const providers: Record<string, OrderProvider> = {
  async console(order) {
    console.info("[order] NOT DELIVERED — console provider. See lib/orders/provider.ts", {
      reference: order.reference,
      email: order.email,
      lines: order.lines,
      subtotal: order.subtotal,
    });
  },
};

export function selectedOrderProvider(): OrderProvider {
  const name = process.env.ORDER_PROVIDER ?? "console";
  const provider = providers[name];
  if (!provider) {
    throw new Error(
      `Unknown ORDER_PROVIDER "${name}". Known: ${Object.keys(providers).join(", ")}`,
    );
  }
  return provider;
}

/** Hand a priced order to whichever provider is configured. */
export async function deliverOrder(order: Order): Promise<void> {
  await selectedOrderProvider()(order);
}

/** A short, human-readable reference: HT-YYMMDD-XXXX. */
export function orderReference(now = new Date()): string {
  const date = now.toISOString().slice(2, 10).replaceAll("-", "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, "0");
  return `HT-${date}-${suffix}`;
}
