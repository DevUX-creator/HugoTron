import { afterEach, describe, expect, it, vi } from "vitest";
import {
  hasGuestAccess,
  issueGuestAccess,
  GUEST_ACCESS_SECONDS,
} from "../src/commerce/checkout/guestAccess";
import { safeReturn } from "../src/commerce/account/returnPath";
import { createRateLimitStore } from "../src/lib/rateLimitStore";
import { siteOrigin } from "../src/commerce/runtime";
import { priceLines } from "../src/commerce/checkout/pricing";
import { voucherSchema } from "../src/commerce/checkout/schema";

afterEach(() => vi.unstubAllEnvs());

describe("guest order capability", () => {
  const key = "test-key-not-for-deployment-0123456789";
  const now = Date.UTC(2026, 9, 4);
  const reference = "HT-261004-TEST123456";
  it("permits only the signed order until expiry", () => {
    const token = issueGuestAccess(reference, now, key);
    expect(hasGuestAccess(token, reference, now, key)).toBe(true);
    expect(hasGuestAccess(token, "HT-OTHER", now, key)).toBe(false);
    expect(hasGuestAccess(token, reference, now + GUEST_ACCESS_SECONDS * 1000, key)).toBe(false);
    expect(hasGuestAccess(token, reference, now, "different-key")).toBe(false);
  });
  it("rejects the old plain-reference cookie, malformed data and altered signatures", () => {
    const token = issueGuestAccess(reference, now, key);
    for (const forged of [undefined, reference, "a.b.c", "a.b", token + "A", "x".repeat(2000)])
      expect(hasGuestAccess(forged, reference, now, key)).toBe(false);
    const [payload, mac] = token.split(".");
    const altered = JSON.parse(Buffer.from(payload!, "base64url").toString());
    altered.ref = "HT-OTHER";
    expect(
      hasGuestAccess(
        `${Buffer.from(JSON.stringify(altered)).toString("base64url")}.${mac}`,
        altered.ref,
        now,
        key,
      ),
    ).toBe(false);
  });
  it("requires a production signing secret", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("COMMERCE_COOKIE_SECRET", "");
    expect(() => issueGuestAccess(reference)).toThrow("COMMERCE_COOKIE_SECRET");
    vi.stubEnv("COMMERCE_COOKIE_SECRET", key);
    expect(hasGuestAccess(issueGuestAccess(reference), reference)).toBe(true);
  });
});

describe("local redirects", () => {
  it.each([
    "//example.invalid",
    "/\\example.invalid",
    "/%5cexample.invalid",
    "/%2fexample.invalid",
    "/%255cexample.invalid",
    "/\n/example.invalid",
    "https://example.invalid",
    "javascript:alert(1)",
    null,
  ])("rejects %s", (path) => {
    expect(safeReturn(path)).toBeNull();
  });
  it("preserves valid local paths, queries and anchors", () => {
    expect(safeReturn("/de/konto?tab=orders#latest")).toBe("/de/konto?tab=orders#latest");
    expect(safeReturn("/en/checkout")).toBe("/en/checkout");
  });
});

describe("bounded request limits", () => {
  it("enforces limits, separates scopes and evicts expired identities", () => {
    const store = createRateLimitStore({ maxKeys: 2, limit: 2, windowMs: 100 });
    expect(store.allow("order:a", 0)).toBe(true);
    expect(store.allow("order:a", 1)).toBe(true);
    expect(store.allow("order:a", 2)).toBe(false);
    expect(store.allow("voucher:a", 2)).toBe(true);
    expect(store.allow("order:b", 2)).toBe(false);
    expect(store.size).toBe(2);
    expect(store.allow("order:b", 200)).toBe(true);
    expect(store.size).toBe(1);
  });
});

describe("untrusted cart and voucher input", () => {
  it.each([0, -1, 1.5, NaN, Infinity, 100000])("rejects quantity %s before pricing", (quantity) => {
    expect(priceLines([{ productId: "pardis-1121-basmati-indien", quantity }])).toBeNull();
  });
  it("rejects malformed, empty and unbounded voucher requests", () => {
    for (const value of [
      {},
      { code: "X", lines: null },
      { code: "X", lines: [] },
      { code: "X".repeat(41), lines: [] },
    ])
      expect(voucherSchema.safeParse(value).success).toBe(false);
  });
});

describe("payment return origin", () => {
  it("requires an explicit HTTPS origin in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const value of [
      "",
      "http://localhost:3000",
      "https://example.com/path",
      "https://user:pass@example.com",
      "https://example.com?x=1",
    ]) {
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", value);
      expect(() => siteOrigin()).toThrow();
    }
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.hugo-tron.com");
    expect(siteOrigin()).toBe("https://www.hugo-tron.com");
  });
});
