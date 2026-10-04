# Backend integration

Read [OPEN-ITEMS.md](OPEN-ITEMS.md) first. **This is a frontend with mock services, not a
completed commerce system.** The interface is a starting boundary; catalogue/quote/stock,
provider UI, fulfilment and operational work remain. Do not copy mock security/storage into
production or assume that registering one adapter makes the shop ready.

## Code map

| Concern                      | Current location                                       | State                                                                             |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Service contract / selection | `src/commerce/backend/contracts.ts`, `index.ts`        | Only `mock` registered                                                            |
| Domain types                 | `src/commerce/types.ts`                                | Extend for stable external IDs, variants and order snapshots                      |
| Catalogue                    | `src/commerce/catalogue.ts`, `src/content/products.ts` | Local synchronous seed; no live inventory                                         |
| Cart                         | `src/commerce/cart/`, `components/commerce/cart/`      | Browser-local IDs, quantities, voucher and note; no backend/shared subdomain cart |
| Checkout validation/actions  | `src/commerce/checkout/`                               | Validates input; refuses unpriced delivery; prices from local seed                |
| Account actions/session      | `src/commerce/account/`, `session.ts`                  | Opaque backend session in an httpOnly cookie                                      |
| Enquiries                    | `src/lib/enquiry/provider.ts`                          | Console only; SMTP placeholder throws                                             |
| Withdrawal declarations      | `src/commerce/withdrawal/`                             | Mock receipt, no real delivery/processing                                         |
| UI                           | `src/components/commerce/`                             | Cards, cart, checkout, account, feedback and preview tools                        |
| Legal source                 | `src/lib/legal/source.ts`, `src/content/legal/`        | Local inherited copy, needs client/legal approval                                 |

All paths are from the repository root. Public DE/EN paths are mapped in
`src/i18n/routing.ts`; use its helpers rather than hard-coding English URLs.

## Checkout and retries

1. `CheckoutFlow` creates a random `checkoutId` for the current complete input. Unchanged
   retries in that mounted checkout reuse it. Editing input creates a new ID. Nothing stores
   payment or address data in browser storage. **Reload/cross-tab recovery is not implemented.**
2. `placeOrder` validates the schema, rate limit, session/guest setting, site origin and signed
   cookie configuration. Prices are recomputed from the catalogue; browser prices are ignored.
3. If shipping is `null`, it returns `shippingUnconfirmed` **before storing an order or starting
   payment**. The delivery step offers contact instead of proceeding. Supply a real quote
   before enabling paid checkout; do not turn unknown delivery into zero.
4. `orders.create(order, {key, fingerprint})` must atomically create-or-return the same order.
   The key is scoped to the authenticated customer (or guest) and checkout UUID. Persist both
   key and fingerprint with unique constraints; reject the same key with different input.
5. `payments.start(storedOrder, returnUrl)` must reuse that order's payment intent/session.
   The frontend key is not a replacement for PSP idempotency, database transactions or stock
   reservations. Timeouts can mean a payment succeeded: reconcile before charging again.
6. The confirmation page reads persisted payment state. Only authenticated ownership or a
   valid signed guest capability grants access. A redirect from the PSP never proves payment.
7. Webhooks are responsible for verified state changes and reliable fulfilment/email events.

The mock implements duplicate-key protection **only inside one process**; it loses data on
restart. It does not reserve stock or implement real refunds. Tests exercise concurrent
submissions/retries, but distributed correctness is the backend team's responsibility.

Order references now use `HT-YYMMDD-XXXXXXXXXX`; old references still display. References are
human-readable identifiers, **not secrets**. Enforce uniqueness and collision handling in the
real database. Prefer a separate immutable internal order ID.

## Payments

Raw card-number/CVC inputs have been removed. The current UI describes a **hosted redirect**
flow: select a payment method, review the order, then `payments.start` returns
`{kind: "redirect", url}` for the PSP. Register the exact return URL origin from
`NEXT_PUBLIC_SITE_URL`. Validate provider redirects against the chosen provider's origins.

If embedded hosted fields are preferred, frontend work is required: add the provider SDK,
server-created intent/client token, completion/error states, approved CSP/Permissions-Policy
origins and wallet-domain verification. Never recreate raw card fields in React.

Other results in `PaymentStart`: `paid` (only after verified payment), `instructions`
(prepayment with approved bank details and email), `failed` (decline/cancellation).
Offer only methods actually supported by the merchant account, country and browser.

Webhook: `POST /api/commerce/payments/webhook`. It returns 503 when commerce is disabled or
mock-backed. A real adapter must verify the raw body/signature/timestamp; deduplicate event IDs;
check merchant, amount and currency; enforce allowed transitions; process retries/out-of-order
notifications; queue follow-up jobs durably. Invalid events return 400, temporary failures 5xx.
Do not acknowledge a real event before durable receipt. See B04–B06 in OPEN-ITEMS.

## Authentication and guest access

- `ht_session`: backend opaque token, httpOnly, SameSite=Lax, Secure in production, browser
  lifetime 30 days. Backend controls actual expiry/revocation. Never copy mock plaintext passwords.
- Account actions keep provider failures in the form and preserve password whitespace.
  Password reset completion and email verification still need the real provider/flow.
- `auth.startSocial(provider, state)` receives an opaque, random nonce. Pass it to the provider
  unchanged. It is **not a return URL**. The httpOnly ten-minute `ht_oauth_attempt` cookie binds
  state/provider/return path to the browser; the callback consumes it before exchanging the code.
- Backend `completeSocial` still owns provider code exchange, PKCE, issuer/audience/identity
  validation and replay protection. The current callback handles GET; if the selected provider
  uses `form_post`, implement and test that flow and its cookie/CSRF behavior explicitly.
- Only same-origin return paths are accepted. URLs containing backslashes, protocol-relative
  paths, controls or encoded path-separator bypasses are rejected.
- `ht_last_order`: HMAC-SHA256 capability scoped to one reference, expiring after 24 hours.
  Plain reference cookies are rejected; guests without access do not trigger an order lookup.
  `COMMERCE_COOKIE_SECRET` must be random, at least 32 bytes, identical across production
  instances and kept server-side. Rotation invalidates existing guest capabilities. There is
  no per-token revocation store; implement one or secure email recovery if required.
- Backend must enforce ownership on every data read/change. Never publish the server adapter
  methods as unauthenticated API endpoints. Add explicit principal-scoped data access when
  exposing a shared API for a separate shop.

## Catalogue, quotes and inventory — required extension

`catalogue.ts` centralizes reads, but its functions and many consumers are synchronous and
use local seed products. `ProductSlug` is a closed union; names are message keys. Replacing
function bodies with network calls is not enough.

Agree a stable SKU/variant model, translated product data, images, pack sizes, tax categories,
stock/availability and required food information. Fetch/cache on the server and pass a typed
catalogue snapshot into client components and the cart. Define cache invalidation, unavailable
product states, old-slug redirects and fallback behavior. Revalidate server-side at checkout.

Add a quote/checkout-intent service including customer/destination, shipping, tax, discounts,
stock reservations, expiry and an immutable amount/version. Store order-line names and all
financial details as snapshots, not a reference to today's translations. See B02/B03/B10.

## Enquiries, emails, legal source

Contact submits `topic` (enquiry/order/general), `purpose`, optional product/quantity/pack,
order reference and contact details. Register a real provider in `src/lib/enquiry/provider.ts`
and select `ENQUIRY_PROVIDER`; `smtp` is currently unimplemented. A failure must throw so the
visitor receives an honest failure with contact alternatives. Use durable delivery/CRM storage,
retry/outbox and deduplication. Never treat console output as delivered mail.

The backend also supplies confirmation, dispatch, reset, verification and withdrawal messages.
Test delivery to a real inbox and failures, not just HTTP success. Legal content can remain
approved local files or use a chosen legal-content provider via `legalDocument`; no provider
contract or entitlement is assumed. Client/legal approval is tracked in CLIENT-INPUT.

## Configuration

Copy `.env.example` for development. Never commit actual secrets.

| Variable                         | Use                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `COMMERCE_BACKEND`               | Registered adapter; only `mock` exists today                                                              |
| `COMMERCE_COOKIE_SECRET`         | Random server secret, at least 32 bytes; required for production guest capabilities                       |
| `NEXT_PUBLIC_SITE_URL`           | Absolute origin; HTTPS required for production payment returns; no path/query/credentials                 |
| `ENQUIRY_PROVIDER`               | Registered delivery provider; console logs only                                                           |
| `RATE_LIMIT_IP_HEADER`           | Optional `x-real-ip` or `x-forwarded-for`, only if ingress **overwrites** it with trusted client identity |
| `COMMERCE_ALLOW_MOCK`            | Production-build preview only; never enable for live commerce                                             |
| `ENQUIRY_ALLOW_CONSOLE`          | Production-build preview only; still sends no email                                                       |
| `NEXT_PUBLIC_COMMERCE_DEV_TOOLS` | Preview controls, never enable on a real store                                                            |
| Provider-specific secrets        | Define inside the real adapter; document names and rotation here without secret values                    |

No signing key is needed locally: development uses an ephemeral process key. A production
preview needs a real random signing secret too. The unconfigured production checkout/account
show contact guidance. Build-time/runtime availability is not a connectivity health check.

The request limiter now evicts expired entries and caps key storage, failing closed at capacity.
Without a trusted IP header, users share the `unknown` bucket. **This is not a scalable
production configuration.** Configure the ingress and use a shared limiter for multiple
instances; test spoofed headers and legitimate traffic. Voucher requests are validated and
limited before reaching the provider.

Run `pnpm check:launch` with production environment variables to catch obvious configuration
mistakes. It is intentionally unsuccessful on the default mock setup and cannot validate
provider registration, credentials, quote correctness, email delivery, legal approval or uptime.

## Local preview

`pnpm dev`: demo account `demo@hugo-tron.test` / `demo1234`; vouchers `WELCOME10` and `FREESHIP`.
DEV controls only affect the mock. Checkout stops at unknown shipping until an approved quote
is supplied. Unit tests supply a confirmed test shipping value to exercise success/retry paths;
they do not change the application's shipping facts. All mock data disappears on restart.
