"use server";

// Plain redirect on purpose: it follows an already-localised return path or a provider's
// external sign-in URL. Locale-aware redirects use `redirect` from @/i18n/navigation below.
// eslint-disable-next-line no-restricted-imports
import { redirect as redirectTo } from "next/navigation";
import { z } from "zod";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { withinRateLimit } from "@/lib/rateLimit";
import { backend, commerceAvailable } from "../backend";
import { safeReturn } from "./returnPath";
import { startSocialAttempt } from "./oauthState";
import { addressSchema } from "../checkout/schema";
import { COMMERCE, type SocialProviderId } from "../config";
import { endSession, getSession, startSession } from "../session";

/**
 * The account's server actions, used with React's useActionState. Each returns a message id
 * under `commerce.errors` / `commerce.notices`, or redirects on success.
 */
export type FormState = {
  status: "idle" | "ok" | "error";
  message?: string;
  /** What the visitor typed, returned with an error so the form does not empty. */
  values?: Record<string, string>;
};

const read = (data: FormData, key: string) => {
  const value = data.get(key);
  return typeof value === "string" ? value.trim() : "";
};

/** After signing in: back to where the visitor came from (a localised path), or the account. */
async function finish(returnTo: string): Promise<never> {
  const target = safeReturn(returnTo);
  if (target) redirectTo(target);
  return redirect({ href: "/account", locale: (await getLocale()) as Locale });
}

export async function signIn(_state: FormState, data: FormData): Promise<FormState> {
  if (!commerceAvailable()) return { status: "error", message: "unavailable" };
  const email = read(data, "email");
  if (!(await withinRateLimit("account")))
    return { status: "error", message: "rateLimited", values: { email } };
  const password = data.get("password");
  if (
    !z.email().max(320).safeParse(email).success ||
    typeof password !== "string" ||
    !password ||
    password.length > 200
  )
    return { status: "error", message: "signInFailed", values: { email } };
  try {
    const token = await backend().auth.signIn(email, password);
    if (!token) return { status: "error", message: "signInFailed", values: { email } };
    await startSession(token);
  } catch {
    console.error("[commerce] sign-in service failed");
    return { status: "error", message: "generic", values: { email } };
  }
  return finish(read(data, "returnTo"));
}

const registration = z.object({
  email: z.email().max(320),
  password: z.string().min(8).max(200),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
});

export async function register(_state: FormState, data: FormData): Promise<FormState> {
  if (!commerceAvailable()) return { status: "error", message: "unavailable" };
  const values = {
    email: read(data, "email"),
    firstName: read(data, "firstName"),
    lastName: read(data, "lastName"),
  };
  if (!(await withinRateLimit("account")))
    return { status: "error", message: "rateLimited", values };
  const parsed = registration.safeParse({
    ...values,
    password: String(data.get("password") ?? ""),
  });
  if (!parsed.success) {
    const password = parsed.error.issues.some((issue) => issue.path[0] === "password");
    return { status: "error", message: password ? "passwordShort" : "invalid", values };
  }
  try {
    const token = await backend().auth.register(parsed.data);
    if (!token) return { status: "error", message: "emailTaken", values };
    await startSession(token);
  } catch {
    console.error("[commerce] registration service failed");
    return { status: "error", message: "generic", values };
  }
  return finish(read(data, "returnTo"));
}

export async function socialSignIn(provider: SocialProviderId, returnTo: string) {
  let target: string | null = null;
  try {
    if (
      commerceAvailable() &&
      COMMERCE.social.includes(provider) &&
      (await withinRateLimit("account"))
    )
      target = await backend().auth.startSocial(
        provider,
        await startSocialAttempt(provider, returnTo),
      );
  } catch {
    console.error("[commerce] social sign-in service failed");
  }
  if (target) redirectTo(target);
  redirect({
    href: { pathname: "/account", query: { authError: "1" } },
    locale: (await getLocale()) as Locale,
  });
}

export async function requestPasswordReset(_state: FormState, data: FormData): Promise<FormState> {
  if (!commerceAvailable()) return { status: "error", message: "unavailable" };
  if (!(await withinRateLimit("account"))) return { status: "error", message: "rateLimited" };
  const email = read(data, "email");
  if (!z.email().safeParse(email).success)
    return { status: "error", message: "invalid", values: { email } };
  try {
    await backend().auth.requestPasswordReset(email, await getLocale());
  } catch {
    console.error("[commerce] password reset service failed");
    return { status: "error", message: "generic" };
  }
  // Same answer whether or not the address has an account.
  return { status: "ok", message: "resetSent" };
}

export async function signOut() {
  try {
    await endSession();
  } catch {
    console.error("[commerce] session revocation failed");
  }
  redirect({ href: "/account", locale: (await getLocale()) as Locale });
}

export async function updateAddress(_state: FormState, data: FormData): Promise<FormState> {
  if (!commerceAvailable()) return { status: "error", message: "unavailable" };
  if (!(await withinRateLimit("account"))) return { status: "error", message: "rateLimited" };
  const fields = Object.keys(addressSchema.shape);
  const values = Object.fromEntries(fields.map((key) => [key, read(data, key)]));
  const parsed = addressSchema.safeParse(values);
  if (!parsed.success) return { status: "error", message: "invalid", values };
  try {
    const session = await getSession();
    if (!session) return { status: "error", message: "signInRequired" };
    await backend().customers.updateAddress(session.customer.id, parsed.data);
  } catch (cause) {
    console.error("[commerce] updateAddress failed", cause);
    return { status: "error", message: "generic", values };
  }
  return { status: "ok", message: "addressSaved" };
}
