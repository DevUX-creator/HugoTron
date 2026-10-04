"use server";

import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { getLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { withinRateLimit } from "@/lib/rateLimit";
import { backend, commerceAvailable } from "../backend";
import { guestCheckoutAllowed } from "../dev/settings";
import { getSession } from "../session";
import type { Order, Voucher } from "../types";
import { checkoutSchema, voucherSchema } from "./schema";
import { computeTotals, priceLines } from "./pricing";
import { LAST_ORDER_COOKIE, orderReference } from "./reference";
import { issueGuestAccess, GUEST_ACCESS_SECONDS } from "./guestAccess";
import { siteOrigin } from "../runtime";

/**
 * Checkout's server actions. Each owns only the ORDER of its checks; the contract lives in
 * ./schema, prices in ./pricing, every effect behind backend() (../backend/contracts.ts).
 *
 * Errors are message ids under `commerce.errors`; the client owns the language.
 */

export type PlaceOrderResult =
  | { ok: true; next: string }
  | {
      ok: false;
      error:
        | "invalid"
        | "signInRequired"
        | "cartChanged"
        | "voucherInvalid"
        | "paymentDeclined"
        | "rateLimited"
        | "unavailable"
        | "shippingUnconfirmed"
        | "generic";
      /** Field paths that failed validation, e.g. "shippingAddress.postcode". */
      fields?: string[];
    };

export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  if (!commerceAvailable()) return { ok: false, error: "unavailable" };
  if (!(await withinRateLimit("order"))) return { ok: false, error: "rateLimited" };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid",
      fields: parsed.error.issues.map((issue) => issue.path.join(".")),
    };
  }
  const checkout = parsed.data;

  try {
    const session = await getSession();
    if (!session && !(await guestCheckoutAllowed())) return { ok: false, error: "signInRequired" };
    const priced = priceLines(checkout.lines);
    if (!priced) return { ok: false, error: "cartChanged" };
    const origin = siteOrigin(); // Validate before any order/payment mutation.
    const totals = computeTotals(priced.subtotal, checkout.shippingMethod);
    if (totals.shipping === null) return { ok: false, error: "shippingUnconfirmed" };
    let voucher: Voucher | null = null;
    if (checkout.voucher) {
      voucher = await backend().vouchers.lookup(checkout.voucher, priced.subtotal);
      if (!voucher) return { ok: false, error: "voucherInvalid" };
    }

    const order: Order = {
      reference: orderReference(),
      status: "pending_payment",
      placedAt: new Date().toISOString(),
      locale: checkout.locale,
      customerId: session?.customer.id ?? null,
      email: checkout.email,
      lines: priced.lines,
      totals: computeTotals(priced.subtotal, checkout.shippingMethod, voucher?.discount),
      voucher: voucher?.code ?? null,
      note: checkout.note,
      shippingMethod: checkout.shippingMethod as Order["shippingMethod"],
      paymentMethod: checkout.paymentMethod,
      shippingAddress: checkout.shippingAddress,
      billingAddress: checkout.billingSameAsShipping
        ? checkout.shippingAddress
        : checkout.billingAddress!,
      tracking: null,
    };

    // Check signing configuration before storing anything. Re-sign the stored reference on retries.
    issueGuestAccess(order.reference);
    const fingerprint = createHash("sha256").update(JSON.stringify(checkout)).digest("hex");
    const stored = await backend().orders.create(order, {
      key: `${session?.customer.id ?? "guest"}:${checkout.checkoutId}`,
      fingerprint,
    });
    const locale = (await getLocale()) as Locale;
    const confirmation = getPathname({
      locale,
      href: { pathname: "/checkout/confirmation", query: { ref: stored.reference } },
    });
    const payment = await backend().payments.start(stored, `${origin}${confirmation}`);
    if (payment.kind === "failed") return { ok: false, error: "paymentDeclined" };

    // Lets this browser see its own confirmation without an account (see confirmation page).
    (await cookies()).set(LAST_ORDER_COOKIE, issueGuestAccess(stored.reference), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: GUEST_ACCESS_SECONDS,
    });
    return { ok: true, next: payment.kind === "redirect" ? payment.url : confirmation };
  } catch (cause) {
    console.error("[commerce] placeOrder failed", cause);
    return { ok: false, error: "generic" };
  }
}

export type VoucherResult =
  | { ok: true; voucher: Voucher }
  | {
      ok: false;
      error: "voucherInvalid" | "cartChanged" | "generic" | "rateLimited" | "unavailable";
    };

/** Checks a voucher against the current cart, for the cart page and the order summary. */
export async function checkVoucher(code: unknown, lines: unknown): Promise<VoucherResult> {
  if (!commerceAvailable()) return { ok: false, error: "unavailable" };
  if (!(await withinRateLimit("voucher"))) return { ok: false, error: "rateLimited" };
  const parsed = voucherSchema.safeParse({ code, lines });
  if (!parsed.success) return { ok: false, error: "voucherInvalid" };
  const priced = priceLines(parsed.data.lines);
  if (!priced) return { ok: false, error: "cartChanged" };
  try {
    const voucher = await backend().vouchers.lookup(parsed.data.code, priced.subtotal);
    return voucher ? { ok: true, voucher } : { ok: false, error: "voucherInvalid" };
  } catch (cause) {
    console.error("[commerce] checkVoucher failed", cause);
    return { ok: false, error: "generic" };
  }
}
