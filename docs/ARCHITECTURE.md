# Architecture

## Why this rebuild exists

The previous poleum.com was a Vue 3 + Vite SPA. The server returned a 1.7 KB
shell with an empty `#app`; all content was painted by JavaScript. For a company
whose buyers find it through search, that is close to invisible. It was also
English-only while selling into Turkey, MENA, Sub-Saharan Africa and Asia.

This rebuild is server-rendered and bilingual by construction.

|                             | Old                                              | New                                   |
| --------------------------- | ------------------------------------------------ | ------------------------------------- |
| HTML delivered to a crawler | 1.7 KB shell                                     | ~28 KB of real markup                 |
| Rendering                   | Client-only                                      | Static prerender, both locales        |
| Languages                   | EN                                               | EN + TR, translated URLs              |
| Contact form                | Third-party endpoint, key exposed in page source | Server route, validated, rate-limited |

## Stack

Next.js 16 (App Router, RSC) · React 19 · TypeScript 5.9 · Tailwind CSS v4 ·
next-intl 4 · GSAP 3 + ScrollTrigger · Lenis · Zod · Vitest · Playwright · pnpm.

TypeScript is deliberately pinned to 5.x. TS 7 (the native port) is too new for
this toolchain; revisit once `eslint-config-next` supports it.

## Folder map

```
src/
├─ app/
│  ├─ [locale]/          layout, template, page, error, not-found + routes
│  ├─ api/contact/       contact route handler
│  ├─ global-error.tsx   last-resort boundary (no i18n, no tokens)
│  └─ sitemap.ts robots.ts manifest.ts icon.svg
├─ animations/           Reveal, RevealText, Copy  (client wrappers)
├─ components/
│  ├─ providers/         SmoothScroll (Lenis + ScrollTrigger)
│  ├─ layout/            Header, Footer   ← stubs until built as sections
│  └─ ui/                Container, Section, Heading, Button, LocaleSwitcher
├─ content/              typed catalogue: products, services, types
├─ i18n/                 routing, navigation, request config, messages guard
├─ lib/                  site, seo, env, gsap, navigation, contact/
├─ sections/             one folder per page section — BUILT ONE AT A TIME
├─ styles/               theme.css (tokens), globals.css, grid.css, fonts.ts
└─ types/
```

Convention per component:

```
src/sections/Hero/
  Hero.tsx        PascalCase
  hero.css        camelCase, imported at the top of the .tsx
  index.ts        export { default } from "./Hero";
```

## Rendering strategy

Everything is statically prerendered. `generateStaticParams` emits both locales
for every route, and dynamic routes emit locale × entity using **that locale's
own slug** — so `/en/products/urea` and `/tr/urunler/ure` are both real files.

`setRequestLocale(locale)` is required in every layout and page. Omitting it
silently opts that route into dynamic rendering and undoes the whole point.

The only dynamic route is `POST /api/contact`.

## Server vs client

Server components are the default. A component only becomes `"use client"` when
it needs hooks, browser APIs or event handlers.

A server section still gets motion by composing the client wrappers around its
text — `<RevealText>`, `<Copy>`, `<Reveal>`. That keeps the section itself on the
server and ships only the wrapper to the browser.

Currently client-side: `SmoothScroll`, `LocaleSwitcher`, the three animation
wrappers, and `error.tsx`.

## Type safety

`strict` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`.

Three guarantees are enforced by the compiler rather than by review:

1. **Nav cannot link to a route that does not exist.** `NavItem.href` is typed
   `StaticPathname`, derived from the routing map. A typo does not compile.
2. **A missing Turkish message key fails `pnpm typecheck`**, via the `satisfies`
   guard in `src/i18n/messages.ts`.
3. **Dynamic routes cannot be linked without their params**, because
   `StaticPathname` excludes `[slug]` routes.

## Where things must not be imported from

- `next/link` and the navigation hooks — import from `@/i18n/navigation`, which
  applies the locale prefix and the translated pathname map. ESLint blocks the
  direct import.
- `src/lib/` must never import from `src/components/`. Data owns itself.

## Deliberate open items

- **CSP allows `'unsafe-inline'` for scripts.** A nonce would be stricter but
  must be generated per request in the proxy, which forces dynamic rendering.
  External script origins are still blocked. Rationale in `next.config.ts`.
- **Error tracking is a `console.error` TODO** in `app/[locale]/error.tsx`.
  Wire to Sentry when a DSN exists.
- **Rate limiting is per-instance and in-memory.** Fine for this traffic
  profile; swap `lib/contact/rateLimit.ts` for a shared store if it isn't.
