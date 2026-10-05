# Architecture

How the site is built: routes, folders, the main components, and the rules they follow.
For connecting real systems see [INTEGRATION.md](INTEGRATION.md); for phone performance see
[PERFORMANCE.md](PERFORMANCE.md).

**Stack:** Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict), next-intl 4,
Three.js, GSAP, Lenis, Zod 4, Vitest, Playwright. Framework docs for this exact version are in
`node_modules/next/dist/docs/`; read them before changing framework code, as APIs differ from
older Next.js.

---

## 1. Routes

Every route lives under `src/app/[locale]/` and exists in German and English. Internal route
names map to localized URLs in `src/i18n/routing.ts` (e.g. `/range/rice` → `/de/sortiment/reis`,
`/en/products/rice`). German is the default; `/` redirects to `/de`.

| Route (internal)                                | DE / EN URL                                       | What it is                                                     |
| ----------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| `/`                                             | `/de`, `/en`                                      | Home: 3D world, then the paper story and footer                |
| `/range`                                        | `/sortiment`, `/products`                         | All products, filters, buy or enquire                          |
| `/range/[slug]`, `/range/rice`                  | `/sortiment/reis` …                               | Category pages (courtyard scene, paper chapters, product rail) |
| `/wholesale`                                    | `/grosshandel`, `/wholesale`                      | Wholesale palace walk, ending at a door to Private Label       |
| `/private-label`                                | `/private-label`                                  | Private label waterfront room                                  |
| `/delivery`                                     | `/lieferung`, `/delivery`                         | Delivery atlas with a drivable van                             |
| `/contact`                                      | `/kontakt`, `/contact`                            | Contact form with topics, quick contacts                       |
| `/cart`, `/checkout`, `/checkout/confirmation`  | `/warenkorb`, `/kasse` …                          | Commerce                                                       |
| `/account`, `/account/orders/[reference]`       | `/konto` …                                        | Sign in / register, orders, address                            |
| `/imprint`, `/terms`, `/privacy`, `/withdrawal` | `/impressum`, `/agb`, `/datenschutz`, `/widerruf` | Legal pages; withdrawal holds the § 356a BGB function          |
| `[...rest]`                                     | anything else                                     | Localized 404 (`not-found.tsx`)                                |
| `/enquiry`, `/rice`, `/rice-lab`                | —                                                 | Redirects kept for old links                                   |

API routes: `src/app/api/commerce/payments/webhook` and `src/app/api/commerce/auth/[provider]/callback`.
Also generated: `sitemap.xml`, `robots.txt`. Localized share images are pre-rendered in
`public/social/`; `src/lib/social.ts` selects the relevant artwork for each page. Browser and
Apple icons use the original live-site brand asset through Next's app-icon file conventions.
Old Wix URLs are redirected permanently in `next.config.ts`.

---

## 2. Folders

```
src/
├── app/                 routes, metadata, API routes (thin: they compose sections)
├── sections/            one folder per page-sized experience, with its own CSS
│   ├── World/           home 3D world: hero, orbit, journey, films
│   ├── Daylight/        home paper story, mobile story, footer (PaperContact), torn-paper handoff
│   ├── Category/        category pages: hero scene, paper chapters, product rail
│   ├── Wholesale/       palace walk page and its reading stations
│   ├── PrivateLabel/    waterfront room, pack, stonework
│   ├── Delivery/        delivery atlas, van, physics, road routing, challenge
│   ├── PaperChapter/    RangeReveal (used by categories); the rest is tech debt
│   ├── Opening/, Origins/   not rendered (see TECH-DEBT.md)
├── components/
│   ├── world/           Three.js modules of the home scene (scene, stream, rocks, films, focus…)
│   ├── hall/            Three.js palace (shared by Wholesale and the Private Label door)
│   ├── commerce/        product grid and cards, cart, checkout, account, feedback, dev panel
│   ├── legal/           LegalPage, LegalBlocks, LegalDialog, WithdrawalFunction
│   ├── contact/         contact form and quick contacts
│   ├── layout/          Header, MobileMenu, SiteFooter, AnnouncementBar, logo
│   ├── ui/              ArrowLink, Button, Heading, QuantityStepper, Disclosures, Cursor…
│   ├── media/           EngravedFilm, FilmPlaylist, useEngraving (video → ink shader)
│   ├── transition/      DoorTransition (dark hand-off between Wholesale and Private Label)
│   ├── sound/           SoundProvider and hooks
│   ├── providers/       SmoothScroll (Lenis), InlineScript
│   └── rice/            home theme provider (+ old rice scene, tech debt)
├── commerce/            shop logic and the backend contract (see INTEGRATION.md)
├── content/             typed data: products, categories, category stories, films, site,
│                        legal texts, delivery map and roads
├── lib/                 enquiry (form seam), legal source, SEO helpers, rate limit, sound engine
├── i18n/                routing (pathnames), navigation helpers, message typing
├── animations/          Copy, Reveal and word animations; fly-away CSS
└── styles/              theme.css (tokens), globals.css, grid.css, fonts.ts
messages/                de.json (source of truth for shape), en.json
public/                  only files the site serves
assets-src/              masters for the scripts (not served); see its README
scripts/                 media generators (python) and browser checks (node + Playwright)
tests/                   Vitest unit tests
```

---

## 3. Rendering model

- **Server first.** Pages are server components: they validate the locale, call
  `setRequestLocale`, build metadata (`pageMetadata()` in `src/lib/seo.ts`) and render copy,
  links and structured data. Without JavaScript every page still reads and links correctly.
- **Client islands.** Scenes, the cart, forms, motion and sound are client components.
  Three.js modules are imported dynamically after mount, so catalogue, legal and commerce
  pages never download them.
- **Data access.** Components read products only through `src/commerce/catalogue.ts`, legal
  texts only through `src/lib/legal/source.ts`, company data from `src/content/site.ts`.
- **Mutations** are server actions with zod validation and a rate limit: checkout, account,
  voucher, withdrawal, contact.
- **Global providers** (in `app/[locale]/layout.tsx`): `NextIntlClientProvider`,
  `SoundProvider`, `Cursor`, `SmoothScroll`, `CartProvider`, `CartDrawer`.

---

## 4. The experiences

### Home (`World` → `Daylight`)

`World.tsx` loads `components/world/scene.ts`: the courtyard model with a glass cube, light
streams, particle and rock fields. Scrolling (`useWorldJourney`) flies the camera along the
streams into a second environment with three floating video sheets (`films.ts`,
`WORLD_FILMS`). `Daylight.tsx` then hands over to paper: it publishes `--leave` (0 → 1) and
`worldHandoff`, which fade the 3D copy (`animations/flyAway.css`) and calm the scene, while
`useToneFill` raises the paper. On desktop that is a WebGL torn-paper front; on phones it is a
static torn sheet moved with `translate`. The theme switches to light once paper covers the
header.

`PaperStory` follows: pinned engravings and one ink line through the chapters on desktop,
`MobileStory` (five composed panels) on phones, then the product rail, private-label teaser,
range film (`EngravedFilm`) and `PaperContact`, the footer used on every page. The footer
shows contacts, legal links, the Händlerbund badge and a small 3D cube window
(`PaperPortal`), created only when it comes into view.

### Category pages (`sections/Category`)

Seven ranges share `CategoryPage`: a courtyard scene with one interactive ingredient
(`scenes.ts`; rice bowl, opening pistachio shells, stirring spices, fanning saffron threads…),
paper chapters with category illustrations, FAQ, and the product rail with the shared cards.
Per-category copy, accent colours, films and illustrations are in `src/content/categoryStories.ts`.
Every scene interaction also has a button; reduced motion keeps a still presentation.

### Wholesale palace (`sections/Wholesale`, `components/hall`)

An original Three.js nave (`palaceScene.ts`): stone architecture, crates and sacks, a floor
light stream (`palaceStream.ts`) and floating rocks. Seven viewport heights of scrolling walk
past five HTML reading stations to a door. Its link plays a scene-owned passage through the
door, then `DoorTransition` fades to dark and navigates to Private Label. Scrolling alone
never navigates.

### Private label room (`sections/PrivateLabel`)

`LabelRoom.tsx` with `roomScene.ts`: a stone landing built from the home model's own column
and slabs (`stonework.ts`, a 209 KB GLB subset), a folded sack (`pack.ts`) wrapped by the home's
light stream (`packStream.ts`), procedural water and a harbour. A click cycles the pack colour,
dragging rotates it. It is an illustrative preview, not a configurator. The final link opens
the contact form with `purpose=label`. `DoorArrival` keeps the dark cover until the room is ready.

### Delivery atlas (`sections/Delivery`)

A Germany SVG map (`DeliveryMap.tsx`, data in `src/content/deliveryMap.ts`) with states, main
roads and Hamburg. The van (`DeliveryVan.tsx`) is driven with arrow keys or held touch
buttons (`mapInteraction.ts`, `drivePhysics.ts`) or sent along roads by click
(`roadJourney.ts`, A* over `src/content/deliveryRoads.ts`). The current state is highlighted
and pulses (`regionEnergy.ts`, a Canvas2D layer sharing the van's frame loop). A ten-stop
challenge with a timer is in `deliveryRun.ts`. Four topic selectors (`DeliveryExplorer.tsx`)
change the delivery information without touching the map. Vehicle sounds go through the shared
sound engine (`lib/sound/vehicle.ts`).

### Commerce, contact, legal

- `components/commerce/`: product page (`ProductsPage`, `RangeProductCard`), cart
  (drawer and page), four-step checkout (`CheckoutFlow`), account, confirmation, and the shared
  `StatusMessage` for every success or error.
- `components/contact/`: one form with topics (enquiry, order, general) and quick contacts.
- `components/legal/`: `LegalPage` renders `LegalBlocks`; `LegalDialog` shows the
  cancellation policy inside checkout; `WithdrawalFunction` implements "Vertrag widerrufen"
  → "Widerruf bestätigen" → receipt.

---

## 5. Cross-cutting rules

**Language.** Every visible string comes from `messages/{de,en}.json`. `src/i18n/messages.ts`
makes German the required shape, so a missing English key fails `pnpm typecheck`. Navigation
must use `Link`, `useRouter`, `getPathname` from `@/i18n/navigation` (ESLint blocks
`next/link`), so URLs are translated. Adding a route: add it to `pathnames`, create the page,
export `generateStaticParams`, call `setRequestLocale`, use `pageMetadata()`, add it to
`src/app/sitemap.ts`.

**Design tokens.** Colours, spacing, easing and breakpoints live in `src/styles/theme.css`.
Stylelint forbids raw hex and undeclared media queries elsewhere; `tests/tokens.test.ts`
checks that tokens exist and key contrast pairs pass. Two type families: Geist (body, UI) and
Mersad (titles, variable weight). The home and story use the "world" palette
(`--color-world-*`): night navy, paper, ink.

**Motion.** `Copy` (masked lines) and `Reveal` (blocks) wrap GSAP and wait for fonts and the
page entrance. `SmoothScroll` owns Lenis and ScrollTrigger; `useScrollLock()` serves overlays.
Every animation respects `prefers-reduced-motion`; content is visible without JavaScript
(`html.js` gates pre-animation hiding).

**Scenes.** Independent lazily created renderers (the home can have multiple scene/effect
contexts), DPR caps, pause when hidden or offscreen, GPU disposal on unmount and static
fallbacks. Repeated-navigation DOM/image retention remains open; see PERFORMANCE.md. Details in PERFORMANCE.md.

**Sound.** `lib/sound/engine.ts` (Web Audio, no library) with assets and mix in `manifest.ts`.
Playback follows browser gesture/autoplay restrictions; clips may be prefetched during scene
warmup. Mute persists in
`hugo-sound-enabled`. `useSound().play("click" | "hover" | "product" | "transition" | "cart")`
triggers a cue; `data-sound-hover` and `data-sound-click="none"` opt controls in or out.

**Accessibility.** Skip link to `main` on every page, real buttons and links, visible focus,
dialogs with focus handling, localized labels, contrast checks in tested visible states; full acceptance remains open. Canvases
are decorative; the DOM carries all information.

**SEO and security.** `pageMetadata()` gives each indexable page title, description,
canonical, hreflang (de, en, x-default) and Open Graph. Commerce and account pages are
`noindex`. Security headers and Wix redirects are in `next.config.ts`.

---

## 6. Quality

`pnpm verify` = type-check, ESLint, Stylelint, Prettier, Vitest, production build. Unit tests
cover the cart, checkout pricing and contract, contact form and provider, delivery roads and
challenge, sound, rice motion and design tokens. Browser checks per experience are in
`scripts/check-*.mjs` (see PERFORMANCE.md for the list). Release state: [RELEASE.md](RELEASE.md).
