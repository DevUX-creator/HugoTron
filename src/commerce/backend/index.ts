/* Server only: imported by server actions and route handlers, never by client components. */
import type { CommerceBackend } from "./contracts";
import { mockBackend } from "./mock";

/**
 * Which backend the site talks to, chosen by COMMERCE_BACKEND (default `mock`).
 * Register a real implementation here. Integration gaps: docs/handoff/INTEGRATION.md.
 */
const backends: Record<string, () => CommerceBackend> = {
  mock: () => {
    // The mock keeps orders in memory and accepts every payment. In production that would
    // confirm orders nobody receives, so it must be chosen deliberately (a staging site).
    if (process.env.NODE_ENV === "production" && process.env.COMMERCE_ALLOW_MOCK !== "true") {
      throw new Error(
        "The mock commerce backend is disabled in production. Set COMMERCE_BACKEND to a real " +
          "backend, or COMMERCE_ALLOW_MOCK=true on a staging deployment.",
      );
    }
    return mockBackend;
  },
  // api: () => apiBackend,   ← the backend team's implementation (see docs/handoff/INTEGRATION.md)
};

/** Avoid presenting an unavailable service on pages and public endpoints. */
export function commerceAvailable(): boolean {
  const name = process.env.COMMERCE_BACKEND ?? "mock";
  return (
    Boolean(backends[name]) &&
    (name !== "mock" ||
      process.env.NODE_ENV !== "production" ||
      process.env.COMMERCE_ALLOW_MOCK === "true")
  );
}

export function isMockCommerce(): boolean {
  return (process.env.COMMERCE_BACKEND ?? "mock") === "mock";
}

export function backend(): CommerceBackend {
  const name = process.env.COMMERCE_BACKEND ?? "mock";
  const create = backends[name];
  if (!create) {
    throw new Error(
      `Unknown COMMERCE_BACKEND "${name}". Known: ${Object.keys(backends).join(", ")}`,
    );
  }
  return create();
}
