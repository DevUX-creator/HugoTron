"use server";

import { deliverEnquiry } from "@/lib/enquiry/provider";
import { typedValues } from "@/lib/formValues";
import { withinRateLimit } from "@/lib/rateLimit";
import { enquirySchema, readEnquiry, readField, type EnquiryInput } from "@/lib/enquiry/schema";
import type { EnquiryState } from "@/lib/enquiry/state";

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
    await deliverEnquiry({ ...forTopic(parsed.data), receivedAt: new Date().toISOString() });
  } catch (cause) {
    /* The buyer is told to email instead, so the failure has to be visible on
       our side too — this is the line that turns a dropped enquiry into
       something somebody can notice. */
    console.error("[enquiry] delivery failed", cause);
    return { ok: false, error: "errorGeneric", values };
  }

  return { ok: true };
}

/**
 * Only what belongs to the chosen topic reaches the provider. The contact page hides other
 * topics' fields, but a visitor may have filled them before switching topic, and hidden fields
 * still post.
 */
function forTopic(input: EnquiryInput): EnquiryInput {
  const enquiry = input.topic === "enquiry";
  return {
    ...input,
    purpose: enquiry ? input.purpose : "other",
    product: enquiry ? input.product : "",
    quantity: enquiry ? input.quantity : "",
    packSize: enquiry ? input.packSize : "",
    postcode: enquiry ? input.postcode : "",
    date: enquiry ? input.date : "",
    orderReference: input.topic === "order" ? input.orderReference : "",
  };
}
