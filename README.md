# Hugo Tron

Bilingual (German / English) product site with an immersive 3D homepage and a
separate lightweight catalogue.

## Development

```sh
pnpm install
pnpm dev
```

Open `/en` or `/de` at http://localhost:3000. Run `pnpm verify` for type checking,
linting, formatting, unit tests and the production build.

## Current experiences

| Experience                | English             | German               |
| ------------------------- | ------------------- | -------------------- |
| Hugo Tron world           | `/en`               | `/de`                |
| Product catalogue         | `/en/products`      | `/de/sortiment`      |
| Interactive rice category | `/en/products/rice` | `/de/sortiment/reis` |
| Product enquiry           | `/en/enquiry`       | `/de/anfrage`        |

Other categories use the shared catalogue and product cards. Category definitions
live in `src/content/categories.ts`. Prices and product data are local seed data;
backend commerce integration is still planned. See [RANGE-COMMERCE](docs/RANGE-COMMERCE.md)
and `.env.example` for the enquiry provider setup.

The temporary rice lab and previous rice URLs redirect to the rice category.
Retired hero, slider, menu and placeholder sections are no longer application
features. Source artwork, supplied models and strategy drafts are retained as
reference material; they are not an inventory of implemented pages.

See [architecture](docs/ARCHITECTURE.md), [motion](docs/ANIMATION.md) and the
[current concept](content/strategy/hugo-tron-world.md).
