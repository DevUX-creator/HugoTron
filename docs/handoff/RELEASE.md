# Verification and release gates

Updated 5 October 2026. **Not a launch approval.** [OPEN-ITEMS.md](OPEN-ITEMS.md) is the
complete owner/acceptance register; [PERFORMANCE.md](PERFORMANCE.md) records unresolved memory
retention and mobile measurement limits.

## Fixed before backend handoff

- Guest confirmations require an HMAC-signed, reference-scoped 24-hour capability. The old
  reference-only cookie is rejected; unauthorized guests do not fetch an order.
- Auth return URLs reject the backslash/protocol-relative bypass. OAuth now uses browser-bound,
  provider-bound, single-use state rather than treating state as a redirect path.
- Account provider failures return form errors; password whitespace is preserved. A localized
  page error boundary provides retry/contact for unexpected failures.
- Unconfigured production account/checkout pages show contact guidance. Availability is
  evaluated at request time, not frozen into the production build.
- Raw card-number/CVC fields removed. The frontend supports a hosted-checkout redirect path;
  the chosen provider must still be integrated and tested.
- Unpriced shipping blocks order creation/payment. No invented delivery charge was added.
- Checkout IDs are reused for unchanged attempts, with an explicit atomic create-or-return
  backend contract and fingerprint conflict rejection. The mock demonstrates this in memory;
  durable database/PSP guarantees are **still open**.
- Voucher inputs/quantities are runtime-validated and rate-limited. Rate-limit storage is bounded
  and expires inactive entries; client IP headers are trusted only by explicit configuration.
- Mock/disabled webhooks return 503, not false success for a payment event.
- Next.js and its ESLint config patched to 16.3.6. The production dependency audit reported
  zero advisories after this patch. The addressed advisory is
  [GHSA-vcvr-r3jv-pc5j](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j).
- Handoff centralized here; README, environment example and code pointers updated. Added
  regression/browser checks, document-link checks and a CI workflow.

## Automated checks

```sh
pnpm install --frozen-lockfile
pnpm verify
pnpm exec playwright install chromium
pnpm e2e
pnpm audit --prod
# With intended production environment exported (expected to fail on default mock settings):
pnpm check:launch
```

`verify` checks handoff links, types, ESLint, styles, formatting, unit tests and a production
build. CI (`.github/workflows/quality.yml`) also runs dependency audit and Chromium desktop/mobile
browser smoke tests. Browser tests use a disabled-production server and a loopback-only active mock preview. They
cover safe disabled commerce, forged guest-cookie rejection and valid signed access,
external-redirect rejection, inactive webhook behavior and persisted cart interaction. Unit
regressions cover signed-token expiry/tampering, request validation, retry/concurrency contract,
OAuth state, provider errors and bounded limits.

The unit/browser mocks do not prove real emails, payment settlement, stock concurrency,
provider OAuth or fulfilment. Tests must be extended against the selected staging services.

## Review evidence and limits

5 October follow-up: added a DE/EN informational cookie/storage notice and documented the
actual storage inventory in [COOKIES-AND-LEGAL.md](COOKIES-AND-LEGAL.md). Existing business
terms and the inherited Wix privacy text still require approval/update. The notice's
dismissal is not tracking consent. Also replaced the wholesale camera's abrupt final gaze
switch with a continuous scroll-based blend, covered by forward/reverse continuity checks.
211 unit tests and 14 desktop/mobile browser cases passed, including persisted dismissal,
restricted storage and working legal links. Production build, types, lint and styles passed.

Social follow-up the same day: ten static DE/EN sharing banners (five designs), local original
brand icons and route-specific Open Graph/Twitter metadata. Production build and source/script
lint passed; 14 existing browser cases remained green and the two added crawler/asset checks
passed after matching the PNG favicon convention (16 cases total). Whole-workspace ESLint
currently also scans an unrelated in-progress `.prof.mjs` scratch file, which reports an unused
variable; that file was left to its owner. See [SOCIAL-ASSETS.md](SOCIAL-ASSETS.md) for source
prompts, export instructions and the live-site icon provenance.

Handoff verification: 207 unit tests and 10 desktop/mobile browser cases pass locally, along
with types, lint, stylelint, formatting, document-link checks and a production build.
The CI workflow is added but has not yet been executed on GitHub.

Earlier review: production build and 176 unit tests passed; 38 route responses and 70 internal
links checked; ten mobile route-load checks. New security tests extend that baseline. See the
handoff commit's CI output for final counts/results rather than treating old counts as current.
Browser emulation is not physical-device testing or a complete accessibility audit.

## Backend staging acceptance — attach results for each

- [ ] Guest and account checkout with a confirmed shipping/tax quote.
- [ ] Out-of-stock/removed item, changed price, expired quote, exhausted voucher.
- [ ] Duplicate clicks, concurrent submissions, network timeout, reload and retry: one order and
      one payment; interrupted payment reconciled safely.
- [ ] Decline, cancellation, 3-D Secure, delayed payment confirmation, prepayment and refund.
- [ ] Webhook bad signature, wrong amount/currency, replay and out-of-order events rejected or
      handled safely; temporary failure retried; stock/email effects not duplicated.
- [ ] Account and guest authorization, token expiry, logout/revocation, reset completion,
      verification and social login; another customer cannot access an order/address.
- [ ] Enquiry/order/reset/dispatch/withdrawal messages arrive; failed delivery is monitored.
- [ ] Restart/multiple-instance persistence, migration/backup/restore and rollback.

## Public launch gates

- [ ] OPEN-ITEMS blockers closed with owner/evidence/date.
- [ ] Client-approved assortment, delivery/tax/payment settings, legal copy and food information.
- [ ] Production domains/HTTPS/redirects, canonical/sitemap/locale URLs and callbacks verified.
- [ ] No mock/console/dev override; secrets configured without browser or log exposure.
- [ ] Trusted ingress plus shared abuse controls; CSP/payment origins tested with actual PSP.
- [ ] Monitoring/alerting and support owner; accessible errors and outage recovery.
- [ ] F01 memory acceptance resolved; real-phone scrolling, long-session and cold-load checks.
- [ ] Visual/DE/EN/accessibility review and asset licensing approved.

A marketing-only release may leave commerce disabled, but still needs working enquiries and
public-site security, performance, content and operational approval. No real orders should be
accepted by enabling the mock backend.
