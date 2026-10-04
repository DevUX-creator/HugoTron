import { isIP } from "node:net";
import { createRateLimitStore } from "./rateLimitStore";

const hits = createRateLimitStore();
type RateLimitScope = "enquiry" | "order" | "account" | "withdrawal" | "voucher";

async function senderKey(): Promise<string> {
  // Opt in only to a header the trusted ingress OVERWRITES, never one it merely appends to.
  const trustedHeader = process.env.RATE_LIMIT_IP_HEADER;
  if (trustedHeader !== "x-forwarded-for" && trustedHeader !== "x-real-ip") return "unknown";
  try {
    const { headers } = await import("next/headers");
    const raw = (await headers()).get(trustedHeader);
    if (!raw || raw.length > 256) return "unknown";
    const ip = raw.split(",")[0]?.trim() ?? "";
    return isIP(ip) ? ip : "unknown";
  } catch {
    return "unknown";
  }
}

/** Bounded per-process limit. Use a shared store before scaling; see docs/handoff. */
export async function withinRateLimit(scope: RateLimitScope): Promise<boolean> {
  return hits.allow(`${scope}:${await senderKey()}`);
}

export function resetRateLimit(): void {
  hits.clear();
}
