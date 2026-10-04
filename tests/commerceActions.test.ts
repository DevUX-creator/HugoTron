import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ cookies: new Map<string, string>(), decline: false }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      state.cookies.has(name) ? { value: state.cookies.get(name) } : undefined,
    set: (name: string, value: string, options?: { maxAge?: number }) => {
      if (options?.maxAge === 0) state.cookies.delete(name);
      else state.cookies.set(name, value);
    },
    delete: (name: string) => state.cookies.delete(name),
  }),
}));
vi.mock("next-intl/server", () => ({ getLocale: async () => "en" }));
vi.mock("@/i18n/navigation", () => ({
  getPathname: ({ href }: { href: { query: { ref: string } } }) =>
    `/en/checkout/confirmation?ref=${href.query.ref}`,
  redirect: () => {
    throw new Error("REDIRECT");
  },
}));
vi.mock("../src/commerce/dev/settings", () => ({
  guestCheckoutAllowed: async () => true,
  readDevSettings: async () => ({ allowGuest: true, payment: state.decline ? "fail" : "success" }),
}));

import { placeOrder, checkVoucher } from "../src/commerce/checkout/actions";
import { hasGuestAccess } from "../src/commerce/checkout/guestAccess";
import { startSocialAttempt, consumeSocialAttempt } from "../src/commerce/account/oauthState";
import { signIn, register, requestPasswordReset } from "../src/commerce/account/actions";
import { mockBackend } from "../src/commerce/backend/mock";
import { resetRateLimit } from "../src/lib/rateLimit";
import * as config from "../src/commerce/config";

const input = () => ({
  checkoutId: crypto.randomUUID(),
  lines: [{ productId: "pardis-1121-basmati-indien", quantity: 1 }],
  email: "test@example.invalid",
  locale: "en",
  voucher: "",
  note: "",
  acceptTerms: true,
  shippingMethod: "standard",
  paymentMethod: "paypal",
  billingSameAsShipping: true,
  billingAddress: null,
  shippingAddress: {
    firstName: "Test",
    lastName: "Buyer",
    company: "",
    street: "Test 1",
    addition: "",
    postcode: "20095",
    city: "Hamburg",
    country: "DE",
    phone: "",
  },
});

beforeEach(() => {
  state.cookies.clear();
  state.decline = false;
  resetRateLimit();
  vi.stubEnv("COMMERCE_BACKEND", "mock");
  vi.stubEnv("COMMERCE_COOKIE_SECRET", "test-secret-0123456789-test-secret-0123456789");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.hugo-tron.com");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("checkout actions", () => {
  it("does not store an order or start payment with unconfirmed shipping", async () => {
    const create = vi.spyOn(mockBackend.orders, "create");
    const payment = vi.spyOn(mockBackend.payments, "start");
    expect(await placeOrder(input())).toEqual({ ok: false, error: "shippingUnconfirmed" });
    expect(create).not.toHaveBeenCalled();
    expect(payment).not.toHaveBeenCalled();
  });
  it("reuses an order on a payment retry and grants signed access only to that order", async () => {
    vi.spyOn(config, "shippingCost").mockReturnValue(0); // A confirmed test quote, not production pricing.
    const create = vi.spyOn(mockBackend.orders, "create");
    const request = input();
    state.decline = true;
    expect(await placeOrder(request)).toEqual({ ok: false, error: "paymentDeclined" });
    state.decline = false;
    const result = await placeOrder(request);
    expect(result.ok).toBe(true);
    const first = await create.mock.results[0]!.value;
    const second = await create.mock.results[1]!.value;
    expect(second.reference).toBe(first.reference);
    expect(hasGuestAccess(state.cookies.get("ht_last_order"), first.reference)).toBe(true);
    expect(hasGuestAccess(state.cookies.get("ht_last_order"), "HT-260928-7KQ2")).toBe(false);
    expect(await placeOrder({ ...request, email: "different@example.invalid" })).toEqual({
      ok: false,
      error: "generic",
    });
  });
  it("collapses concurrent submissions with the same checkout key", async () => {
    vi.spyOn(config, "shippingCost").mockReturnValue(0);
    const request = input();
    const [a, b] = await Promise.all([placeOrder(request), placeOrder(request)]);
    expect(a.ok).toBe(true);
    expect(a).toEqual(b);
  });
  it("does not accept malformed vouchers and applies a server rate limit", async () => {
    const lookup = vi.spyOn(mockBackend.vouchers, "lookup");
    expect(await checkVoucher("WELCOME10", null)).toEqual({ ok: false, error: "voucherInvalid" });
    expect(
      await checkVoucher("WELCOME10", [{ productId: "pardis-1121-basmati-indien", quantity: -1 }]),
    ).toEqual({ ok: false, error: "voucherInvalid" });
    expect(lookup).not.toHaveBeenCalled();
    for (let i = 0; i < 3; i++) await checkVoucher("WELCOME10", input().lines);
    expect(await checkVoucher("WELCOME10", input().lines)).toEqual({
      ok: false,
      error: "rateLimited",
    });
  });
  it("refuses disabled production commerce before making mutations", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("COMMERCE_ALLOW_MOCK", "false");
    expect(await placeOrder(input())).toEqual({ ok: false, error: "unavailable" });
  });
});

describe("recoverable account errors", () => {
  it("keeps password whitespace and reports provider failure inline", async () => {
    const provider = vi.spyOn(mockBackend.auth, "signIn").mockRejectedValue(new Error("offline"));
    const form = new FormData();
    form.set("email", "test@example.invalid");
    form.set("password", " spaced password ");
    expect((await signIn({ status: "idle" }, form)).message).toBe("generic");
    expect(provider).toHaveBeenCalledWith("test@example.invalid", " spaced password ");
  });
  it("reports registration and reset outages without throwing into the page", async () => {
    vi.spyOn(mockBackend.auth, "register").mockRejectedValue(new Error("offline"));
    vi.spyOn(mockBackend.auth, "requestPasswordReset").mockRejectedValue(new Error("offline"));
    const form = new FormData();
    for (const [key, value] of Object.entries({
      email: "test@example.invalid",
      password: "longenough",
      firstName: "Test",
      lastName: "Buyer",
    }))
      form.set(key, value);
    expect((await register({ status: "idle" }, form)).message).toBe("generic");
    expect((await requestPasswordReset({ status: "idle" }, form)).message).toBe("generic");
  });
});

describe("browser-bound OAuth state", () => {
  it("consumes a valid nonce once and keeps the local return path", async () => {
    const nonce = await startSocialAttempt("google", "/en/checkout");
    expect(await consumeSocialAttempt("google", nonce)).toBe("/en/checkout");
    expect(await consumeSocialAttempt("google", nonce)).toBeNull();
  });
  it("refuses mismatched providers, forged state, missing cookies and external return paths", async () => {
    let nonce = await startSocialAttempt("google", "/en/checkout");
    expect(await consumeSocialAttempt("apple", nonce)).toBeNull();
    nonce = await startSocialAttempt("google", "/\\example.invalid");
    expect(await consumeSocialAttempt("google", nonce)).toBe("/");
    await startSocialAttempt("google", "/en");
    expect(await consumeSocialAttempt("google", "a".repeat(43))).toBeNull();
  });
});
