import { z } from "zod";

/**
 * What an enquiry is, and what the server will accept.
 *
 * THE SCHEMA IS THE CONTRACT. It lives here rather than inside the action so
 * that whatever handles these next — a mailer, a CRM sync, an admin view — can
 * import the same shape instead of restating it and drifting from it. The
 * inferred type is the only definition of `Enquiry` in the codebase.
 *
 * ONLY THE EMAIL IS REQUIRED, and that is a deliberate conversion decision
 * rather than laxness: this form stands between a buyer and a supplier they
 * have not chosen yet, and every required field is another reason to close the
 * tab. The FAQ already tells them which details earn a faster answer; the form
 * insists on the one thing without which no answer is possible at all.
 *
 * The caps are not really validation — they bound what a stranger can post.
 * A Server Action is reachable by direct POST, not only through our own UI.
 */
/**
 * The contact page's topics. `enquiry` (prices, samples, private label) is the main one and
 * the default; `order` is help with an existing order; `general` is everything else. The
 * provider receives the topic, so each can be routed to the right inbox.
 */
export const CONTACT_TOPICS = ["enquiry", "order", "general"] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const enquirySchema = z.object({
  topic: z.enum(CONTACT_TOPICS).catch("enquiry"),
  purpose: z.enum(["quote", "sample", "label", "other"]).catch("other"),
  /** For the `order` topic: the reference from the confirmation (HT-…). */
  orderReference: z.string().max(40),
  product: z.string().max(200),
  quantity: z.string().max(200),
  packSize: z.string().max(200),
  postcode: z.string().max(120),
  date: z.string().max(60),
  message: z.string().max(4000),
  name: z.string().max(160),
  company: z.string().max(160),
  email: z.email().max(320),
  phone: z.string().max(80),
  /** Which locale the buyer was reading — answer them in it. */
  locale: z.string().max(12),
});

/** Exactly what the form submits, once parsed. */
export type EnquiryInput = z.infer<typeof enquirySchema>;

/** An accepted enquiry, as a provider receives it. */
export type Enquiry = EnquiryInput & {
  /** ISO 8601, set by the server — never by the client. */
  receivedAt: string;
};

/** Trim, and treat a missing field as an empty string rather than undefined. */
export function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Every key the schema expects, read out of a submitted form. */
export function readEnquiry(formData: FormData): Record<string, unknown> {
  return {
    topic: formData.get("topic") ?? "enquiry",
    purpose: formData.get("purpose") ?? "other",
    orderReference: readField(formData, "orderReference"),
    product: readField(formData, "product"),
    quantity: readField(formData, "quantity"),
    packSize: readField(formData, "packSize"),
    postcode: readField(formData, "postcode"),
    date: readField(formData, "date"),
    message: readField(formData, "message"),
    name: readField(formData, "name"),
    company: readField(formData, "company"),
    email: readField(formData, "email"),
    phone: readField(formData, "phone"),
    locale: readField(formData, "locale"),
  };
}
