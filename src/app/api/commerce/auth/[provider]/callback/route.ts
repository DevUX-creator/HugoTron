import { NextResponse, type NextRequest } from "next/server";
import { backend, commerceAvailable } from "@/commerce/backend";
import { consumeSocialAttempt } from "@/commerce/account/oauthState";
import { COMMERCE, type SocialProviderId } from "@/commerce/config";
import { startSession } from "@/commerce/session";

/**
 * Where a social sign-in provider sends the visitor back (register this URL with Google and
 * Apple). State is a browser-bound nonce; the backend also verifies the provider/code/PKCE.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!COMMERCE.social.includes(provider as SocialProviderId)) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (!commerceAvailable()) return new Response(null, { status: 503 });
  const target = await consumeSocialAttempt(provider, request.nextUrl.searchParams.get("state"));
  if (!target) return NextResponse.redirect(new URL("/de/konto?authError=1", request.url));
  try {
    const token = await backend().auth.completeSocial(
      provider as SocialProviderId,
      request.nextUrl.searchParams,
    );
    if (token) await startSession(token);
    else return NextResponse.redirect(new URL("/de/konto?authError=1", request.url));
  } catch {
    console.error("[commerce] social callback failed");
    return NextResponse.redirect(new URL("/de/konto?authError=1", request.url));
  }
  return NextResponse.redirect(new URL(target, request.url));
}
