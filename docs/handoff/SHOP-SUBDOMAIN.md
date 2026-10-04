# Optional shop subdomain

Proposed: immersive brand/category stories on `www.hugo-tron.com`; lightweight products,
cart, accounts and checkout on `products.hugo-tron.com`. Domain spelling/ownership and this
choice must be confirmed with Hugo Tron. No DNS or split deployment has been implemented.

## What this can improve

The shop can be deployed and maintained independently, without downloading scene code.
Editorial pages stay expressive while the purchase journey stays simple. The current catalogue
already avoids Three.js downloads, so a subdomain is an ownership/deployment choice, not an
automatic performance fix. It also introduces cross-origin integration work.

## Shared services, not two shops

Both frontends must use one catalogue/price/stock source and stable product/variant IDs.
An Add to cart button on home or a category page must write to the same server-side cart that
the shop opens. The current `localStorage` cart is isolated by origin and **does not cross
subdomains**. Cross-origin cart/account integration is still open.

Recommended boundary: browser → its same-origin backend-for-frontend → shared commerce API.
Keep service credentials server-side and payment/order ownership on the backend. Avoid having
both apps maintain independent price calculation, stock assumptions or order state.

Agree the visitor/cart bridge before implementation:

- Prefer host-only session cookies and an explicit, short-lived **single-use handoff code**
  exchanged server-side when moving to the shop. No PII, raw session token or full cart in URLs.
- The handoff creates/resumes the same cart, preserves locale, and merges with an account cart
  under documented rules. It must handle expired codes, replay, logout, concurrent tabs and
  users returning to the main site. Prevent caching/referrer leakage of handoff responses.
- A shared parent-domain cookie is another option, but widens trust to subdomains; use only
  after reviewing subdomain ownership/takeover risks, cookie scope, CSRF and session isolation.
  Do not add `Domain=.hugo-tron.com` as a quick fix.
- If browsers call a shared API directly, implement exact CORS origins, credentials, CSRF
  protections and authorization. Subdomains are different origins even when same-site.

## Decisions and acceptance tests

- One owner for the catalogue, cart service, sessions, checkout, email and stock updates.
- Shop URLs and payment/OAuth callbacks generated from the deployed shop origin.
- Add on home/category → open shop → same quantities/variants/voucher; refresh and back work.
- Login/cart merge, logout, expired sessions, guest checkout and failed payment recovery.
- Replay/forgery of handoff codes and cross-account access fail safely.
- Mobile/iOS browser behavior, locale switching, fallback when shop/API is unavailable.
- Cross-domain analytics/referrals, consent, canonical URLs and redirects for old shop routes.

Until agreed, keep the existing same-origin app and shared commerce components. Do not hard-code
new external links throughout scene components. A future shop URL helper/cart adapter should
centralize this change.
