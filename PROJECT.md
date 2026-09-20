# Hugo Tron — Project Charter

Read this before touching anything. It states what we are building and why the
architecture looks the way it does.

---

## The idea, in one sentence

> **Build a frontend good enough to be worth keeping, and structured so that everything
> real — prices, stock, payments, orders, CMS — can be plugged into it later without
> anyone having to rewrite a component.**

Two halves, and both are load-bearing:

**"Good enough to be worth keeping"** — this is not a wireframe or a clickable mock.
It is the production frontend: real content, real typography, real motion, both
languages, accessible, fast. The client should be able to ship it.

**"Plugged into it later"** — we build the frontend. The client's team wires up the
backend, the data, and the payments. So the quality of the _seam_ is as much the
deliverable as the quality of the pixels.

---

## Division of labour

| We do                               | The client's team does      |
| ----------------------------------- | --------------------------- |
| Design (Dmitrij) and frontend build | Backend, database, CMS      |
| Content structure, both languages   | Price and stock management  |
| Components, motion, layout system   | Payment provider + checkout |
| Typed data contracts                | Order handling, ERP         |
| Mock data adapter + seed content    | Real data adapter           |
| Forms and their validation          | Form delivery, CRM, email   |

The client confirmed there are **no technical constraints** on the rebuild.

---

## The three rules

### 1. No component knows where data comes from

Every read goes through a typed `DataSource` interface. It ships with a mock adapter
reading local seed files. The client's team writes one adapter and flips one env var.
Nothing in `app/` or `components/` changes.

A beautiful frontend with fetches scattered through its components is _worse_ than a
plain one with clean seams — because someone else has to unpick it, and every hour
they spend unpicking gets blamed on us.

### 2. Every mutation is a stub with a contract

Cart, checkout, enquiry, sample request — the full UI is built, then calls a Server
Action that validates its input and returns a typed result. Each one ends at a
`TODO(backend)` comment naming the contract.

`grep -rn "TODO(backend)" src/` prints the complete integration worklist.

### 3. Bilingual from the first line

German and English, both real, no placeholder text. Locale-aware routes, slugs,
prices and dates. Retrofitting i18n costs more than building with it — and the
client's export business is the reason the English version exists at all.

---

## What we deliberately do not build

Building these would create work the client has to undo:

- No database, ORM or migrations
- No payment integration — checkout UI, then a stub
- No auth — account UI only, behind a stubbed session interface
- No CMS choice — we define the content contract; they pick the CMS
- No email sending — forms hit a stub

---

## Design system

Ported from **Poleum** (`DevUX-creator/Poleum`), the reference project, with colours
re-anchored for Hugo Tron. What carries over unchanged:

- The token architecture — one `@theme` block as the single source of truth,
  semantic aliases over raw ramp steps, so `<Section inverse>` can flip a whole subtree
- The 12-column grid and the three-tier vertical rhythm
- `Section` / `Container` / `Heading` / `Button` primitives
- The animation wrappers (`Reveal`, `RevealText`, `Copy`) and their shared contract
- The lint rules that enforce all of it — no raw hex, no undeclared media queries

What changes: the palette (food importer, not fertilizer trading), the display face,
and the sections themselves.

See `content/strategy/frontend-architecture.md` for the full architecture and
`docs/DESIGN-SYSTEM.md` once ported.

---

## Content

All copy is derived from the existing hugo-tron.com, captured in `content/`
before anything was rebuilt:

| Document                                    | Contents                                           |
| ------------------------------------------- | -------------------------------------------------- |
| `content/strategy/homepage-struktur.md`     | **New homepage, 15 blocks, German copy**           |
| `content/strategy/homepage-structure.en.md` | **Same 15 blocks, English copy**                   |
| `content/strategy/audit.md`                 | What is broken today, prioritised                  |
| `content/strategy/kundenfragebogen.md`      | Open questions for the client                      |
| `content/strategy/frontend-architecture.md` | Stack and handover design                          |
| `content/strategy/seo-redirects.md`         | URL map, 301s, meta, schema                        |
| `content/products/catalog.md`               | All 9 products, full text                          |
| `content/pages/*.md`                        | Each page: original text → assessment → proposal   |
| `content/legal/*.md`                        | AGB, Datenschutz, Impressum verbatim               |
| `content/_source/`                          | Raw scrape, and `products.json` with Wix image IDs |

**Never invent a figure.** Anything in `[square brackets]` is a real gap; it stays a
placeholder until the client fills it. Unverified numbers in a food importer's
marketing are a liability, not a rounding error.

---

## Build order

Homepage first, section by section, against the design Dmitrij supplies per section.
Then category and product detail, wholesale + enquiry form, private label, cart and
checkout shell, then the English locale across all of it.

After the wholesale form the client can see the entire concept working.

---

## Definition of done, per section

- [ ] `/de` and `/en` both correct — no untranslated strings
- [ ] 320px in German (longest strings) — no overflow, no broken grid
- [ ] Reduced motion on → content visible, nothing animating
- [ ] JavaScript off → content visible
- [ ] Keyboard: focus visible, order sensible
- [ ] Tokens only — no raw hex, no undeclared breakpoint
- [ ] Images via `next/image`, meaningful `alt`
- [ ] `pnpm verify` passes
