/* Server only: reads the session cookie for pages and server actions. */
import { cookies } from "next/headers";
import { backend, commerceAvailable } from "./backend";
import type { Session } from "./types";

/** The opaque session token from the backend, in an httpOnly cookie. */
export const SESSION_COOKIE = "ht_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

/** The signed-in customer, or null for a guest. Safe to call from any server component. */
export async function getSession(): Promise<Session | null> {
  if (!commerceAvailable()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const customer = await backend().auth.customer(token);
  return customer ? { customer } : null;
}

/** Starts a session after sign-in, registration or social sign-in. Server actions only. */
export async function startSession(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  try {
    if (token && commerceAvailable()) await backend().auth.signOut(token);
  } finally {
    jar.delete(SESSION_COOKIE);
  }
}
