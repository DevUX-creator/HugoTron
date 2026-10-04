/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Current backend boundary. Required extensions and acceptance criteria: docs/handoff.
 *
 * Pages, forms and server actions call only these functions (through `backend()` in
 * ./index.ts). Nothing in the UI knows whether orders live in Shopify, Shopware, a custom
 * API or a database, or which payment provider charges the card.
 *
 * Start from ./mock.ts: a complete, in-memory implementation that the whole site runs on
 * today. A real adapter also needs catalogue, quote, stock and payment UI integration;
 * implementing this interface alone is NOT a launch sign-off.
 *
 * Rules for every implementation:
 *  - Throw on infrastructure failure (network, 5xx). The server action turns that into a
 *    generic error for the buyer; never pretend something succeeded.
 *  - Return `null` / `false` for expected "no" answers (unknown voucher, wrong password).
 *  - Prices are always computed on the server (../checkout/pricing.ts); treat amounts that
 *    arrive with an order as already validated, and re-check them in your own system.
 *  - Card data never reaches this code: the payment provider's hosted fields or redirect
 *    collect it (PCI DSS SAQ A).
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type {
  Address,
  Customer,
  Order,
  PaymentStart,
  SocialProviderId,
  Voucher,
  WithdrawalDeclaration,
  WithdrawalReceipt,
} from "../types";

/** Accounts and sessions. Sessions are opaque tokens kept in an httpOnly cookie (../session.ts). */
export interface AuthBackend {
  /** Email and password. Returns a session token, or null when they do not match. */
  signIn(email: string, password: string): Promise<string | null>;
  /** Creates the customer and signs them in. Returns null when the email is already taken. */
  register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<string | null>;
  /**
   * Social sign-in. Return the provider's authorisation URL to redirect to; its callback
   * (app/api/commerce/auth/[provider]/callback) then calls `completeSocial`.
   */
  /** Pass the opaque state through unchanged. Never reinterpret it as a URL. */
  startSocial(provider: SocialProviderId, state: string): Promise<string>;
  /** Exchanges the provider's callback parameters for a session token (null if refused). */
  completeSocial(provider: SocialProviderId, params: URLSearchParams): Promise<string | null>;
  /** Sends a reset link if the email exists. Always resolves, so emails cannot be probed. */
  requestPasswordReset(email: string, locale: string): Promise<void>;
  /** The customer behind a session token, or null when it has expired or never existed. */
  customer(token: string): Promise<Customer | null>;
  signOut(token: string): Promise<void>;
}

/** What a signed-in customer may change themselves. Kept deliberately small. */
export interface CustomerBackend {
  updateAddress(customerId: string, address: Address): Promise<Customer>;
}

export interface OrderBackend {
  /**
   * Atomically create or return the SAME order for a checkout key. Store the fingerprint;
   * reject reuse with different input. Enforce unique reference/key constraints in the DB.
   * The mock demonstrates this only within one process, not across servers or restarts.
   */
  create(order: Order, attempt: { key: string; fingerprint: string }): Promise<Order>;
  /** One order, for its confirmation page or the account. */
  get(reference: string): Promise<Order | null>;
  /** A customer's orders, newest first. */
  listForCustomer(customerId: string): Promise<Order[]>;
  /** Called by the payment webhook (and the mock) when payment state changes. */
  setStatus(reference: string, status: Order["status"]): Promise<void>;
}

export interface PaymentBackend {
  /**
   * Starts payment for a stored order with its chosen method. `returnUrl` is where a redirect
   * flow must send the buyer back (the confirmation page, which then reads the order status).
   * Repeated calls for the same order MUST reuse its payment intent/session. Never charge
   * again on retry. Signature verification, event deduplication, amount/currency checks and
   * valid status transitions belong in the real adapter (see docs/handoff/INTEGRATION.md).
   */
  start(order: Order, returnUrl: string): Promise<PaymentStart>;
  /**
   * The provider's webhook (app/api/commerce/payments/webhook). Verify the signature, then
   * move the order on with `orders.setStatus`. Return false to answer 400.
   */
  handleWebhook(request: Request): Promise<boolean>;
}

export interface VoucherBackend {
  /** A voucher's value on this subtotal (cents), or null when unknown, expired or not met. */
  lookup(code: string, subtotal: number): Promise<Voucher | null>;
}

/** The legally required online withdrawal function (§ 356a BGB). */
export interface WithdrawalBackend {
  /**
   * Records a withdrawal and IMMEDIATELY emails the consumer an acknowledgement of receipt with
   * its content and the date and time received (§ 356a Abs. 4 BGB). Throw if either fails.
   */
  submit(declaration: WithdrawalDeclaration): Promise<WithdrawalReceipt>;
}

export interface CommerceBackend {
  auth: AuthBackend;
  customers: CustomerBackend;
  orders: OrderBackend;
  payments: PaymentBackend;
  vouchers: VoucherBackend;
  withdrawals: WithdrawalBackend;
}
