# Hugo Tron

The new website and shop for Hugo Tron GmbH, a food importer and wholesaler in Hamburg:
rice, nuts, spices, saffron, tea and pulses, sold online to households and supplied in
volume to businesses. German and English.

The frontend is complete. Real systems (shop backend, payments, email, legal-text service)
connect through a few documented seams; until then the site runs on built-in stand-ins.

## Start

```sh
pnpm install        # Node 24 (.nvmrc), pnpm 10
pnpm dev            # http://localhost:3000 → /de
pnpm verify         # type-check, lint, stylelint, format, tests, production build
```

No credentials are needed locally. `.env.example` lists the variables.

## Documentation

| Document                                     | For                                                                           |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| [docs/BACKEND.md](docs/BACKEND.md)           | Backend team: every connection point, where data lives, env, launch checklist |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Developers: routes, folders, components, rules                                |
| [docs/CLIENT-INPUT.md](docs/CLIENT-INPUT.md) | Hugo Tron: legal texts, prices, product data and access still needed          |
| [docs/PERFORMANCE.md](docs/PERFORMANCE.md)   | How the 3D scenes stay fast on phones, measurements, checks                   |
| [docs/RELEASE.md](docs/RELEASE.md)           | What was verified for launch and what still blocks it                         |
| [docs/TECH-DEBT.md](docs/TECH-DEBT.md)       | Known leftovers and when to remove them                                       |
| [assets-src/README.md](assets-src/README.md) | Media masters, the scripts that convert them, licences                        |

## Where things are

| Need to change…                      | Look in                                       |
| ------------------------------------ | --------------------------------------------- |
| A text on the site                   | `messages/de.json`, `messages/en.json`        |
| Products, prices, units              | `src/content/products.ts`                     |
| Shipping, payment methods, VAT, bank | `src/commerce/config.ts`                      |
| Address, phone, email, social links  | `src/content/site.ts`                         |
| Legal texts                          | `src/content/legal/`                          |
| Category pages                       | `src/content/categoryStories.ts`              |
| Colours, spacing, fonts              | `src/styles/theme.css`, `src/styles/fonts.ts` |
| Redirects and security headers       | `next.config.ts`                              |
