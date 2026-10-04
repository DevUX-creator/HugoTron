import { cookies } from "next/headers";
import { COMMERCE, DEV_TOOLS } from "../config";

/**
 * The developer switcher's choices, per browser, in cookies. They only take effect while
 * DEV_TOOLS is on (development, or a staging deployment with
 * NEXT_PUBLIC_COMMERCE_DEV_TOOLS=true); in production the configuration alone applies.
 */
export const DEV_COOKIES = {
  /** "on" or "off": overrides COMMERCE.checkout.allowGuest. */
  guest: "ht_dev_guest",
  /** "success" or "fail": how the mock payment provider answers. */
  payment: "ht_dev_payment",
} as const;

export type DevSettings = { allowGuest: boolean; payment: "success" | "fail" };

export async function readDevSettings(): Promise<DevSettings> {
  const defaults: DevSettings = { allowGuest: COMMERCE.checkout.allowGuest, payment: "success" };
  if (!DEV_TOOLS || (process.env.COMMERCE_BACKEND ?? "mock") !== "mock") return defaults;
  const jar = await cookies();
  const guest = jar.get(DEV_COOKIES.guest)?.value;
  return {
    allowGuest: guest ? guest === "on" : defaults.allowGuest,
    payment: jar.get(DEV_COOKIES.payment)?.value === "fail" ? "fail" : "success",
  };
}

/** Whether guests may check out, after any developer override. */
export async function guestCheckoutAllowed(): Promise<boolean> {
  return (await readDevSettings()).allowGuest;
}
