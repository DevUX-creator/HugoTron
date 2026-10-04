/** Contains a signed, expiring capability from guestAccess.ts, never a plain reference. */
export const LAST_ORDER_COOKIE = "ht_last_order";

/** Human-readable reference; the backend must also enforce a unique database constraint. */
export function orderReference(now = new Date()): string {
  const date = now.toISOString().slice(2, 10).replaceAll("-", "");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const random = crypto.getRandomValues(new Uint8Array(10));
  const suffix = Array.from(random, (byte) => alphabet[byte % alphabet.length]).join("");
  return `HT-${date}-${suffix}`;
}
