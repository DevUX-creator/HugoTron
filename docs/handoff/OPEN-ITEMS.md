# Open items and acceptance criteria

Updated 4 October 2026. This is the launch gap register. Unchecked items are **not done**.
Owners identify who must implement/approve them; frontend collaboration is expected where
UI/contracts change. See [RELEASE.md](RELEASE.md) for work already completed.

## Backend and commerce — block real orders

| ID  | Owner              | Open requirement                                                                          | Acceptance evidence                                                                                                                                                                                                         |
| --- | ------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B01 | Backend            | Real adapter and durable storage; mock is process memory, plain demo passwords, no emails | Restart/multi-instance tests preserve customers, sessions, orders and checkout keys; migrations, unique constraints, backups and restore tested                                                                             |
| B02 | Backend + frontend | Remote catalogue, stable SKU/variant IDs, product names, media and stock                  | New product/variant can be published without changing TypeScript unions/message keys; stale carts and removed/out-of-stock products handled                                                                                 |
| B03 | Backend + client   | Authoritative quote: destination, shipping, taxes, discounts and stock                    | Checkout presents the exact final amount; server rejects expired quotes; unknown shipping never reaches payment; cross-border and business cases approved                                                                   |
| B04 | Backend            | Atomic checkout retries and payment idempotency                                           | Same checkout key returns one order under concurrent requests and across instances; changed input rejected; repeated PSP calls reuse one intent; unknown payment outcomes reconciled, never blindly retried as a new charge |
| B05 | Backend + frontend | PSP integration and real supported payment methods                                        | Hosted redirect/fields tested with success, decline, cancellation, 3-D Secure, wallet availability and return flow; no raw card data handled by this app                                                                    |
| B06 | Backend            | Verified, durable payment webhooks and order state transitions                            | Verify raw-body signature, timestamp, merchant, order, amount and currency; replay/reordered event tests; retries safely deduplicated; failed work visible; refunds and partial refunds reconciled                          |
| B07 | Backend            | Auth, session expiry/revocation, email verification and reset completion                  | Ownership checks enforced server-side; another account cannot read/update data; reset token single-use/expiry/rate limit; provider errors recoverable                                                                       |
| B08 | Backend            | OAuth provider setup, code exchange, PKCE and identity validation                         | Browser-bound state already supplied by frontend; real provider issuer/audience/nonce/PKCE verified; replay and wrong-browser tests; choose supported GET/POST callback flow                                                |
| B09 | Backend            | Transactional messages and enquiries                                                      | Sales/support message, order confirmation, dispatch, reset and withdrawal acknowledgement reach real test inboxes; durable retry/outbox with deduplication and delivery monitoring                                          |
| B10 | Backend            | Voucher and inventory concurrency, order snapshots                                        | Usage limits/stock cannot be oversold or redeemed twice; product description, price, tax, address and consent versions stored as immutable order data                                                                       |
| B11 | Backend            | Guest order recovery beyond the latest-browser cookie                                     | Signed cookie covers one reference for 24 hours; define secure emailed access links/recovery, revocation and expiry; never expose details using a reference alone                                                           |
| B12 | Backend + client   | Fulfilment/admin operations                                                               | Staff can find orders, update shipment/tracking, cancel, refund and manage support with authorization/audit history                                                                                                         |

## Deployment and security — block public production launch

| ID  | Owner                     | Open requirement                                            | Acceptance evidence                                                                                                                                                            |
| --- | ------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D01 | Backend/DevOps            | Hosting, HTTPS, domains, secrets and environment validation | `pnpm check:launch` passes for intended environment; production has no mock/dev override; signing secret shared securely across instances; all PSP/OAuth URLs correct          |
| D02 | Backend/DevOps            | Distributed abuse controls and trusted ingress              | Current limiter is bounded but per-process; configure an overwritten trusted IP header and shared enforcement before scaling; spoofed headers cannot bypass limits             |
| D03 | Backend/DevOps + frontend | CSP/payment permissions for selected providers              | Start with reporting, approve exact origins/nonces and wallet iframe requirements; no broad wildcard workaround; browser checkout succeeds                                     |
| D04 | Backend/DevOps            | Monitoring, delivery failures and recovery                  | Error reporting redacts personal data; alerts for failed checkouts/webhooks/email, health checks, request IDs, retry policy, rollback and restore procedures exercised         |
| D05 | Backend/DevOps + frontend | CI/staging acceptance                                       | Quality pipeline green, browser suite runs, real-provider end-to-end tests added, secrets not exposed to builds/logs; provider-dependent tests must not silently pass on mocks |
| D06 | Client + backend/DevOps   | Privacy and retention                                       | Approve current processors, cookie/consent behavior, data retention/deletion/export, log redaction and access; no PII in analytics URLs                                        |

## Frontend, devices and business approval

| ID  | Owner                | Open requirement                                    | Acceptance evidence                                                                                                                                                      |
| --- | -------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| F01 | Frontend             | Repeated-navigation memory/DOM retention            | See PERFORMANCE.md; longer repeated visits plateau after warmup; GPU disposal, media pause and browser/device checks remain green                                        |
| F02 | Frontend + DevOps    | Cold-load/real-device budget                        | Record physical iPhone and mid-range Android results plus deployed-CDN measurements; verify slow-network fallback/preloader, reverse scrolling and long sessions         |
| F03 | Frontend + backend   | Loading/outage/stale-data states with real services | Empty catalogue, unavailable stock, changed price, expired session, timeout and failed payment return preserve useful recovery paths                                     |
| F04 | Frontend + client    | Category artwork, film and message illustrations    | Replace/approve `categoryStories.ts` `needs` entries and feedback illustration placeholders; verify image/model/font/music rights                                        |
| C01 | Client               | Confirm commerce facts                              | Approved product assortment/prices/weights, countries, delivery charges/free threshold, VAT treatment, bank details and lead times; remove conflicting marketing claims  |
| C02 | Client/legal adviser | Approve launch copy and policies                    | Current legal files are inherited copy, not approval for this implementation; approve business/consumer terms, withdrawal, company details, privacy and food information |
| C03 | Client + frontend    | Accessibility/editorial acceptance                  | Keyboard/screen-reader and physical-device review; correct labels, focus, contrast in all animated states; DE/EN copy and SEO review                                     |

## Optional architecture decision

- [ ] Decide single-domain shop versus `products.hugo-tron.com` before implementing cart/auth
      sessions. See [SHOP-SUBDOMAIN.md](SHOP-SUBDOMAIN.md). The current app is single-origin.
- [ ] If split, agree which team owns the shared API, cart service, account identity, checkout,
      redirects, catalogue cache invalidation, analytics and cross-origin security tests.

A marketing-only launch can defer commerce B-items only if account/checkout remain disabled
and all public enquiry, deployment, content and performance gates are met. Never use
`COMMERCE_ALLOW_MOCK=true` to bypass missing production integration.
