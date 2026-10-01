import type { Enquiry } from "./schema";

/**
 * Where an accepted enquiry goes.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * THIS IS THE SEAM FOR THE BACKEND TEAM, and it is the only one. Nothing above
 * this file knows how an enquiry is delivered; nothing below it knows anything
 * about forms, locales or React. To wire the real thing, add a provider here
 * and select it with `ENQUIRY_PROVIDER` — no component, action or test needs
 * to change.
 *
 * `console` is the default so the form works on a fresh clone with no
 * credentials, exactly as docs/CONTRIBUTING.md promises. It is NOT a
 * production provider: it says so on every line it writes.
 * ────────────────────────────────────────────────────────────────────────────
 */
export type EnquiryProvider = (enquiry: Enquiry) => Promise<void>;

/**
 * A PROVIDER MUST THROW WHEN IT FAILS. The action reports a delivery failure
 * to the buyer and tells them to email instead, which is only honest if a
 * failure is actually visible here. A provider that swallows its errors turns
 * this form into something worse than no form at all: the buyer believes they
 * have been in touch, and the seller never learns they existed.
 */
const providers: Record<string, EnquiryProvider> = {
  async console(enquiry) {
    console.info("[enquiry] NOT DELIVERED — console provider. See lib/enquiry/provider.ts", {
      ...enquiry,
      /* The message can be four thousand characters; the log line should not
         be. The full text is in whatever this is eventually wired to. */
      message: enquiry.message.slice(0, 200),
    });
  },

  async smtp() {
    /* TODO(backend): send to CONTACT.email from src/content/site.ts. Reject
       rather than resolve on a non-2xx, a timeout or a rejected recipient. */
    throw new Error("ENQUIRY_PROVIDER=smtp is selected but no transport is configured");
  },
};

/**
 * Resolved per call rather than at module load, so a test or a deploy can
 * change the variable without the value being baked in at import time.
 */
export function selectedProvider(): EnquiryProvider {
  const name = process.env.ENQUIRY_PROVIDER ?? "console";
  const provider = providers[name];
  if (!provider) {
    throw new Error(
      `Unknown ENQUIRY_PROVIDER "${name}". Known: ${Object.keys(providers).join(", ")}`,
    );
  }
  return provider;
}

/** Hand a validated enquiry to whichever provider is configured. */
export async function deliverEnquiry(enquiry: Enquiry): Promise<void> {
  await selectedProvider()(enquiry);
}
