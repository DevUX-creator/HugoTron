"use server";

import { typedValues } from "@/lib/formValues";
import { withinRateLimit } from "@/lib/rateLimit";
import { orderSchema, readOrder } from "@/lib/orders/schema";
import { priceOrder } from "@/lib/orders/pricing";
import { deliverOrder, orderReference } from "@/lib/orders/provider";

/** What the form gets back. `error` is a message key; the client owns the language. */
export type OrderState = {
  ok: boolean;
  reference?: string;
  error?: "errorEmail" | "errorDetails" | "errorCart" | "errorRate" | "errorGeneric";
  /** What the buyer typed, returned with an error: React resets the form after every action. */
  values?: Record<string, string>;
};

/**
 * The order request's submit handler. It owns the ORDER of the checks only: the shape lives in
 * `lib/orders/schema`, prices in `lib/orders/pricing`, delivery behind `lib/orders/provider`.
 */
export async function submitOrder(_previous: OrderState, formData: FormData): Promise<OrderState> {
  // The bot trap first, so a flood never consumes a real buyer's allowance.
  if (formData.get("company_website")) return { ok: true };

  const values = typedValues(formData, ["lines"]);
  const parsed = orderSchema.safeParse(readOrder(formData));
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path[0]);
    if (fields.includes("lines")) return { ok: false, error: "errorCart", values };
    return { ok: false, error: fields.includes("email") ? "errorEmail" : "errorDetails", values };
  }

  const priced = priceOrder(parsed.data.lines);
  if (!priced) return { ok: false, error: "errorCart", values };

  if (!(await withinRateLimit("order"))) return { ok: false, error: "errorRate", values };

  const reference = orderReference();
  try {
    const { lines: _submitted, ...details } = parsed.data;
    await deliverOrder({
      ...details,
      ...priced,
      reference,
      receivedAt: new Date().toISOString(),
    });
  } catch (cause) {
    console.error("[order] delivery failed", cause);
    return { ok: false, error: "errorGeneric", values };
  }
  return { ok: true, reference };
}
