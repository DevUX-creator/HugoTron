import { backend, commerceAvailable, isMockCommerce } from "@/commerce/backend";

/**
 * The payment provider's webhook (register this URL in its dashboard). The backend verifies
 * the signature and moves the order on; the buyer's confirmation page then shows the result.
 */
export async function POST(request: Request) {
  if (!commerceAvailable() || isMockCommerce()) return new Response(null, { status: 503 });
  try {
    const handled = await backend().payments.handleWebhook(request);
    return new Response(null, { status: handled ? 200 : 400 });
  } catch (cause) {
    console.error("[commerce] payment webhook failed", cause);
    // A 5xx asks the provider to retry later.
    return new Response(null, { status: 500 });
  }
}
