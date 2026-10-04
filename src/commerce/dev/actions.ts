"use server";

import { cookies } from "next/headers";
import { backend, commerceAvailable, isMockCommerce } from "../backend";
import { DEV_TOOLS } from "../config";
import { endSession, startSession } from "../session";
import { DEV_COOKIES } from "./settings";

/** The developer switcher's actions. They do nothing unless DEV_TOOLS is on. */

export async function setGuestCheckout(allowed: boolean) {
  if (!DEV_TOOLS || !commerceAvailable() || !isMockCommerce()) return;
  (await cookies()).set(DEV_COOKIES.guest, allowed ? "on" : "off", { path: "/", sameSite: "lax" });
}

export async function setPaymentOutcome(outcome: "success" | "fail") {
  if (!DEV_TOOLS || !commerceAvailable() || !isMockCommerce()) return;
  (await cookies()).set(DEV_COOKIES.payment, outcome, { path: "/", sameSite: "lax" });
}

/** Signs in the demo customer of the mock backend only. */
export async function signInDemo() {
  if (!DEV_TOOLS || !commerceAvailable() || !isMockCommerce()) return;
  const token = await backend().auth.signIn("demo@hugo-tron.test", "demo1234");
  if (token) await startSession(token);
}

export async function signOutDemo() {
  if (!DEV_TOOLS || !commerceAvailable() || !isMockCommerce()) return;
  await endSession();
}
