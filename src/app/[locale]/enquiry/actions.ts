"use server";

import { deliverEnquiry } from "@/lib/enquiry/provider";
import { typedValues } from "@/lib/formValues";
import { withinRateLimit } from "@/lib/rateLimit";
import { enquirySchema, readEnquiry, readField } from "@/lib/enquiry/schema";

/**
 * What the form gets back. `error` is a MESSAGE KEY rather than a sentence,
 * because the action runs on the server and has no business deciding which
 * language the buyer reads — the client component owns that and looks the key
 * up in its own bundle.
 */
export type EnquiryState = {
  ok: boolean;
  error?: "errorEmail" | "errorLong" | "errorRate" | "errorGeneric";
  /** What the buyer typed, returned with an error: React resets the form after every action. */
  values?: Record<string, string>;
};

export const ENQUIRY_INITIAL_STATE: EnquiryState = { ok: false };

/**
 * The enquiry form's submit handler.
 *
 * It owns the ORDER of the checks and nothing else: the shape lives in
 * `lib/enquiry/schema`, the allowance in `lib/rateLimit`, and delivery
 * behind the provider seam in `lib/enquiry/provider`. That is what makes this
 * safe for the backend team to pick up — the thing they have to replace is one
 * function in one file, and this one does not change.
 */
export async function submitEnquiry(
  _previous: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  /* THE HONEYPOT GOES FIRST, before the rate limiter, so a flood of bot
     submissions never consumes the allowance of the human sharing their
     address behind a corporate NAT. A bot fills every field it can see,
     including the one CSS hides; a human never touches it. Dropped with a
     success response, because telling a bot why it failed only teaches it. */
  if (readField(formData, "company_website") !== "") return { ok: true };

  const values = typedValues(formData);
  const parsed = enquirySchema.safeParse(readEnquiry(formData));

  if (!parsed.success) {
    const onEmail = parsed.error.issues.some((issue) => issue.path[0] === "email");
    return { ok: false, error: onEmail ? "errorEmail" : "errorLong", values };
  }

  /* After validation, so a malformed submission cannot burn the allowance. */
  if (!(await withinRateLimit("enquiry"))) return { ok: false, error: "errorRate", values };

  try {
    await deliverEnquiry({ ...parsed.data, receivedAt: new Date().toISOString() });
  } catch (cause) {
    /* The buyer is told to email instead, so the failure has to be visible on
       our side too — this is the line that turns a dropped enquiry into
       something somebody can notice. */
    console.error("[enquiry] delivery failed", cause);
    return { ok: false, error: "errorGeneric", values };
  }

  return { ok: true };
}
