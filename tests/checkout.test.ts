import { describe, expect, it } from "vitest";
import { computeTotals, priceLines } from "../src/commerce/checkout/pricing";
import { checkoutSchema } from "../src/commerce/checkout/schema";
import { orderReference } from "../src/commerce/checkout/reference";
import { shippingCost } from "../src/commerce/config";
import { mockBackend } from "../src/commerce/backend/mock";

const RICE = "pardis-1121-basmati-indien"; // 18,90 € per 5 kg
const ADDRESS = {
  firstName: "Ada",
  lastName: "Buyer",
  company: "",
  street: "Friesenweg 2b",
  addition: "",
  postcode: "22763",
  city: "Hamburg",
  country: "DE",
  phone: "",
};
const VALID = {
  checkoutId: "b501f308-91a1-4d61-b98c-28a8a684a09f",
  lines: [{ productId: RICE, quantity: 2 }],
  email: "buyer@example.com",
  shippingAddress: ADDRESS,
  shippingMethod: "standard",
  paymentMethod: "paypal",
  billingSameAsShipping: true,
  billingAddress: null,
  voucher: "",
  note: "",
  acceptTerms: true,
  locale: "de",
};

describe("checkout pricing", () => {
  it("prices lines from the catalogue, never from the request", () => {
    const priced = priceLines([{ productId: RICE, quantity: 2 }]);
    expect(priced?.subtotal).toBe(3780);
    expect(priced?.lines[0]).toMatchObject({ unitPrice: 1890, lineTotal: 3780, unit: "kg5" });
  });
  it("refuses the whole cart when any line is quoted, unknown or repeated", () => {
    expect(priceLines([{ productId: "kichererbsen-25kg", quantity: 1 }])).toBeNull();
    expect(priceLines([{ productId: "nothing", quantity: 1 }])).toBeNull();
    expect(
      priceLines([
        { productId: RICE, quantity: 1 },
        { productId: RICE, quantity: 1 },
      ]),
    ).toBeNull();
  });
  it("charges a set price below the free threshold and none above it", () => {
    const priced = { id: "standard", price: 490, freeFrom: 5000 };
    expect(shippingCost(priced, 4999)).toBe(490);
    expect(shippingCost(priced, 5000)).toBe(0);
  });
  it("leaves unpriced shipping out of the total until it is confirmed", () => {
    const totals = computeTotals(2000, "standard");
    expect(totals.shipping).toBeNull();
    expect(totals.total).toBe(2000);
  });
  it("never discounts below zero and reports the VAT contained in the total", () => {
    const totals = computeTotals(1000, "standard", 5000);
    expect(totals.total).toBe(0);
    const priced = computeTotals(10700, "standard");
    expect(priced.vatIncluded).toBe(700);
  });
});

describe("checkout contract", () => {
  it("accepts a complete guest checkout", () => {
    expect(checkoutSchema.safeParse(VALID).success).toBe(true);
  });
  it("requires the terms to be accepted (§ 312j BGB)", () => {
    expect(checkoutSchema.safeParse({ ...VALID, acceptTerms: false }).success).toBe(false);
  });
  it("requires a billing address when it differs from delivery", () => {
    const result = checkoutSchema.safeParse({ ...VALID, billingSameAsShipping: false });
    expect(result.success).toBe(false);
  });
  it("rejects countries, payment and shipping methods that are not configured", () => {
    for (const change of [
      { shippingAddress: { ...ADDRESS, country: "US" } },
      { paymentMethod: "bitcoin" },
      { shippingMethod: "drone" },
    ])
      expect(checkoutSchema.safeParse({ ...VALID, ...change }).success).toBe(false);
  });
  it("creates readable references", () => {
    expect(orderReference(new Date("2026-10-04T12:00:00Z"))).toMatch(/^HT-261004-[A-Z2-9]{10}$/);
  });
});

describe("mock backend", () => {
  it("signs the demo customer in and refuses a wrong password", async () => {
    expect(await mockBackend.auth.signIn("demo@hugo-tron.test", "wrong")).toBeNull();
    const token = await mockBackend.auth.signIn("demo@hugo-tron.test", "demo1234");
    expect(token).toBeTruthy();
    const customer = await mockBackend.auth.customer(token!);
    expect(customer?.email).toBe("demo@hugo-tron.test");
    expect(customer).not.toHaveProperty("password");
  });
  it("refuses a second account for the same email", async () => {
    const details = {
      email: "new@example.com",
      password: "longenough",
      firstName: "N",
      lastName: "B",
    };
    expect(await mockBackend.auth.register(details)).toBeTruthy();
    expect(await mockBackend.auth.register(details)).toBeNull();
  });
  it("values vouchers on the subtotal and rejects unknown codes", async () => {
    expect((await mockBackend.vouchers.lookup("welcome10", 5000))?.discount).toBe(500);
    expect(await mockBackend.vouchers.lookup("NOPE", 5000)).toBeNull();
  });
  it("lists a customer's orders newest first", async () => {
    const orders = await mockBackend.orders.listForCustomer("cus_demo");
    expect(orders.length).toBeGreaterThanOrEqual(2);
    expect(orders[0]!.placedAt >= orders[1]!.placedAt).toBe(true);
  });
});
