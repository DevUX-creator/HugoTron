# Architecture

Hugo Tron uses Next.js 16 App Router, React 19, TypeScript, next-intl, Three.js,
GSAP, Lenis and Zod. Read the installed Next.js guides in
`node_modules/next/dist/docs/` before changing framework code.

## Application map

- `src/app/[locale]/page.tsx`: the dark Hugo Tron world entrance.
- `src/app/[locale]/range/`: the lightweight product catalogue, category pages
  and dedicated rice experience.
- `src/app/[locale]/enquiry/`: the enquiry form and its server action.
- `src/app/[locale]/checkout/`: the order request (paid by invoice) and its server action.
- `src/sections/World/`: courtyard hero, ingredient selection, the spring journey and shared scene lifecycle.
- `src/sections/Opening/`: rice hero, overhead interaction and compact rice card.
- `src/sections/PaperChapter/`: film reveal, horizontal product cards and buying paths.
- `src/components/world/` and `rice/`: the independent Three.js scenes.
- `src/components/products/`: catalogue cards and the shared commerce pieces
  (`AddToCart`, `EnquireLink`, `useProductChoice`).
- `src/components/forms/`: `FormPage`, `Field`, the enquiry and order forms and their shared styles.
- `src/components/cart/` and `src/lib/cart/`: persisted cart and its UI.
- `src/lib/catalogue.ts`: the only way components read products, categories and prices.
- `src/lib/orders/` and `src/lib/enquiry/`: schemas, pricing and the delivery providers.
- `src/components/layout/`: header, logo and enquiry footer.
- `src/components/media/`: the range film playlist.
- `src/animations/`: `Copy` and `Reveal` animation wrappers.
- `src/content/`: typed products, categories, company details and range films.
- `src/i18n/` and `messages/`: localized routing and German / English messages.
- `src/styles/`: shared tokens, fonts, reset and grid.

The former preview sections and duplicated product slider have been removed.
Original artwork and research remain under `content/_source/` and the supplied
asset directories. Historical strategy files describe earlier concepts, not
current application routes.

## Rendering and routing

Server components handle page composition, metadata and localized content.
Client components handle the interactive scenes, cart, forms and motion.
Three.js scene modules load dynamically after the page mounts. World scene
failure leaves the static poster and navigation available.
On scroll, the cube sheds its panels and its core sinks down the axis of a spring wound from
the hero's light streams (`journey.ts`, `stream.ts`); the camera follows it and pulls back to
show the whole spring. `useWorldJourney` owns the native scroll progress and inactive-content
focus handling.

Use `Link`, `getPathname` and redirects from `@/i18n/navigation`. Internal paths
such as `/range/rice` map to public URLs through `src/i18n/routing.ts`. The map
also contains planned destinations; a typed pathname alone does not guarantee
that a page has been implemented.

Both locales use a prefix. Page entry points validate the locale and call
`setRequestLocale` where rendering localized content. The enquiry page reads
query parameters to preselect a product and submits through its server action.

## Shared state and data

`CartProvider` wraps the application. Every product surface reads the catalogue through
`lib/catalogue.ts` and buys through the shared `AddToCart`. Orders are requests paid by
invoice. The three backend seams (catalogue, cart store, order and enquiry providers) are
described in [RANGE-COMMERCE.md](RANGE-COMMERCE.md).

The homepage and catalogue force the dark theme without overwriting the saved
rice theme. The rice page supports both themes, with the initial preference
applied before paint and the same value used by the scene.

Messages are typed against German; `src/i18n/messages.ts` checks English parity.
TypeScript uses strict mode, checked indexed access and exact optional types.
CSS references shared semantic tokens; token tests guard missing definitions
and important contrast relationships.

## Verification

`pnpm verify` runs the type checker, ESLint, Stylelint, Prettier, Vitest and a
production build. Browser review additionally covers scene loading/fallbacks,
responsive content, reduced motion, category navigation, cart interaction and
rice theme persistence. No test submits a real enquiry or order.
