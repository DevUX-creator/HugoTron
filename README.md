# Hugo Tron

Bilingual (German/English) brand experience and product storefront for Hugo Tron GmbH.
Next.js, React, TypeScript and Three.js, with a separate lightweight catalogue.

**Ready for backend integration; not approved for live commerce.** Products are seed data,
commerce uses an in-memory mock, and no real enquiry/email provider is connected. Production
checkout/accounts stay unavailable until a backend is configured. Unknown shipping blocks
order creation and payment. The remaining work is explicit in the handoff below.

## Backend team — start here

**[Open the complete handoff folder](docs/handoff/README.md).** It is the single home for
integration requirements, gaps, ownership, release checks and evidence.

1. [Open items and acceptance criteria](docs/handoff/OPEN-ITEMS.md)
2. [Integration contracts and configuration](docs/handoff/INTEGRATION.md)
3. [Verification and launch checklist](docs/handoff/RELEASE.md)
4. [Optional shop subdomain](docs/handoff/SHOP-SUBDOMAIN.md)

Architecture, performance, client decisions and technical debt are indexed in the same folder.
Do not assume implementing `CommerceBackend` alone finishes catalogue, stock, quotes, payments,
email, operations or frontend integration. Do not use staging flags to enable live commerce.

## Run locally

```sh
pnpm install          # Node 24 (.nvmrc), pnpm 10
pnpm dev              # http://localhost:3000 → /de; English at /en
pnpm verify           # types, lint, styles, formatting, unit tests, production build
pnpm e2e              # browser smoke checks against that production build
pnpm check:launch     # configuration guard; intentionally fails on default mock settings
```

No credentials are needed for local preview. See [.env.example](.env.example) and the handoff
for production/staging settings. There are no raw card-number/CVC inputs. Mock checkout is a
demonstration and cannot deliver orders or messages.

## Common editing locations

| Need to change                     | Location                                               |
| ---------------------------------- | ------------------------------------------------------ |
| Site copy                          | `messages/de.json`, `messages/en.json`                 |
| Seed products/prices               | `src/content/products.ts`, `src/commerce/catalogue.ts` |
| Delivery/payment business settings | `src/commerce/config.ts`                               |
| Backend contracts                  | `src/commerce/backend/contracts.ts`                    |
| Company/contact details            | `src/content/site.ts`                                  |
| Legal content                      | `src/content/legal/`                                   |
| Category stories                   | `src/content/categoryStories.ts`                       |
| Design tokens/fonts                | `src/styles/theme.css`, `src/styles/fonts.ts`          |
| Redirects/security headers         | `next.config.ts`                                       |

Media masters and conversion instructions: [assets-src/README.md](assets-src/README.md).
