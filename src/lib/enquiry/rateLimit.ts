/**
 * A cap on how often one sender can submit the enquiry form.
 *
 * A Server Action is a public POST endpoint — reachable directly, not only
 * through our own page — so without this the form is an open relay into
 * whatever inbox the provider points at.
 *
 * IN-MEMORY, AND THEREFORE PER-INSTANCE. That is honest for this traffic
 * profile and this deployment: a wholesaler's enquiry form, on one or two
 * instances. It resets on deploy and does not coordinate between instances, so
 * swap the map for a shared store (Redis, Upstash, a table) the day this runs
 * anywhere with real horizontal scale.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

const hits = new Map<string, number[]>();

/**
 * The sender's address, as the proxy in front of us reports it.
 *
 * `next/headers` is imported lazily and guarded: it throws outside a request
 * context, which is exactly where the unit tests call this from, and a rate
 * limiter that cannot read a header should degrade to one shared bucket rather
 * than take the whole submission down with it.
 */
async function senderKey(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const list = await headers();
    const forwarded = list.get("x-forwarded-for");
    const first = forwarded?.split(",")[0]?.trim();
    return first || list.get("x-real-ip") || "unknown";
  } catch {
    return "unknown";
  }
}

/** True when this sender is still inside their allowance. */
export async function withinRateLimit(): Promise<boolean> {
  const key = await senderKey();
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((at) => now - at < WINDOW_MS);

  if (recent.length >= MAX_PER_WINDOW) {
    /* The rejected attempt is NOT recorded. Counting it would let a flood hold
       its own window open indefinitely. */
    hits.set(key, recent);
    return false;
  }

  recent.push(now);
  hits.set(key, recent);
  return true;
}

/** Test seam — the map is module state and would otherwise leak between cases. */
export function resetRateLimit(): void {
  hits.clear();
}
