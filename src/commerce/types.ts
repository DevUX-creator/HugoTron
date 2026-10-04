/**
 * The commerce domain, in one place. Every screen, server action and backend adapter speaks in
 * these types; a backend maps its own records to them (see backend/contracts.ts).
 *
 * Money is always integer EUR cents, gross (VAT included), as German consumer prices are shown.
 */
import type { ProductSlug, UnitKey } from "./catalogue";
import type { CountryCode, PaymentMethodId, ShippingMethodId, SocialProviderId } from "./config";

export type { PaymentMethodId, ShippingMethodId, SocialProviderId };

export type Address = {
  firstName: string;
  lastName: string;
  company: string;
  street: string;
  /** Second address line: floor, building, c/o. */
  addition: string;
  postcode: string;
  city: string;
  /** ISO 3166-1 alpha-2, one of COMMERCE.checkout.countries. */
  country: CountryCode;
  phone: string;
};

export type Customer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  /** The saved delivery address, offered at checkout and editable in the account. */
  address: Address | null;
  createdAt: string;
};

/** A signed-in visitor, as the pages see them. */
export type Session = { customer: Customer };

/**
 * An order's life. `pending_payment` waits for the payment provider (redirect, wallet, 3-D
 * Secure); `awaiting_transfer` waits for a bank transfer (Vorkasse). The backend moves an order
 * on from `paid`; the account shows anything before `delivered` as a current order.
 */
export type OrderStatus =
  | "pending_payment"
  | "awaiting_transfer"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export const OPEN_ORDER_STATUSES: readonly OrderStatus[] = [
  "pending_payment",
  "awaiting_transfer",
  "paid",
  "processing",
  "shipped",
];

export type OrderLine = {
  productId: ProductSlug;
  quantity: number;
  unit: UnitKey;
  /** Gross cents per unit, fixed when the order was placed. */
  unitPrice: number;
  lineTotal: number;
};

export type OrderTotals = {
  subtotal: number;
  /** Null when shipping depends on destination and service; `total` then excludes it. */
  shipping: number | null;
  /** A positive number of cents taken off; 0 without a voucher. */
  discount: number;
  total: number;
  /** The VAT contained in `total`, for the invoice and the summary line. */
  vatIncluded: number;
};

export type Order = {
  reference: string;
  status: OrderStatus;
  /** ISO 8601. */
  placedAt: string;
  locale: string;
  customerId: string | null;
  email: string;
  lines: OrderLine[];
  totals: OrderTotals;
  voucher: string | null;
  note: string;
  shippingMethod: ShippingMethodId;
  paymentMethod: PaymentMethodId;
  shippingAddress: Address;
  billingAddress: Address;
  /** Parcel tracking, once shipped. */
  tracking: { carrier: string; number: string; url: string } | null;
};

/** A voucher the backend accepted, with what it is worth on this subtotal. */
export type Voucher = { code: string; discount: number; label: string };

/**
 * What starting a payment returns. Real providers usually `redirect` (PayPal, Klarna, card 3-D
 * Secure, hosted checkout); bank transfer returns `instructions`; a provider that confirms
 * synchronously returns `paid`. `failed` keeps the order open so the buyer can try again.
 */
export type PaymentStart =
  | { kind: "redirect"; url: string }
  | {
      kind: "instructions";
      reference: string;
      /** Null while the account is not published; the details then follow by email. */
      bank: { holder: string; iban: string; bic: string; bank: string } | null;
    }
  | { kind: "paid" }
  | { kind: "failed"; reason: "declined" | "cancelled" | "unavailable" };

/** The result every commerce server action returns to its form. Keys are message ids. */
export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; fields?: Record<string, string> };

/**
 * A withdrawal from a contract sent through the site's "Vertrag widerrufen" function
 * (§ 356a BGB). The backend must send an acknowledgement of receipt on a durable medium (email)
 * at once, containing this content and the date and time it was received.
 */
export type WithdrawalDeclaration = {
  name: string;
  email: string;
  orderReference: string;
  /** Empty for the whole order; otherwise which goods are withdrawn. */
  items: string;
  locale: string;
};
export type WithdrawalReceipt = WithdrawalDeclaration & { receivedAt: string };
