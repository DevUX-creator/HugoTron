import { z } from "zod";
import { MAX_CART_QUANTITY } from "../cart/model";
import { COMMERCE } from "../config";

/**
 * THE CHECKOUT CONTRACT: what the checkout sends and what the server accepts. The form,
 * `placeOrder` and any backend read this one schema; never restate it elsewhere.
 *
 * Lines carry only product IDs and quantities. Prices, shipping and discounts are always
 * resolved on the server (./pricing.ts). Card details are not part of it: the payment
 * provider collects them itself.
 */
const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => text(max).min(1);

export const addressSchema = z.object({
  firstName: required(80),
  lastName: required(80),
  company: text(160),
  street: required(200),
  addition: text(120),
  postcode: required(20),
  city: required(120),
  country: z.enum(COMMERCE.checkout.countries),
  phone: text(40),
});

export const cartLinesSchema = z
  .array(
    z.object({
      productId: z.string().min(1).max(80),
      quantity: z.number().int().min(1).max(MAX_CART_QUANTITY),
    }),
  )
  .min(1)
  .max(50);

export const voucherSchema = z.object({ code: required(40), lines: cartLinesSchema });

export const checkoutSchema = z
  .object({
    checkoutId: z.uuid(),
    lines: cartLinesSchema,
    email: z.email().max(320),
    shippingAddress: addressSchema,
    shippingMethod: z.enum(COMMERCE.shipping.map((method) => method.id) as [string, ...string[]]),
    paymentMethod: z.enum(COMMERCE.payments),
    billingSameAsShipping: z.boolean(),
    billingAddress: addressSchema.nullable(),
    voucher: text(40),
    note: text(COMMERCE.checkout.noteMaxLength),
    /** Terms and the cancellation policy read (§ 312j BGB: required before a paid order). */
    acceptTerms: z.literal(true),
    locale: z.enum(["de", "en"]),
  })
  .refine((input) => input.billingSameAsShipping || input.billingAddress !== null, {
    path: ["billingAddress"],
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
