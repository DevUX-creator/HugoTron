import { afterEach, describe, expect, it, vi } from "vitest";

import { deliverEnquiry, selectedProvider } from "../src/lib/enquiry/provider";
import type { Enquiry } from "../src/lib/enquiry/schema";

const ENQUIRY: Enquiry = {
  topic: "enquiry",
  purpose: "quote",
  orderReference: "",
  product: "Basmati 1121",
  quantity: "2 pallets",
  packSize: "25 kg",
  postcode: "DE 22763",
  date: "",
  message: "",
  name: "",
  company: "",
  email: "buyer@example.com",
  phone: "",
  locale: "de",
  receivedAt: "2026-09-21T00:00:00.000Z",
};

/**
 * The provider is the one seam the backend team replaces, so the contract it
 * has to keep is asserted rather than described: the default works without
 * configuration, an unknown name fails loudly instead of silently dropping
 * enquiries, and a provider that cannot deliver throws.
 */
describe("enquiry provider", () => {
  afterEach(() => {
    delete process.env.ENQUIRY_PROVIDER;
    vi.restoreAllMocks();
  });

  it("defaults to console, so a fresh clone has a working form", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    await expect(deliverEnquiry(ENQUIRY)).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledOnce();
  });

  it("says so in the log, so nobody mistakes it for delivery", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    await deliverEnquiry(ENQUIRY);
    expect(String(log.mock.calls[0]?.[0])).toMatch(/NOT DELIVERED/);
  });

  it("refuses an unknown provider name rather than dropping the enquiry", () => {
    process.env.ENQUIRY_PROVIDER = "carrier-pigeon";
    expect(() => selectedProvider()).toThrow(/carrier-pigeon/);
  });

  it("throws from a selected provider that has no transport yet", async () => {
    process.env.ENQUIRY_PROVIDER = "smtp";
    await expect(deliverEnquiry(ENQUIRY)).rejects.toThrow(/no transport is configured/);
  });
});
