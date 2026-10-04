import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const GUEST_ACCESS_SECONDS = 60 * 60 * 24;
const developmentSecret = randomBytes(32).toString("hex");

function secret(): string {
  const configured = process.env.COMMERCE_COOKIE_SECRET;
  if (configured && Buffer.byteLength(configured) >= 32) return configured;
  if (process.env.NODE_ENV !== "production") return developmentSecret;
  throw new Error("COMMERCE_COOKIE_SECRET must contain at least 32 bytes; see docs/handoff.");
}

const signature = (payload: string, key: string) =>
  createHmac("sha256", key).update(`hugo-guest-order:${payload}`).digest("base64url");

/** A scoped, expiring capability. The readable order reference alone grants no access. */
export function issueGuestAccess(reference: string, now = Date.now(), key = secret()): string {
  const payload = Buffer.from(
    JSON.stringify({ v: 1, ref: reference, exp: Math.floor(now / 1000) + GUEST_ACCESS_SECONDS }),
  ).toString("base64url");
  return `${payload}.${signature(payload, key)}`;
}

export function hasGuestAccess(
  token: string | undefined,
  reference: string,
  now = Date.now(),
  key?: string,
): boolean {
  if (!token || token.length > 1024 || !reference || reference.length > 100) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 2 || !parts.every((part) => /^[A-Za-z0-9_-]+$/.test(part))) return false;
    const [payload, mac] = parts as [string, string];
    const expected = Buffer.from(signature(payload, key ?? secret()));
    const supplied = Buffer.from(mac);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const seconds = Math.floor(now / 1000);
    return (
      data.v === 1 &&
      data.ref === reference &&
      Number.isSafeInteger(data.exp) &&
      data.exp > seconds &&
      data.exp <= seconds + GUEST_ACCESS_SECONDS
    );
  } catch {
    return false;
  }
}
