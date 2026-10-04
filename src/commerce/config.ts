/**
 * COMMERCE SETTINGS. Business decisions live here, not in components: which payment and
 * delivery methods are offered, at what price, whether guests may check out, which social
 * sign-ins appear. Values marked PLACEHOLDER must be confirmed by Hugo Tron before launch.
 *
 * Secrets (API keys, webhook secrets) never go here; they are environment variables read by
 * the backend adapter (see docs/handoff/INTEGRATION.md).
 */

export type ShippingOption = {
  id: string;
  /** Cents, or null when it depends on destination and service and is confirmed per order. */
  price: number | null;
  /** Free above this subtotal (cents); null for never. */
  freeFrom: number | null;
  carrier?: string;
  /** Working days, from and to. */
  days?: readonly [number, number];
};

export type BankDetails = { holder: string; iban: string; bic: string; bank: string };

export const COMMERCE = {
  currency: "EUR",

  checkout: {
    /**
     * Guest checkout: buyers may order without an account (recommended; most shops lose fewer
     * buyers this way). Set to false to require sign-in or registration before checkout.
     * In development the dev switcher can override this per browser (see dev.ts).
     */
    allowGuest: true,
    /** Countries delivered to (ISO 3166-1 alpha-2), first is the default. PLACEHOLDER. */
    countries: ["DE", "AT", "NL", "BE", "LU", "FR", "DK", "PL", "CZ"] as const,
    /** Maximum length of the buyer's note to the order. */
    noteMaxLength: 1000,
  },

  /**
   * Offered in this order. Hugo Tron has not published shipping prices: the live delivery terms
   * say delivery is generally free and longer distances may cost extra, agreed beforehand. So
   * `price` is null and the buyer is told it depends on destination and service. Once prices
   * are set, give `price` (cents) and optionally `freeFrom`, `carrier` and `days`.
   */
  shipping: [
    { id: "standard", price: null, freeFrom: null },
  ] as const satisfies readonly ShippingOption[],

  /**
   * Offered in this order. `card` collects card details only in the payment provider's hosted
   * fields (never on our server). `applePay` is shown only where the browser supports it.
   */
  payments: ["card", "paypal", "applePay", "klarna", "prepayment"] as const,

  /**
   * Shown for prepayment (Vorkasse) with the order reference. Not published yet: while null, the
   * buyer is told the bank details follow by email with the order confirmation.
   */
  bankTransfer: null as BankDetails | null,

  /** Social sign-in buttons on the sign-in and register forms. */
  social: ["google", "apple"] as const,

  /**
   * VAT contained in product prices. Basic foods are 7 % in Germany; the backend's invoice is
   * authoritative, this only produces the "incl. VAT" line in the summary. PLACEHOLDER.
   */
  vatRate: 0.07,
} as const;

export type ShippingMethod = ShippingOption;
export type ShippingMethodId = (typeof COMMERCE.shipping)[number]["id"];
export type PaymentMethodId = (typeof COMMERCE.payments)[number];
export type SocialProviderId = (typeof COMMERCE.social)[number];
export type CountryCode = (typeof COMMERCE.checkout.countries)[number];

/** The delivery methods, widened so optional fields (carrier, days) can be read. */
export const SHIPPING_METHODS: readonly ShippingMethod[] = COMMERCE.shipping;

export function shippingMethod(id: string): ShippingMethod | undefined {
  return SHIPPING_METHODS.find((method) => method.id === id);
}

/** Shipping cost in cents for a method and a subtotal; null when it is confirmed per order. */
export function shippingCost(method: ShippingMethod, subtotal: number): number | null {
  if (method.price === null) return null;
  return method.freeFrom !== null && subtotal >= method.freeFrom ? 0 : method.price;
}

/**
 * Developer tools: the floating switcher (guest / signed in, guest checkout on or off, payment
 * outcome). On in development; enable on a staging deployment with
 * NEXT_PUBLIC_COMMERCE_DEV_TOOLS=true. Never enable in production.
 */
export const DEV_TOOLS =
  process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_COMMERCE_DEV_TOOLS === "true";
