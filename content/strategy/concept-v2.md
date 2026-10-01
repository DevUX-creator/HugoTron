# Concept v2 — the relaunch pivot

**Date:** 2026-09-21
**Status:** home page cleared, awaiting the new hero concept
**References:** berenjak.com (structure, footer, the rice effect) ·
bymonolog.com · mynrd.co.uk · sondaven.com (colour) ·
**yucca.co.za (the hero ground — the closest match so far)**

---

## What happened

The first concept was built section by section against
[homepage-structure.en.md](homepage-structure.en.md) — a structured B2B
argument: claim, audience routing, catalogue, proof, company, private label,
FAQ. It works as an argument. The client wants something with considerably more
visual ambition ("wow"), and has given berenjak.com as the reference.

So the home page starts again. **Nothing has been deleted.** Every section is
still in `src/sections/`, still compiles, still passes `pnpm verify`. The only
change is that `src/app/[locale]/page.tsx` no longer renders them.

### What the home page renders now (updated 2026-09-21, second pass)

| Kept              | Why                                                        |
| ----------------- | ---------------------------------------------------------- |
| `AnnouncementBar` | The one strip of copy left standing.                       |
| `Header`          | Brand plate + utility controls only — nav and menu are out |

**Taken out on the second pass:** the header's nav row, the `Menu` overlay, and
`ContactFooter`. The footer was held one round as a placeholder; since the
client wants the reference site's footer, leaving the old one risked it being
read as a decision.

> **THE SITE HAS NO NAVIGATION AT ALL right now.** Deliberate — there is one
> page to be on — but it has to come back before anything ships. The link list
> is recorded below so nothing is lost.
>
> Primary nav was: Products (`/range`) · Wholesale · Private Label · About ·
> Delivery · Contact. `Menu/` and the `.header__nav` rules are untouched on
> disk.

`<main>` is empty. The hero lands there first.

### The order that was taken out

Worth recording, because the reasoning outlives the markup:

1. **Hero** — the claim: direct from origin, 1 kg to a pallet
2. **Buying options** — routes the reader into kitchen / trade / household
   _before_ prices, so a pallet buyer does not meet nine cards at €3.90 first
   and conclude we are a corner shop
3. **Proof** — the evidence, once the reader knows which buyer they are
4. **Products** — the range is real, with prices where there are prices
5. **Origin film** — a breath between the catalogue and the company
6. **Who we are** — who is behind it
7. **Private label** — the highest-margin service, after credibility
8. **Delivery** — the questions that block a first order
9. **References** — other people's word for it (renders nothing; see below)

---

## Inventory — what is worth carrying into v2

### Keep almost certainly

- **The token system** (`src/styles/theme.css`). Ramps, semantic aliases, the
  fluid type scale, the spacing tiers, `--chamfer-*`, `--radius-*`, the motion
  vocabulary. None of this is concept-specific. A new visual direction changes
  the _values_; the structure holds.
- **`Section`, `Container`, `Heading`, `Button`, `SectionTag`** — the
  primitives. `Heading` decoupling `as` from `size` matters more in a
  visually-led concept, not less.
- **The animation wrappers** (`Reveal`, `RevealText`, `Copy`) and their
  contract: dynamic GSAP import, reduced-motion short-circuit, failsafes,
  content visible without JavaScript. Whatever v2 does, it should do it behind
  this contract.
- **The enquiry form and its backend seam** (`src/lib/enquiry/`,
  `/enquiry` route). Schema, provider selection, rate limiting. Concept-neutral
  and the one piece the backend team is meant to pick up.
- **i18n** — routing map, translated pathnames, the message-parity guard.
- **`src/content/site.ts`** — company and contact details, single source.
- **The header brand plate.** The concave-fillet geometry and the scroll
  condense (`HeaderShrink`) are the closest thing the current build has to the
  "wow" the client is asking for. Show it before rebuilding it.

### Keep, but expect to rework

- **`ProductsTrack` / `ProductCard`** — the drifting catalogue row. The
  mechanism is sound; the card language will follow the new direction.
- **`StoryImage`** — scrubbed parallax, reused by the proof band. Small and
  generic.
- **`Questions`** — the animated FAQ accordion. Real `<details>` underneath,
  height-tweened, exclusivity timed in the component.
- **`OriginFilm`** — the video block.

### Probably not reused as-is

- **`HomeStory.tsx`** — four sections in one file (buying, private label,
  delivery, footer). It grew that way; v2 should split them.
- **The proof band** — currently three parallax frames with figures over them,
  after two rebuilds. The numbers behind it are still unconfirmed placeholders.

### Carries open debts into v2

- **`src/content/proof.ts`** — every figure is `confirmed: false`. Placeholder
  numbers, never checked with the client. If v2 shows numbers, this is still
  the blocker.
- **`src/content/references.ts`** — empty on purpose. No invented testimonials.
  Still needs three real (or anonymised) quotes from the client.
- **Certifications** — empty list, same reason. IFS / BRC / HACCP marks are a
  procurement gate in food B2B and cannot be placeholder art.
- **`ENQUIRY_PROVIDER=console`** — the form validates, rate-limits and logs.
  It does not deliver. See `src/lib/enquiry/provider.ts`.
- **Most routes 404.** `/range`, `/wholesale`, `/about`, `/terms` and the rest
  are in the routing map with no page behind them. Only `/` and `/enquiry`
  exist.

---

## Colour — read from the reference stylesheets

Values below are lifted from the sites' own CSS, not eyeballed from
screenshots, and converted to OKLCH because that is what `theme.css` generates
its ramps in.

### bymonolog.com — greige and warm near-black

A two-ramp system with **no accent colour at all**. Page ground is `beige-300`,
text is `black-400`.

| Token       |     Hex |   L% |     C |    H° |
| ----------- | ------: | ---: | ----: | ----: |
| `beige-100` | #e8e8e3 | 93.0 | 0.007 | 106.5 |
| `beige-200` | #ddddd5 | 89.5 | 0.011 | 106.6 |
| `beige-300` | #d1d1c7 | 85.8 | 0.014 | 106.7 |
| `beige-400` | #bfbfb1 | 80.1 | 0.019 | 106.8 |
| `black-50`  | #938f8a | 65.2 | 0.009 |  73.7 |
| `black-100` | #6b645c | 50.7 | 0.015 |  71.2 |
| `black-200` | #524d47 | 42.3 | 0.012 |  72.5 |
| `black-300` | #393632 | 33.5 | 0.008 |  75.3 |
| `black-400` | #080807 | 13.4 | 0.003 | 106.7 |
| `card-bg`   | #181715 | 20.5 | 0.004 |  84.6 |

Note the chroma column: **nothing above 0.019.** The whole site is built from
two near-neutral ramps, and the beige ramp is a hair green while the black ramp
is a hair orange — which is what keeps it from reading as flat grey.

### mynrd.co.uk — cream, deep teal, near-black

| Role       |     Hex |   L% |     C |    H° |
| ---------- | ------: | ---: | ----: | ----: |
| Cream      | #fff4e4 | 97.1 | 0.024 |  77.5 |
| Deep teal  | #0a3e42 | 33.4 | 0.052 | 202.8 |
| Near-black | #212121 | 24.8 | 0.000 |  89.9 |

The one real colour in any of the three. Even so, C 0.052 — a deep petrol, not
a bright teal, and used as a surface rather than as type.

### sondaven.com — sand and dark brown, inverting

| Role       |     Hex |   L% |     C |   H° |
| ---------- | ------: | ---: | ----: | ---: |
| Sand       | #a89474 | 67.6 | 0.051 | 79.4 |
| Dark brown | #2c2824 | 28.0 | 0.009 | 67.4 |

Built as a **theme flip**: `--_colors---base-0` and `base-1000` swap between
the two (and white) per section, so a block is dark-on-sand or sand-on-dark
from one pair of tokens. Its only saturated colours are functional — alert
#ffa800, error #e23d3d, success #1ba64b — and never decorative.

### yucca.co.za — named by the client for the hero ground

Read from their stylesheet. They keep a proper named palette (`--c-*`), and the
hero rule is unambiguous:

```css
.section-hero {
  display: flex;
  min-height: 100vh;
  background: var(--c-almond);
}
```

| Token                 |     Hex |   L% |     C |    H° | Where               |
| --------------------- | ------: | ---: | ----: | ----: | ------------------- |
| **almond**            | #F7F4E9 | 96.6 | 0.015 |  94.2 | **the hero ground** |
| porcelain             | #FFFDF5 | 99.3 | 0.011 |  95.2 | lighter surface     |
| ivory                 | #FFFEFC | 99.7 | 0.003 |  84.6 | near-white          |
| pebble-white          | #E5E6D9 | 92.1 | 0.017 | 110.3 | surface             |
| oat                   | #DFDAC6 | 88.7 | 0.027 |  95.4 | surface             |
| bamboo                | #BBAE96 | 75.5 | 0.036 |  82.9 | rules, borders      |
| olive-mist            | #BFC0AC | 80.1 | 0.027 | 109.3 | surface             |
| sage-grey             | #808877 | 61.5 | 0.027 | 127.8 | mid                 |
| stone-herb            | #707767 | 55.8 | 0.026 | 126.5 | mid                 |
| thyme                 | #616958 | 50.9 | 0.028 | 128.0 | mid                 |
| **rust**              | #BF6437 | 60.2 | 0.131 |  45.4 | the one accent      |
| **deep-forest-green** | #12271D | 25.1 | 0.033 | 162.0 | type, dark sections |
| charcoal              | #1D1D1B | 23.0 | 0.004 | 106.7 | near-black          |

This is the most directly useful of the four references, because it is a whole
system rather than two ramps, and because the client pointed at it for a
specific job.

What it adds to the picture the other three drew:

- **Almond at L 96.6 / C 0.015 / H 94** is a warm off-white — a page ground
  that is unmistakably not white, without being beige. It sits almost exactly
  where bymonolog's lightest beige does.
- **It has a green axis.** Sage-grey, stone-herb and thyme all sit around
  H 127 with C ~0.027, and deep-forest-green anchors the dark end at H 162.
  The other three references have no hue at all; this one has a quiet one, and
  it is a herb green — which for a food importer is not a coincidence worth
  ignoring.
- **One accent, and it is warm.** Rust at C 0.131 is the only saturated colour
  in the palette, used sparingly. That is the shape Hugo's accent should take:
  a single warm note, not a blue that carries headings.
- **Thirteen tokens, not five.** Several near-whites that differ by a couple of
  points of lightness. That is what lets surfaces stack without borders, and it
  is the part a two-ramp system cannot do.

### What the three agree on

1. **Warm hues.** Every neutral sits between H 67° and H 128° — yellow through
   orange into herb green. Not one cool grey among them.
2. **Almost no chroma.** C 0.003–0.052. The colour comes from the _warmth_ of
   the neutrals, not from a brand hue.
3. **Near-black, not black.** #080807, #2c2824, #212121 — all warm-shifted.
4. **Contrast does the work** that saturation usually does: very light ground
   against very dark ink, with the mid-tones reserved for surfaces.
5. **Accents are functional or absent.** None of the three has a decorative
   brand colour in the sense Hugo currently does.

### What that means for Hugo

Hugo today is the opposite of all three:

| Role       |     Hex |   L% |     C |    H° |
| ---------- | ------: | ---: | ----: | ----: |
| harbor-800 | #00348d | 36.1 | 0.156 | 261.0 |
| ink-900    | #25282c | 27.5 | 0.009 | 255.6 |
| paper-50   | #f5f7f9 | 97.5 | 0.003 | 247.9 |
| paper-200  | #d9dce2 | 89.4 | 0.009 | 264.5 |

**Cool** (H 248–265°) where the references are warm, and carrying one very
saturated anchor (C 0.156) where they carry none. Moving toward this reference
set is not a tweak to a few values — it is a hue rotation of roughly 180° on
every neutral plus retiring or heavily muting the harbor blue.

The good news is that the machinery already supports it. `theme.css` generates
its ramps in OKLCH and everything downstream reads **semantic aliases**
(`--color-fg-primary`, `--color-bg-base`, …). Rotating the ramps is a change to
one file, provided the drift noted in the audit — the ~50 places that reference
a ramp step directly — is cleaned up first. **That cleanup is now a
prerequisite, not a nicety:** each of those is a spot where a new palette will
not reach.

**DECIDED (2026-09-21): the palette will be new.** The harbor blue is not a
constraint to design around — `theme.css` gets rotated to a warm, low-chroma
system in the manner of the three references above. That settles the biggest
question and makes the ramp-step cleanup urgent rather than optional: every one
of those ~50 direct references is a place the new palette will not reach, and
they have to be converted to semantic aliases BEFORE the ramps move, or the
site will come out half-warm.

Two decisions still open:

1. **Is the logo re-cut?** The plate is a navy raster. A warm-neutral palette
   around a cool navy block will fight, and a vector original has already been
   requested (kundenfragebogen.md §A).
2. **Light, dark, or flipping?** sondaven inverts section by section from one
   token pair. Hugo's `<Section inverse>` already does exactly this — it is the
   cheapest of the three directions to adopt.

---

## The footer — berenjak.com, read 2026-09-21

**The client specifically likes this footer.** Treated as a requirement.

Reading it took three attempts: `curl` and WebFetch both hit a Vercel security
checkpoint (429, then 403). A real browser passes it, so the structure below is
read from the live DOM.

### What it actually is: a location directory, not a sign-off

This is the opposite of the "big typographic goodbye" a restaurant site usually
ends on. It is **dense, content-rich and almost entirely navigation** — the
business has seven cities across four countries, and the footer is where that
fact is made legible.

```
About            Links                      UK
  Food & Drink     FAQs                       Soho
  Story            Delivery                   Borough
  News             Instagram                  Mayfair
  Events           Privacy                  USA
  Careers          Gift Vouchers (London)     Downtown LA
                                            Emirates
                                              Dubai
                                              Sharjah
                                            Qatar
                                              Souq Waqif
                                              Al Maha
                                            Soho House
                                              United Kingdom → Farmhouse
                                              United States  → Dumbo House

[ Back ]   © JKS Restaurants 2026   Design: Everything in Between
```

Points worth copying:

- **Locations are grouped by country, with the country as a heading.** Not one
  flat list. The grouping is what turns eleven addresses into "four countries,
  seven cities" without saying it.
- **A nested group for a different context** — the Soho House sites sit under
  their own heading with their own country sub-headings, because they are a
  different kind of venue.
- **Two short link columns, not four.** "About" is editorial (Story, News,
  Events, Careers); "Links" is practical (FAQs, Delivery, Privacy, Gift
  Vouchers) and carries the single social link inline rather than as a row of
  icons.
- **One social link only.** Instagram, as a text link in a list.
- **A "Back" button**, not a "back to top" text link.
- **A design credit** beside the copyright.
- **No newsletter signup.** There is no form in the footer at all — worth
  noting, because that is the first thing most people assume is there.

### What this implies for Hugo

The shape transfers, and it transfers well, because Hugo has the same problem
in a different currency: not seven cities, but a range that splits by
**product group** and a business that splits by **buyer type**.

The direct analogue of the country-grouped location list is a **grouped range
directory** — Rice, Pulses, Nuts & kernels, Spices, Grains, Tea, each with its
lines beneath it — plus a buyer column (Wholesale, Private Label, Shop). That
would make the breadth of the catalogue legible in the footer the way berenjak
makes its geography legible, and it would restore Block 4's job after the
Categories section was removed.

Everything the current footer must keep (address block, email, telephone, the
legal column, the Händlerbund badge, copyright) fits this shape without strain
— the legal column becomes one more grouped list.

### Where the page stands now

**Blank, on an almond ground with grain over it.** On 2026-09-21 the header went too — brand plate, search, locale,
account, cart — along with the announcement strip and the rice preview band.
`src/app/[locale]/page.tsx` renders `<main />` and the served body is
`<main></main>`.

Nothing is deleted. `Header`, `AnnouncementBar`, `Menu`, `RiceField` and every
section still stand and still compile.

**Next, in order:** a ground colour in the manner of yucca's almond, a grain
texture over it, then the hero.

### Ground, grain and the title face — built 2026-09-21

**Ground.** `--color-paper-50` is now **#f7f4e9** — yucca's almond, verbatim.
The two steps under it were rebuilt on the same hue rather than left cool:

| Token               |       was | now       |
| ------------------- | --------: | --------- |
| `--color-paper-50`  |    `#fff` | `#f7f4e9` |
| `--color-paper-100` | `#eeedea` | `#f1ede0` |
| `--color-paper-200` | `#dedcd7` | `#e4dfcd` |

This is the first slice of the warm rotation. The rest of the ramps — ink,
harbor, lime, taupe — are still cool and still to do, and the ~50 direct
ramp-step references still have to become semantic aliases before they move.
`tests/tokens.test.ts` passes on the new ground, so no contrast pair broke.

**Grain.** An SVG `feTurbulence` inlined as a data URI in `--grain-image`, laid
over the page by `body::before`. Under a kilobyte, resolution-independent, and
tunable from `theme.css` alone (`--grain-opacity: 0.045`, `--grain-size:
180px`). A tiling PNG large enough not to repeat visibly would have been tens
of kilobytes for the same effect.

Two decisions inside it worth keeping:

- **`position: fixed`, not absolute.** Grain that travels with the scroll reads
  as texture printed ON the content; grain that stays put reads as the surface
  the content is printed on. Only the second looks like paper.
- **The alpha is deliberately tiny.** Past roughly 6% it stops being a surface,
  becomes a texture in its own right, and starts fighting small text.

**Title face: Mersad.** `Mersad.zip` at the repo root, converted from its
`Variable TT` master to woff2 — **71 KB for the entire 100–900 axis**, which is
less than two of the supplied static weights (~38 KB each) would have cost, and
leaves no weight cut-off to design around. Wired through `next/font/local` in
`src/styles/fonts.ts` as `--font-display-src`.

Nothing else moved. The display/sans split had been kept in the tokens while
both resolved to Geist precisely so this would be a one-file change, and it
was: no CSS touched. Geist keeps body, UI and numerals.

Verified: full German coverage (ä ö ü ß Ä Ö Ü €), 513 mapped glyphs, nine named
instances on one `wght` axis.

> **LICENCE OUTSTANDING.** The archive carries no licence file. Mersad is a
> commercial typeface and webfont use needs a licence that covers it. That is
> the client's to produce, and it is a launch blocker, not a detail.

### `Footer.zip` — noted, not used

Not berenjak's footer. It is a **CodeGrid tutorial project**,
`codegrid-next-accordion-frames` (Next 16, React 19, no dependencies beyond
those), whose one component is `src/component/Spotlight.jsx` with a set of
`public/spotlight/*.jpg`. An accordion/spotlight frame effect.

Left untouched — nobody has said what it is for. If it is the footer
interaction the client likes, that is a different thing from berenjak's footer
STRUCTURE documented above, and both can be true at once: their organisation,
this motion. Worth confirming which.

### The rice effect

**The client likes it and wants it in the footer.** Fitting, since the
restaurant is named after a rice snack — and it lands just as well for a rice
importer, which is the part worth saying out loud: it is not a borrowed trick
here, it is the product.

**Their implementation could not be inspected.** JavaScript execution and
screenshots are both blocked in this session by an extension conflict, and every
non-browser request to the domain is refused, so whether theirs is a canvas, a
WebGL scene or a physics solver is unknown. What follows is built from the
described interaction, not copied.

**A working one is in the repo now:** `src/components/ui/RiceField.tsx`, mounted
temporarily on the cleared home page so it can be pushed around
(`src/app/[locale]/preview.css` — scaffolding, delete both when it moves).

How it works: every grain has a home. The pointer shoves grains aside with a
squared falloff, a per-grain spring pulls each back, so the field parts as the
cursor crosses and closes behind it.

What it deliberately is NOT is a pile. No grain-grain collision, no stacking,
no gravity. Real granular physics needs a solver and several hundred resting
bodies — a dependency, a frame budget, and instability of exactly the kind that
reads as cheap: jitter where grains touch, drift into corners over a long
session. A field that returns to a known state cannot end up looking wrong, and
what a visitor feels (push the rice, it moves, it settles) is the same.

**If the client wants grains that heap up, that is a different component on a
real solver, not a tweak to this one.** Worth deciding before it goes into the
footer, because the answer changes the dependency list.

Details that matter if it is rebuilt: the loop stops when the field is at rest
and the pointer has left (a settled field repainting at 60fps is a laptop fan
running for decoration); DPR is capped at 2; reduced motion draws the scatter
once and attaches no listeners; pointer listeners are passive so dragging up
through the rice still scrolls the page; and the two colours are read from CSS
custom properties, so the field follows the new palette without touching the
TypeScript.

### Still unknown

The **visual** treatment. Screenshots and computed styles are blocked in this
session by an extension conflict, so ground colour, type, scale and any scroll
motion on that footer are not captured. If the client's "like" is about how it
LOOKS rather than how it is ORGANISED, that gap still needs a screenshot.

## Open questions for the client

1. Is the footer "like" about its ORGANISATION (captured — a grouped directory)
   or its LOOK (not captured — needs a screenshot)?
2. Does "wow" mean motion, scale, photography, or all three? The current build
   is restrained on purpose; there is a lot of headroom, but the direction
   changes what we invest in.
3. Does the B2B argument survive? The v1 order exists because a pallet buyer
   and a home cook need different paths. A visually-led home page can still do
   that, but only if it is designed in from the start.
4. The blockers above — proof numbers, references, certifications — are the
   same blockers in any concept. They need answers regardless.

---

## How to bring a section back

```tsx
// src/app/[locale]/page.tsx
import Products from "@/sections/Products";
// …
<main>
  <Products />
</main>;
```

That is the whole procedure. Nothing else was touched.
