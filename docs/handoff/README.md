# Hugo Tron — handoff start here

**Status: ready for backend integration, not approved for live commerce.** The existing
frontend and mock flows are a foundation. Connecting an adapter alone does not finish the
catalogue, stock, checkout quotes, payments, emails, deployment or acceptance testing.

All implementation requirements, unresolved checks and release evidence are collected in
this folder. Repository-root paths below refer to the application, not this directory.

## Read in this order

1. [OPEN-ITEMS.md](OPEN-ITEMS.md) — the complete gap register, owner and acceptance criteria.
2. [INTEGRATION.md](INTEGRATION.md) — contracts, security, checkout flow and environment.
3. [RELEASE.md](RELEASE.md) — automated checks, manual scenarios and launch gates.
4. [SHOP-SUBDOMAIN.md](SHOP-SUBDOMAIN.md) — optional `products.hugo-tron.com` architecture;
   shared catalogue/cart/auth requirements. **An option, not implemented domain routing.**

## Supporting references

- [SOCIAL-ASSETS.md](SOCIAL-ASSETS.md): generated sharing banners, metadata mapping, original
  favicon, source prompts and export instructions.
- [COOKIES-AND-LEGAL.md](COOKIES-AND-LEGAL.md): notice behavior, browser-storage inventory,
  existing legal routes and the policy updates still needed before launch.
- [ARCHITECTURE.md](ARCHITECTURE.md): current routes, folders and scene ownership.
- [CLIENT-INPUT.md](CLIENT-INPUT.md): decisions and source material Hugo Tron must supply.
- [PERFORMANCE.md](PERFORMANCE.md): measurements, reproduction and device-test limits.
- [TECH-DEBT.md](TECH-DEBT.md): retained old code, stand-in assets and editorial cleanup.
- [Media sources](../../assets-src/README.md): masters and the scripts that convert them.

## Responsibility boundary

Frontend/shared-code safety fixes are recorded in RELEASE.md. Real providers, durable
transactions, authoritative product/stock/tax data, operational monitoring and business/legal
approval remain open. Do not enable real checkout by setting staging override flags.

For each open item, record the implementer, staging test evidence and approval date here.
A passing build is not evidence that emails arrive, stock is reserved, payments settle,
refunds work, or legal/business information has been approved.
