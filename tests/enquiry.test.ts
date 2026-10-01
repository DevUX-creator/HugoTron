import { beforeEach, describe, expect, it, vi } from "vitest";

import { submitEnquiry, ENQUIRY_INITIAL_STATE } from "../src/app/[locale]/enquiry/actions";
import * as delivery from "../src/lib/enquiry/provider";
import { resetRateLimit } from "../src/lib/rateLimit";
import type { Enquiry } from "../src/lib/enquiry/schema";

type DeliverSpy = { mock: { calls: [Enquiry][] } };

/** The enquiry handed to `deliverEnquiry` on its nth call, or a failed test. */
function delivered(spy: DeliverSpy, call = 0): Enquiry {
  const args = spy.mock.calls[call];
  if (!args) throw new Error(`deliverEnquiry was not called ${call + 1} time(s)`);
  return args[0];
}

/**
 * A Server Action is reachable by direct POST, not only through our own form,
 * so what it accepts and rejects is the actual contract — the client-side
 * `required` attribute is a convenience and nothing more. These call the
 * action the way the network can.
 */
function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

const VALID = { email: "buyer@example.com", locale: "en" };

describe("submitEnquiry", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    /* The allowance is module state and would otherwise leak between cases —
       the fifth submission in this file would start failing for a reason the
       case under test knows nothing about. */
    resetRateLimit();
  });

  it("accepts an enquiry that carries nothing but an email address", async () => {
    const deliver = vi.spyOn(delivery, "deliverEnquiry").mockResolvedValue();

    const state = await submitEnquiry(ENQUIRY_INITIAL_STATE, form(VALID));

    expect(state).toEqual({ ok: true });
    expect(deliver).toHaveBeenCalledTimes(1);
    expect(delivered(deliver)).toMatchObject({
      email: "buyer@example.com",
      purpose: "other",
      product: "",
    });
  });

  it("rejects a missing or malformed email, and says which error it was", async () => {
    const deliver = vi.spyOn(delivery, "deliverEnquiry").mockResolvedValue();

    for (const email of ["", "not-an-address", "@example.com"]) {
      const state = await submitEnquiry(ENQUIRY_INITIAL_STATE, form({ ...VALID, email }));
      expect(state, `"${email}"`).toMatchObject({ ok: false, error: "errorEmail" });
    }
    expect(deliver).not.toHaveBeenCalled();
  });

  it("trims whitespace rather than storing it", async () => {
    const deliver = vi.spyOn(delivery, "deliverEnquiry").mockResolvedValue();

    await submitEnquiry(
      ENQUIRY_INITIAL_STATE,
      form({ ...VALID, product: "  Basmati 1121  ", company: "  Kantine Nord " }),
    );

    expect(delivered(deliver)).toMatchObject({
      product: "Basmati 1121",
      company: "Kantine Nord",
    });
  });

  it("keeps the purpose when it is one of ours and falls back when it is not", async () => {
    const deliver = vi.spyOn(delivery, "deliverEnquiry").mockResolvedValue();

    await submitEnquiry(ENQUIRY_INITIAL_STATE, form({ ...VALID, purpose: "sample" }));
    expect(delivered(deliver).purpose).toBe("sample");

    await submitEnquiry(ENQUIRY_INITIAL_STATE, form({ ...VALID, purpose: "admin" }));
    expect(delivered(deliver, 1).purpose).toBe("other");
  });

  it("caps field length instead of forwarding an unbounded payload", async () => {
    const deliver = vi.spyOn(delivery, "deliverEnquiry").mockResolvedValue();

    const state = await submitEnquiry(
      ENQUIRY_INITIAL_STATE,
      form({ ...VALID, message: "x".repeat(4001) }),
    );

    expect(state).toMatchObject({ ok: false, error: "errorLong" });
    expect(deliver).not.toHaveBeenCalled();
  });

  /* Swallowed silently and answered with success: a bot that is told why it
     failed simply comes back having fixed it. */
  it("drops a submission that filled the honeypot, without delivering it", async () => {
    const deliver = vi.spyOn(delivery, "deliverEnquiry").mockResolvedValue();

    const state = await submitEnquiry(
      ENQUIRY_INITIAL_STATE,
      form({ ...VALID, company_website: "http://spam.example" }),
    );

    expect(state).toEqual({ ok: true });
    expect(deliver).not.toHaveBeenCalled();
  });

  /* The buyer is told to email instead — which is only honest if a failure
     here actually reaches them rather than resolving as a success. */
  it("reports a delivery failure rather than pretending the enquiry landed", async () => {
    vi.spyOn(delivery, "deliverEnquiry").mockRejectedValue(new Error("smtp down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const state = await submitEnquiry(ENQUIRY_INITIAL_STATE, form(VALID));

    expect(state).toMatchObject({ ok: false, error: "errorGeneric" });
  });

  /* The action is a public POST endpoint, not a private channel from our own
     page, so the cap is part of what it promises. */
  it("stops accepting once the sender is over their allowance", async () => {
    const deliver = vi.spyOn(delivery, "deliverEnquiry").mockResolvedValue();

    const states = [];
    for (let i = 0; i < 7; i++) {
      states.push(await submitEnquiry(ENQUIRY_INITIAL_STATE, form(VALID)));
    }

    expect(states.slice(0, 5).every((state) => state.ok)).toBe(true);
    expect(states[5]).toMatchObject({ ok: false, error: "errorRate" });
    expect(states[6]).toMatchObject({ ok: false, error: "errorRate" });
    expect(deliver).toHaveBeenCalledTimes(5);
  });

  /* A refused submission must not extend its own window, or a flood would
     hold the door shut indefinitely. */
  it("does not count a refused submission against the window", async () => {
    vi.spyOn(delivery, "deliverEnquiry").mockResolvedValue();

    for (let i = 0; i < 5; i++) await submitEnquiry(ENQUIRY_INITIAL_STATE, form(VALID));
    await submitEnquiry(ENQUIRY_INITIAL_STATE, form(VALID));

    /* A malformed one is rejected before the limiter is ever consulted. */
    const malformed = await submitEnquiry(ENQUIRY_INITIAL_STATE, form({ email: "nope" }));
    expect(malformed).toMatchObject({ ok: false, error: "errorEmail" });
  });
});
