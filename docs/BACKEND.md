# Backend integration guide

For the team that connects Hugo Tron's real systems. The site is finished on the front: every
page, form and screen works today against built-in stand-ins (a mock shop backend, a console
"email" provider, seed product data, local legal texts). Connecting the real thing means
replacing those stand-ins at a handful of seams. **No page or component has to change.**

---

## 1. The connection points at a glance

| #   | What                                                            | Where in the code                                        | Today (stand-in)                         | Switch                           |
| --- | --------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------- | -------------------------------- |
| 1   | Shop backend: accounts, orders, payments, vouchers, withdrawals | `src/commerce/backend/contracts.ts`                      | `backend/mock.ts`, in memory             | `COMMERCE_BACKEND`               |
| 2   | Contact form delivery                                           | `src/lib/enquiry/provider.ts`                            | `console` provider (logs, sends nothing) | `ENQUIRY_PROVIDER`               |
| 3   | Product catalogue (products, prices, stock)                     | `src/commerce/catalogue.ts`                              | seed data in `src/content/products.ts`   | edit the function bodies         |
| 4   | Legal texts                                                     | `src/lib/legal/source.ts`                                | files in `src/content/legal/`            | edit `legalDocument()`           |
| 5   | Card entry                                                      | `src/components/commerce/checkout/CardFields.tsx`        | mock inputs, never submitted             | replace with PSP hosted fields   |
| 6   | Payment provider webhook                                        | `src/app/api/commerce/payments/webhook/route.ts`         | calls `payments.handleWebhook`           | register URL with the PSP        |
| 7   | Social sign-in callback (Google, Apple)                         | `src/app/api/commerce/auth/[provider]/callback/route.ts` | calls `auth.completeSocial`              | register URL with each OAuth app |
| 8   | Transactional email                                             | inside your backend                                      | none                                     | —                                |
| 9   | Rate limiting                                                   | `src/lib/rateLimit.ts`, `src/lib/enquiry/rateLimit.ts`   | in-memory map per instance               | swap for a shared store          |

Safety net: in a production build the mock backend and the console provider **refuse to run**
(unless `COMMERCE_ALLOW_MOCK=true` / `ENQUIRY_ALLOW_CONSOLE=true`, meant for staging). Checkout
and the contact form then show an honest error instead of confirming orders or messages that
nobody receives.

---

## 2. Where data and files live

| Data                    | Location                                                                                | Notes                                                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Products, prices, units | `src/content/products.ts`                                                               | Prices are **integer cents**, gross (incl. VAT). `channel`: `shop` (buyable), `wholesale` / `sourcing` (enquiry only). |
| Categories              | `src/content/categories.ts`, `src/content/categoryStories.ts`                           | Category pages, their copy keys and imagery.                                                                           |
| Product names and copy  | `messages/de.json`, `messages/en.json` (`products.*`, `category.*`)                     | German is the source of truth for the message shape; English must have the same keys.                                  |
| Product images          | `public/products/<slug>/` (`front-cutout.png` on cards; `front`, `side`, `back`… views) | Served from the site; swap for a CDN by changing `productImage()` in `catalogue.ts`.                                   |
| Business settings       | `src/commerce/config.ts`                                                                | Payment and delivery methods, countries, VAT, bank details, guest checkout, social sign-in.                            |
| Company details         | `src/content/site.ts`                                                                   | Address, phone, email, WhatsApp, Instagram, register data.                                                             |
| Legal texts             | `src/content/legal/*.ts`                                                                | Verbatim from hugo-tron.com plus the client's food return policy.                                                      |
| Cart                    | the visitor's browser (`localStorage`, `src/commerce/cart/store.ts`)                    | Product IDs, quantities, voucher code, note. **Never prices.**                                                         |
| Session                 | cookie `ht_session` (`src/commerce/session.ts`)                                         | Your backend's opaque token; httpOnly, SameSite=Lax, Secure in production, 30 days.                                    |
| Orders, customers       | **your backend**                                                                        | The mock keeps them in memory until restart.                                                                           |
| Media masters           | `assets-src/`                                                                           | Not served. See `assets-src/README.md`.                                                                                |

---

## 3. Shop backend (accounts, orders, payments)

### Files

```
src/commerce/
├── config.ts              business settings (no secrets)
├── types.ts               the domain: Customer, Address, Order, OrderStatus, Voucher, PaymentStart…
├── catalogue.ts           product & category reads (seam 3)
├── cart/model.ts, store.ts   cart rules and browser persistence
├── checkout/
│   ├── schema.ts          THE CHECKOUT CONTRACT (zod): what the checkout form sends
│   ├── pricing.ts         totals — the server is authoritative
│   ├── actions.ts         server actions: placeOrder, checkVoucher
│   └── reference.ts       order references (HT-YYMMDD-XXXX)
├── account/actions.ts     signIn, register, socialSignIn, requestPasswordReset, signOut, updateAddress
├── withdrawal/actions.ts  submitWithdrawal (§ 356a BGB online withdrawal)
├── session.ts             the session cookie
├── dev/                   developer switcher (development and staging only)
└── backend/
    ├── contracts.ts       ★ THE INTERFACE TO IMPLEMENT ★
    ├── mock.ts            working reference implementation
    └── index.ts           picks the implementation from COMMERCE_BACKEND
```

Screens are in `src/components/commerce/` (products, cart, checkout, account, feedback).

### How the pieces talk

```
Browser                                   Server (src/commerce)                  Your systems
───────                                   ─────────────────────                  ────────────
Product card ── add ──► cart (localStorage: ids, quantities, voucher code, note)
Cart / Checkout ── checkVoucher ────────► checkout/actions ── vouchers.lookup ──► ✱
Checkout ── placeOrder(CheckoutInput) ──► checkout/actions
                                            1. rate limit
                                            2. validate   (checkout/schema)
                                            3. session / guest allowed?
                                            4. price      (checkout/pricing, from the catalogue)
                                            5. voucher    ── vouchers.lookup ───────► ✱
                                            6. store      ── orders.create ─────────► ✱
                                            7. pay        ── payments.start ────────► ✱ PSP
                                          ◄─ { confirmation URL | PSP redirect URL }
PSP ── returns buyer ──► /checkout/confirmation?ref=…  ── orders.get ──────────────► ✱
PSP ── webhook ────────► /api/commerce/payments/webhook ── payments.handleWebhook
                                                           └─ orders.setStatus ────► ✱
Account pages ── getSession / orders.listForCustomer / customers.updateAddress ───► ✱
Withdrawal page ── submitWithdrawal ── withdrawals.submit ─────────────────────────► ✱
```

✱ = a method of `CommerceBackend` in `backend/contracts.ts`.

Guarantees the site already gives you:

- **Prices never come from the browser.** Checkout sends product IDs and quantities;
  `checkout/pricing.ts` prices them from the catalogue on the server. Re-check in your system.
- **Card data never touches this site.** Cards go into the payment provider's hosted fields.
- **Every server action re-validates its input** (zod), whatever the form already checked.

### Connecting it, step by step

1. Copy `backend/mock.ts` to `backend/api.ts` (or `shopware.ts`, `shopify.ts`, …).
2. Implement every method of `CommerceBackend`. The mock shows the exact shape each must
   return; `types.ts` documents every field.
3. Register it in `backend/index.ts`: `api: () => apiBackend`.
4. Set `COMMERCE_BACKEND=api` and your own secrets (section 7).
5. Run `pnpm test` and walk through the scenarios in section 6.

| Part          | Methods                                                                                              | Typical source                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `auth`        | `signIn`, `register`, `startSocial`, `completeSocial`, `requestPasswordReset`, `customer`, `signOut` | shop backend accounts, Auth.js, Clerk, Keycloak                                                            |
| `customers`   | `updateAddress`                                                                                      | shop backend / CRM                                                                                         |
| `orders`      | `create`, `get`, `listForCustomer`, `setStatus`                                                      | shop backend / ERP                                                                                         |
| `payments`    | `start`, `handleWebhook`                                                                             | Stripe, Adyen, Mollie, PayPal, Klarna                                                                      |
| `vouchers`    | `lookup`                                                                                             | shop promotions                                                                                            |
| `withdrawals` | `submit`                                                                                             | order system + email; must email a receipt with content, date and time **immediately** (§ 356a Abs. 4 BGB) |

Rules for every method:

- **Throw** on infrastructure failure (network, 5xx). The buyer sees "something went wrong",
  never a false success.
- **Return `null` / `false`** for expected refusals (wrong password, unknown voucher, email
  already registered).
- `auth.requestPasswordReset` resolves the same way whether or not the email exists.

### Order statuses

```
pending_payment ─► paid ─► processing ─► shipped ─► delivered
awaiting_transfer ─┘                      (tracking set)
             └──► cancelled / refunded
```

- `placeOrder` creates the order as `pending_payment`, then calls `payments.start`.
- Prepayment (Vorkasse) → `awaiting_transfer`; the confirmation page shows the bank details
  from `config.ts` (or says they follow by email while `bankTransfer` is `null`).
- Redirect payments stay `pending_payment` until the webhook confirms.
- A declined payment returns the buyer to the payment step; expire such orders (e.g. 24 h).
- The cart empties only when the confirmation page shows a confirmed order.
- Shipping can be `null` ("depends on destination") while prices are unknown; the total then
  excludes it. Once `config.ts` has prices, totals include shipping automatically.

### Payments

Methods and their order: `COMMERCE.payments` in `config.ts` (`card`, `paypal`, `applePay`,
`klarna`, `prepayment`). `payments.start(order, returnUrl)` returns a `PaymentStart`:

| Result                                      | For                                      | The site then                                        |
| ------------------------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| `{ kind: "redirect", url }`                 | PayPal, Klarna, 3-D Secure, hosted pages | sends the buyer to `url`; they return to `returnUrl` |
| `{ kind: "paid" }`                          | synchronous confirmation                 | shows the confirmation                               |
| `{ kind: "instructions", reference, bank }` | prepayment                               | shows bank details (or "by email" if `bank` is null) |
| `{ kind: "failed", reason }`                | declined / cancelled                     | back to the payment step with a message              |

- **Card fields:** replace the body of `CardFields.tsx` with the provider's hosted fields and
  call `onValidChange(true)` on the provider's "complete" event. Add the payment token to
  `checkout/schema.ts` and pass it through `placeOrder`.
- **Apple Pay** shows only where `ApplePaySession.canMakePayments()` is true; verify the
  domain with your PSP.
- **Webhook:** register `https://www.hugo-tron.com/api/commerce/payments/webhook`.
  `handleWebhook` verifies the signature and calls `orders.setStatus`. Return `false` for an
  invalid request (400); throw to make the PSP retry (500).
- **Headers:** `next.config.ts` sends `Permissions-Policy: payment=(self)` and a
  `frame-ancestors` CSP. Add your PSP's origins there when you add wallet payments in iframes.

---

## 4. Contact form

`/contact` (the old `/enquiry` redirects there) posts to a server action that validates the
message (`src/lib/enquiry/schema.ts`) and hands it to `deliverEnquiry()` in `provider.ts`.

Each message carries `topic` (`enquiry` default, `order`, `general`), `purpose` (`quote`,
`sample`, `label`, `other`), optional product, quantity, pack size, postcode, date, order
reference, and the sender's name, company, email, phone and locale.

To deliver it: add a provider (SMTP, Postmark, a CRM API, a ticket system) to `providers` in
`provider.ts` and set `ENQUIRY_PROVIDER` to its name. A provider must **throw** when delivery
fails; the form then tells the sender to write an email instead. Route by `topic` if sales and
order support use different inboxes. The recipient address is `CONTACT.email` in
`src/content/site.ts`.

---

## 5. Catalogue, legal texts, images

**Catalogue.** Every product read goes through `src/commerce/catalogue.ts`. The functions are
synchronous because the seed is static. For a remote catalogue (PIM, shop backend), fetch on
the server in the page or layout (cached), and keep the returned shapes. The `Product` type
in `src/content/products.ts` is the contract. Product names and descriptions are translation
keys in `messages/*.json`; a CMS can replace those keys per product.

**Legal texts.** `legalDocument(id, locale)` in `src/lib/legal/source.ts` returns the Impressum,
AGB, withdrawal policy and privacy policy as typed blocks. Hugo Tron is a Händlerbund member;
Händlerbund offers an API (token from the member account) that keeps texts current. Fetch
there server side with a daily revalidation, map to blocks, and keep the local file as the
fallback.

**Images.** Product images are local files referenced by path. To move them to a CDN or the
shop backend's media, change `productImage()` in `catalogue.ts` and add the host to
`images.remotePatterns` in `next.config.ts`.

---

## 6. Developer switcher and test scenarios

In development, or on staging with `NEXT_PUBLIC_COMMERCE_DEV_TOOLS=true`, a **DEV** button
appears bottom-left on commerce pages:

| Switch                                       | Effect                                   |
| -------------------------------------------- | ---------------------------------------- |
| Customer: Guest / Demo customer              | signs out, or signs in the demo customer |
| Guest checkout: Allowed / Account required   | overrides `COMMERCE.checkout.allowGuest` |
| Payment provider answers: Success / Declined | how the mock PSP answers                 |

Mock data: **demo@hugo-tron.test / demo1234** (two past orders); vouchers **WELCOME10**
(−10 %) and **FREESHIP**. Data resets on server restart.

Scenarios to check with any backend:

1. Guest checkout with card → confirmation → "create an account" offer.
2. Guest checkout with prepayment → order reference shown, bank details shown or "by email".
3. Payment declined → back on the payment step, cart intact, nothing charged.
4. Account required → contact step offers only sign in / register.
5. Sign in from checkout → returns to checkout with the address prefilled.
6. Register; social sign-in (Google, Apple) returns to where it started.
7. Account: current orders, history, order page with progress and tracking, edit address.
8. Voucher valid / invalid in cart and checkout; the note travels from cart to order.
9. A product stops being sold online while in a cart → "your cart has changed".
10. Withdrawal: "Vertrag widerrufen" → confirm → receipt with date and time, and the email.

---

## 7. Environment variables

| Variable                         | Purpose                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------- |
| `COMMERCE_BACKEND`               | backend implementation (`mock` by default)                                       |
| `COMMERCE_ALLOW_MOCK`            | `true` lets a production build use the mock (staging only)                       |
| `ENQUIRY_PROVIDER`               | contact form provider (`console` by default)                                     |
| `ENQUIRY_ALLOW_CONSOLE`          | `true` lets a production build use the console provider (staging only)           |
| `NEXT_PUBLIC_SITE_URL`           | absolute origin for payment return URLs, e.g. `https://www.hugo-tron.com`        |
| `NEXT_PUBLIC_COMMERCE_DEV_TOOLS` | `true` on staging to show the DEV switcher; never in production                  |
| your own                         | API keys, webhook secrets, OAuth client IDs — read them only inside your adapter |

`.env.example` lists them. Secrets never go into `config.ts`.

---

## 8. Running and deploying

- Node 24 (`.nvmrc`), pnpm 10. `pnpm install`, then `pnpm dev` (http://localhost:3000).
- `pnpm verify` runs type-check, ESLint, Stylelint, Prettier, Vitest and the production build.
- Any Node host that runs `next start` works (Vercel, a container, a VM). Pages are mostly
  static; server actions and the two API routes need the Node runtime.
- Behind several instances, move the rate limits (section 1, row 9) to a shared store and make
  sure your session lookup in `auth.customer` is fast (cache inside your adapter).
- Old hugo-tron.com (Wix) URLs are redirected in `next.config.ts`; security headers are set
  there too.

---

## 9. Before launch

- [ ] Real backend registered, `COMMERCE_BACKEND` set.
- [ ] Contact provider registered, `ENQUIRY_PROVIDER` set; a test message arrives.
- [ ] Hosted card fields in `CardFields.tsx`; PSP webhook registered and verified.
- [ ] Apple Pay domain verified; PayPal and Klarna merchant accounts live.
- [ ] Google and Apple OAuth clients; callback `…/api/commerce/auth/{google,apple}/callback`.
- [ ] Emails sent by the backend: order confirmation, shipping, password reset, withdrawal receipt.
- [ ] `config.ts`: shipping prices, delivery countries, VAT, bank details (see `CLIENT-INPUT.md`).
- [ ] `NEXT_PUBLIC_COMMERCE_DEV_TOOLS` unset; `COMMERCE_ALLOW_MOCK` and `ENQUIRY_ALLOW_CONSOLE` unset.

All user-facing messages are in `messages/{de,en}.json` under `commerce.*`; errors returned by
server actions are message ids under `commerce.errors`. Every success, notice and error renders
through `components/commerce/feedback/StatusMessage`; illustrations still to be drawn are
listed in `feedback/illustrations.ts`.
