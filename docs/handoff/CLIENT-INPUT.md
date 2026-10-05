# Decisions and material needed from Hugo Tron

These items need the client's commercial decisions, provider access or qualified legal/tax
review. Existing copy and scraped data are inputs, not approval for the new shop.

## Before taking real orders

- Confirm the exact assortment, current prices, pack sizes, net quantities and variants.
  Supply stable SKUs/EANs where available and stock/availability rules.
- Supply product label/specification data: ingredients, allergens, nutrition, origin where
  applicable, responsible food-business details, storage and other required information.
  Have the responsible adviser confirm what must appear for each product and market.
- Confirm delivery countries, carriers, prices, free-delivery threshold and delivery times.
  Current marketing mentions €29 in places; the commerce configuration has no confirmed
  shipping price/free threshold. These must agree before launch.
- Confirm tax treatment for each product/customer/destination with the tax adviser. The
  single seed VAT rate is not a cross-border tax implementation.
- Confirm payment methods and merchant accounts; prepayment account holder, IBAN/BIC/bank;
  wholesale invoice/credit terms, if offered.

## Legal and company approval

Have Hugo Tron's legal adviser or chosen legal-text service review the actual new journey:

See [COOKIES-AND-LEGAL.md](COOKIES-AND-LEGAL.md) for the storage inventory and existing routes.
The inherited privacy policy still refers to Wix; the existing terms cover business customers.
The new storage notice is informational and does not replace provider consent when required.

- Company/address/register/managing-director details and contact channels.
- Consumer versus business terms, contract formation, payment and delivery wording.
- Withdrawal eligibility/exceptions, instructions/form/function, returns costs and damage
  reporting language. Do not assume all foods share one rule or reuse blanket exclusions.
- Privacy policy for the actual host, payment, auth, email, analytics and support providers;
  processor agreements, retention/deletion, cookies and consent where applicable.
- Food information and any health/nutrition claims in both languages.
- Placement and wording of purchase/withdrawal actions and permanent legal links.

Current files are in `src/content/legal/`; approved local content or a documented provider
integration can replace them. Confirm legal-service API access/entitlements if desired rather
than assuming the displayed membership badge grants them. This document does not certify
legal compliance.

## Sourcing, wholesale and private label

Confirm quantities, lead times, packaging formats, sample policy, actual certificates,
service areas and what sourcing claims may be published. Supply approved real project,
warehouse/team/pack photographs if available. Do not invent capacity or certification figures.

## Access and operations

Provide access securely (never in this repository) to DNS/domain ownership, hosting, shop/ERP,
payment merchants, email/CRM, OAuth apps and Search Console where needed. Decide:

- Which inbox/team receives sales, order support and general messages, and response promises.
- Whether old customer/order data is migrated, with an approved scope and migration plan.
- Whether the shop stays on the main origin or moves to `products.hugo-tron.com` (see
  SHOP-SUBDOMAIN.md); confirm exact domain spelling.
- Who owns catalogue updates, fulfilment, refunds, support, monitoring and incident response.

## Creative acceptance

Approve borrowed category films/illustrations or supply replacements (`categoryStories.ts`,
`needs`). Review feedback illustrations, DE/EN copy and all image/model/font/music licences.
Original media masters are outside `public/`, in `assets-src/`.
