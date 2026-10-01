import { beforeEach, describe, expect, it, vi } from "vitest";

import { submitOrder } from "../src/app/[locale]/checkout/actions";
import * as delivery from "../src/lib/orders/provider";
import { priceOrder } from "../src/lib/orders/pricing";
import { resetRateLimit } from "../src/lib/rateLimit";
import type { Order } from "../src/lib/orders/provider";

/** An order action is a public POST endpoint: these call it the way the network can. */
function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

const DETAILS = {
  name: "Ada Buyer",
  email: "buyer@example.com",
  street: "Friesenweg 2b",
  postcode: "22763",
  city: "Hamburg",
  country: "Germany",
  locale: "en",
};
const lines = (value: unknown) => ({ lines: JSON.stringify(value) });
const RICE = { productId: "pardis-1121-basmati-indien", quantity: 2 };

function delivered(spy: { mock: { calls: [Order][] } }): Order {
  const args = spy.mock.calls[0];
  if (!args) throw new Error("deliverOrder was not called");
  return args[0];
}

describe("priceOrder", () => {
  it("prices every line from the catalogue", () => {
    expect(priceOrder([RICE])).toEqual({
      lines: [
        { productId: RICE.productId, quantity: 2, unit: "kg5", unitPrice: 1890, lineTotal: 3780 },
      ],
      subtotal: 3780,
    });
  });

  it("refuses quoted, unknown and repeated lines", () => {
    expect(priceOrder([{ productId: "kichererbsen-25kg", quantity: 1 }])).toBeNull();
    expect(priceOrder([{ productId: "missing-product", quantity: 1 }])).toBeNull();
    expect(priceOrder([RICE, RICE])).toBeNull();
  });
});

describe("submitOrder", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetRateLimit();
  });

  it("accepts a complete request and hands the provider server-side prices", async () => {
    const spy = vi.spyOn(delivery, "deliverOrder").mockResolvedValue();
    const tampered = [{ ...RICE, unitPrice: 1 }];
    const state = await submitOrder({ ok: false }, form({ ...DETAILS, ...lines(tampered) }));
    expect(state.ok).toBe(true);
    expect(state.reference).toMatch(/^HT-\d{6}-[A-Z0-9]{4}$/);
    const order = delivered(spy);
    expect(order.subtotal).toBe(3780);
    expect(order.lines[0]?.unitPrice).toBe(1890);
    expect(order.reference).toBe(state.reference);
  });

  it("names the email when it is the problem", async () => {
    const state = await submitOrder(
      { ok: false },
      form({ ...DETAILS, email: "not-an-email", ...lines([RICE]) }),
    );
    expect(state).toMatchObject({ ok: false, error: "errorEmail" });
  });

  it("requires the billing address", async () => {
    const state = await submitOrder(
      { ok: false },
      form({ ...DETAILS, city: "", ...lines([RICE]) }),
    );
    expect(state).toMatchObject({ ok: false, error: "errorDetails" });
  });

  it("hands back what was typed with an error, but never the cart or the bot trap", async () => {
    const state = await submitOrder(
      { ok: false },
      form({ ...DETAILS, city: "", ...lines([RICE]), company_website: "" }),
    );
    expect(state.values).toMatchObject({ name: "Ada Buyer", street: "Friesenweg 2b" });
    expect(state.values).not.toHaveProperty("lines");
    expect(state.values).not.toHaveProperty("company_website");
  });

  it("refuses an empty cart and a line the shop does not sell online", async () => {
    const spy = vi.spyOn(delivery, "deliverOrder").mockResolvedValue();
    expect(await submitOrder({ ok: false }, form({ ...DETAILS, ...lines([]) }))).toMatchObject({
      ok: false,
      error: "errorCart",
    });
    const quoted = lines([{ productId: "kichererbsen-25kg", quantity: 1 }]);
    expect(await submitOrder({ ok: false }, form({ ...DETAILS, ...quoted }))).toMatchObject({
      ok: false,
      error: "errorCart",
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it("drops a filled bot trap without delivering", async () => {
    const spy = vi.spyOn(delivery, "deliverOrder").mockResolvedValue();
    const state = await submitOrder(
      { ok: false },
      form({ ...DETAILS, ...lines([RICE]), company_website: "spam" }),
    );
    expect(state.ok).toBe(true);
    expect(spy).not.toHaveBeenCalled();
  });

  it("tells the buyer when delivery fails", async () => {
    vi.spyOn(delivery, "deliverOrder").mockRejectedValue(new Error("down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const state = await submitOrder({ ok: false }, form({ ...DETAILS, ...lines([RICE]) }));
    expect(state).toMatchObject({ ok: false, error: "errorGeneric" });
  });

  it("limits how often one sender can order", async () => {
    vi.spyOn(delivery, "deliverOrder").mockResolvedValue();
    const results = [];
    for (let i = 0; i < 6; i++)
      results.push(await submitOrder({ ok: false }, form({ ...DETAILS, ...lines([RICE]) })));
    expect(results.slice(0, 5).every((state) => state.ok)).toBe(true);
    expect(results[5]).toMatchObject({ ok: false, error: "errorRate" });
  });
});
