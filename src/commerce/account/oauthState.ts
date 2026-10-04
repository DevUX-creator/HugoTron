import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { z } from "zod";
import { safeReturn } from "./returnPath";
import { COMMERCE, type SocialProviderId } from "../config";

const COOKIE = "ht_oauth_attempt";
const LIFETIME = 600;
const schema = z.object({
  state: z.string().length(43),
  provider: z.enum(COMMERCE.social),
  returnTo: z.string().max(2048),
  expires: z.number().int(),
});

/** Bind the OAuth return to the initiating browser; state is never a redirect URL. */
export async function startSocialAttempt(provider: SocialProviderId, returnTo: string) {
  const state = randomBytes(32).toString("base64url");
  (await cookies()).set(
    COOKIE,
    JSON.stringify({
      state,
      provider,
      returnTo: safeReturn(returnTo) ?? "/",
      expires: Date.now() + LIFETIME * 1000,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/commerce/auth",
      maxAge: LIFETIME,
    },
  );
  return state;
}

/** Consumed even on failure. Backend still owns PKCE, code exchange and provider verification. */
export async function consumeSocialAttempt(provider: string, state: string | null) {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  jar.set(COOKIE, "", {
    path: "/api/commerce/auth",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  if (!raw || raw.length > 4096 || !state || state.length !== 43) return null;
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const attempt = parsed.data;
    if (
      attempt.provider !== provider ||
      attempt.expires <= Date.now() ||
      attempt.expires > Date.now() + LIFETIME * 1000 ||
      !timingSafeEqual(Buffer.from(attempt.state), Buffer.from(state))
    )
      return null;
    return safeReturn(attempt.returnTo);
  } catch {
    return null;
  }
}
