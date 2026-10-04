# Release readiness — 4 October 2026

What was checked before launch, what was fixed, and what still has to happen. Everything
Hugo Tron has to supply is listed in [CLIENT-INPUT.md](CLIENT-INPUT.md); everything the backend
team has to connect is in [BACKEND.md](BACKEND.md).

## Verified

| Area             | Result                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Quality gates    | Prettier, ESLint, stylelint, `tsc`, 176 Vitest tests and `next build` all pass.                                                                        |
| Links            | Every link on every sitemap and commerce page resolves directly (no 404, no redirect hop). External links: WhatsApp and Instagram only.                |
| Accessibility    | axe (WCAG 2.2 A/AA) on every page, desktop: no violations. Mobile home: only mid-fade text during the story cross-fade.                                |
| Keyboard         | Every page starts with a skip link that moves focus into `main`; nav labels are announced once.                                                        |
| Privacy on load  | No third-party requests on any page. One cookie: `NEXT_LOCALE` (language preference).                                                                  |
| Safari (WebKit)  | All pages load without errors on iPhone emulation; the torn paper handoff renders correctly.                                                           |
| Mobile scrolling | Home, products, categories, wholesale, private label: p95 frame 16–33 ms at 4× CPU throttling. Delivery (a one-screen game, in progress) not measured. |
| SEO              | Title, description, canonical, hreflang (de, en, x-default) and Open Graph on every indexable page; generated share image per locale.                  |
| Old Wix URLs     | Permanent redirects for every old page and product URL, including `/product-page/*` (`next.config.ts`).                                                |
| Security headers | HSTS, nosniff, Referrer-Policy, X-Frame-Options and frame-ancestors, Permissions-Policy; `X-Powered-By` removed.                                       |
| 404              | Localised page in the site's design, status 404.                                                                                                       |

## Fixed in this pass

- Default locale is German again (`src/i18n/routing.ts`).
- The mock commerce backend and the console enquiry provider refuse to run in production
  unless `COMMERCE_ALLOW_MOCK=true` / `ENQUIRY_ALLOW_CONSOLE=true` (staging only). Without a
  real backend, checkout and the contact form report a failure instead of confirming orders
  and messages that nobody receives.
- Shipping prices and bank details that were never confirmed are no longer shown as facts
  (see `src/commerce/config.ts`).
- Phone paper handoff without WebGL (see [PERFORMANCE.md](PERFORMANCE.md)).
- Two small contrast failures (filter counts, category step numbers).
- `public/` holds only served files (102 MB, was 186 MB). Media masters moved to `assets-src/`
  with the scripts updated; unused images, references, archives and the old planning folder
  were removed.

## Blockers before going live

1. **Backend.** Register a real commerce backend (`COMMERCE_BACKEND`) and enquiry provider
   (`ENQUIRY_PROVIDER`); see [BACKEND.md](BACKEND.md). Until then, disable or hide checkout.
2. **Legal texts and food information** from Hugo Tron — see [CLIENT-INPUT.md](CLIENT-INPUT.md). Notably:
   managing director in the Impressum, consumer AGB, withdrawal wording, a privacy policy
   that names the new providers, label data (ingredients, allergens) per product.
3. **Shipping prices, delivery countries, bank details, VAT confirmation** into
   `src/commerce/config.ts`.
4. **Hosting:** HTTPS on `www.hugo-tron.com`, apex redirect, and a 301 from `hugo-tron.de` if
   that domain is still owned. Submit the new sitemap in Search Console.

## Decisions to make

- **Attribution** for the CC BY 4.0 courtyard model and the licences of the range films and
  the Mersad font (see `assets-src/README.md`, `CLIENT-INPUT.md`).
- **Permissions-Policy `payment=(self)`** blocks Apple Pay / Google Pay inside a payment
  provider's iframe. Add the provider's origin when it is chosen, together with the CSP below.
- **Content-Security-Policy:** only `frame-ancestors` is set. A full CSP needs nonces for
  Next's inline scripts and the payment provider's domains; add it with the real backend.
- **"About" page:** the nav item was removed because `/ueber-uns` had no page.
- **Translations payload:** every page sends the full message file (~15 KB compressed) to
  the browser. Scoping messages per client component would shrink it.

## How this was measured

Production build in an isolated copy of the repository (other sessions build into the same
`.next` folder, which corrupts a running `next start`). Chromium with the Metal GPU, Pixel 7
emulation and 4× CPU throttling for mobile; WebKit for Safari; axe-core 4.10 injected into
the page for accessibility.
