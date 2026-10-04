import { describe, expect, it } from "vitest";
import { cartSummary, changeCart, normalizeCart, parseCart } from "../src/commerce/cart/model";

const rice = "pardis-basmati-indien-1kg";
const tea = "vahdam-earl-grey";
describe("cart contract", () => {
  it("merges repeated additions and keeps stable product identifiers", () => {
    const first = changeCart([], { type: "add", productId: rice, quantity: 2 });
    expect(changeCart(first, { type: "add", productId: rice, quantity: 3 })).toEqual([
      { productId: rice, quantity: 5 },
    ]);
  });
  it("rejects quote-only and unknown products", () => {
    for (const productId of ["kichererbsen-25kg", "ginger", "almonds-cashews", "missing-product"]) {
      expect(changeCart([], { type: "add", productId, quantity: 1 })).toEqual([]);
    }
  });
  it("bounds quantities and rejects negative, fractional and nonfinite requests", () => {
    const lines = changeCart([], { type: "add", productId: rice, quantity: 98 });
    expect(changeCart(lines, { type: "add", productId: rice, quantity: 9 })[0]?.quantity).toBe(99);
    for (const quantity of [-1, 0, 1.5, Infinity, NaN])
      expect(changeCart(lines, { type: "add", productId: rice, quantity })).toEqual(lines);
  });
  it("updates and removes a line without affecting other products", () => {
    const lines = normalizeCart([
      { productId: rice, quantity: 2 },
      { productId: tea, quantity: 1 },
    ]);
    expect(changeCart(lines, { type: "quantity", productId: rice, quantity: 4 })[0]?.quantity).toBe(
      4,
    );
    expect(changeCart(lines, { type: "quantity", productId: rice, quantity: 0 })).toEqual([
      { productId: tea, quantity: 1 },
    ]);
    expect(changeCart(lines, { type: "remove", productId: tea })).toEqual([
      { productId: rice, quantity: 2 },
    ]);
  });
  it("restores valid lines but never accepts stored prices or wholesale lines", () => {
    const raw = JSON.stringify({
      version: 1,
      lines: [
        { productId: rice, quantity: 2, price: 1 },
        { productId: rice, quantity: 1 },
        { productId: "pistazienkerne", quantity: 3 },
        null,
      ],
    });
    expect(parseCart(raw).lines).toEqual([{ productId: rice, quantity: 3 }]);
    expect(cartSummary(parseCart(raw).lines).subtotal).toBe(1170);
  });
  it("keeps the voucher code and note of a version 2 cart, within bounds", () => {
    const raw = JSON.stringify({
      version: 2,
      lines: [{ productId: rice, quantity: 1 }],
      voucher: "WELCOME10",
      note: "x".repeat(2000),
    });
    const cart = parseCart(raw);
    expect(cart.voucher).toBe("WELCOME10");
    expect(cart.note).toHaveLength(1000);
  });
  it("recovers safely from corrupted, unversioned or oversized storage", () => {
    for (const raw of [
      null,
      "invalid",
      "null",
      "[]",
      '{"version":3,"lines":[]}',
      "x".repeat(40000),
    ])
      expect(parseCart(raw)).toEqual({ lines: [], voucher: "", note: "" });
  });
  it("calculates totals in integer cents from current catalogue data", () => {
    const summary = cartSummary([
      { productId: tea, quantity: 3 },
      { productId: rice, quantity: 2 },
    ]);
    expect(summary.count).toBe(5);
    expect(summary.subtotal).toBe(1827);
  });
});
