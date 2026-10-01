import { z } from "zod";
import { MAX_CART_QUANTITY } from "@/lib/cart/model";

/**
 * What an order request is, and what the server will accept.
 *
 * Orders are REQUESTS PAID BY INVOICE: the buyer sends the cart with billing and delivery
 * details, Hugo Tron confirms availability and delivery, then invoices. Nothing is charged here,
 * so there is no payment step and no card data anywhere in the site.
 *
 * The schema is the contract for whatever processes orders next (mailer, ERP, admin view);
 * import it rather than restating it. Lines carry only IDs and quantities; prices are always
 * resolved on the server (see pricing.ts).
 */
const orderLineSchema = z.object({
  productId: z.string().max(80),
  quantity: z.number().int().min(1).max(MAX_CART_QUANTITY),
});

export const orderSchema = z.object({
  lines: z.array(orderLineSchema).min(1).max(50),
  name: z.string().min(1).max(160),
  company: z.string().max(160),
  email: z.email().max(320),
  phone: z.string().max(80),
  /** EU VAT ID, for reverse-charge invoicing of trade buyers. */
  vatId: z.string().max(40),
  street: z.string().min(1).max(200),
  postcode: z.string().min(1).max(20),
  city: z.string().min(1).max(120),
  country: z.string().min(1).max(80),
  notes: z.string().max(2000),
  /** Which locale the buyer was reading: confirm and invoice in it. */
  locale: z.string().max(12),
});

export type OrderInput = z.infer<typeof orderSchema>;

/** Trim, and treat a missing field as an empty string. */
function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** The cart travels as JSON in one hidden field; anything unreadable becomes no lines. */
function readLines(formData: FormData): unknown {
  try {
    return JSON.parse(readField(formData, "lines") || "[]");
  } catch {
    return [];
  }
}

/** Every key the schema expects, read out of a submitted form. */
export function readOrder(formData: FormData): Record<string, unknown> {
  return {
    lines: readLines(formData),
    name: readField(formData, "name"),
    company: readField(formData, "company"),
    email: readField(formData, "email"),
    phone: readField(formData, "phone"),
    vatId: readField(formData, "vatId"),
    street: readField(formData, "street"),
    postcode: readField(formData, "postcode"),
    city: readField(formData, "city"),
    country: readField(formData, "country"),
    notes: readField(formData, "notes"),
    locale: readField(formData, "locale"),
  };
}
