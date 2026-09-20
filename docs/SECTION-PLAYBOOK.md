# Section playbook

The recipe for adding one section. Follow it in order every time — that is what
keeps twenty sections built over weeks looking like one design.

Read [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) and [ANIMATION.md](ANIMATION.md) once
before your first section.

---

## 1. Get the copy first

Find the section's source copy in `docs/content/en/<page>.md` and curate the
lines you need, tagging each ✅ verbatim / 🔁 reworked / ⚠️ TODO.

**Do not invent figures.** If a number would be nice but is unverified, mark it
⚠️ and phrase around it.

Then decide where each string belongs:

- Reusable UI (buttons, labels) → `messages/{en,tr}.json`
- Section-specific prose → `messages/{en,tr}.json` under a section namespace
- Entity data (a product's specs) → `src/content/`

Turkish long-form stays `tr: null` until the client supplies it. Never machine
-translate.

## 2. Create the folder

```
src/sections/WhoWeAre/
  WhoWeAre.tsx
  whoWeAre.css
  index.ts        →  export { default } from "./WhoWeAre";
```

Server component by default. Only add `"use client"` if it genuinely needs
hooks, browser APIs or event handlers — motion does **not** require it, because
the animation wrappers are already client components.

## 3. Build the markup with primitives

```tsx
import Section from "@/components/ui/Section";
import Heading from "@/components/ui/Heading";
import RevealText from "@/animations/RevealText";
import Copy from "@/animations/Copy";
import "./whoWeAre.css";

export default function WhoWeAre() {
  const t = useTranslations("whoWeAre");

  return (
    <Section id="who-we-are" surface="surface">
      <p className="eyebrow">{t("eyebrow")}</p>

      <div className="grid-12">
        <div className="col-12 col-lg-7">
          <RevealText>
            <Heading as={2} size="title-xl">
              {t("title")}
            </Heading>
          </RevealText>
          <Copy>
            <p>{t("body")}</p>
          </Copy>
        </div>
      </div>
    </Section>
  );
}
```

- `<Section>` owns block padding. **Never add your own top/bottom padding.**
- **Anything on the home page below the hero needs `position: relative;
z-index: 1` AND an opaque background.** The hero is `z-index: 0` with a
  sticky stage that keeps painting for its whole 480svh; `Intro` covers the top
  of that window but is shorter than a viewport, so the ocean scene is still
  there underneath. Both halves matter: without the stacking position the
  section's background paints below the hero, and without a background there is
  nothing to paint — z-index cannot hide anything through a transparent box.
  `<Section>` only paints when you pass `surface`, so a section sharing the
  default ground has to set `background-color: var(--color-bg-base)` itself.
- **`#why` is the exception, and it is the same rule read backwards.** The page
  is one continuous scene with content panels sliding over it: the hero is the
  stage being covered at the top, and the closing corridor is the same stage
  being UNCOVERED at the bottom. So `#why` sits at `z-index: 0` with a
  `-100svh` top margin, which pins its sticky stage behind the last viewport of
  `#solutions` — and `#solutions` carries a rounded, shadowed BOTTOM edge, the
  mirror of the leading edge `Intro` brings over the hero, so that panel reads
  as lifting away rather than as ending. A new section between the two would
  have to take over that trailing edge, and `#solutions` would give it up.
- Use `<Section inverse>` for a dark surface — it re-points the semantic tokens
  so your CSS needs no dark variant at all.
- `as` (outline level) and `size` (visual scale) are chosen independently.

## 4. Style with tokens only

In `whoWeAre.css`:

```css
.who-we-are__lead {
  color: var(--color-fg-secondary);
  font-size: var(--text-body-lg);
  margin-block-start: var(--gap-block);
}
```

- No raw hex. No media query outside the declared breakpoints. Stylelint fails
  the build on both.
- Never reference a ramp step (`--color-hunter-800`) — use the semantic alias
  (`--color-fg-heading`), or `inverse` will not work.
- No `font-weight` on display type.
- Reach for `.grid-12` + `.col-*` before a bespoke `grid-template-columns`.

## 5. Add motion, sparingly

Compose the existing wrappers: `<RevealText>` for headings, `<Copy>` for body,
`<Reveal>` for blocks. Add `eager` above the fold.

For bespoke choreography, `registerGsapPlugins()` inside an effect, wrap in
`gsap.context()`, revert on cleanup, and bail early under reduced motion. Use
the `--ease-*` vocabulary rather than a new curve.

## 6. Wire it into the page

```tsx
// src/app/[locale]/page.tsx
<WhoWeAre />
```

## 7. Check it — all of it

```bash
pnpm verify
```

Then in the browser:

- [ ] `/en` and `/tr` both render correctly.
- [ ] **320px in Turkish** — the longest string, no overflow, no broken grid.
      Turkish runs 15–25% longer; this is where things break first.
- [ ] 1440px desktop.
- [ ] OS "reduce motion" on → content visible, nothing animating.
- [ ] JavaScript disabled → content visible.
- [ ] Tab through it — focus visible, order sensible, overlays trap focus.
- [ ] Images via `next/image`, within budget, meaningful `alt`.

Full list in [CONTRIBUTING.md](CONTRIBUTING.md#definition-of-done).

---

## Common mistakes

| Mistake                             | What happens                                       |
| ----------------------------------- | -------------------------------------------------- |
| `padding-block` on the `<section>`  | Rhythm drifts out of step with every other section |
| Raw hex "just this once"            | Stylelint fails; and `inverse` breaks              |
| Ramp step instead of semantic alias | Section renders unreadable on a dark surface       |
| `font-weight: 700` on a heading     | Nothing happens — Nasalization has one weight      |
| Hardcoded English in JSX            | Turkish page ships English text                    |
| `import Link from "next/link"`      | ESLint error — produces untranslated URLs          |
| Only testing English                | Turkish overflows at 320px                         |
| `<img>`                             | ESLint error — no srcset, no AVIF, layout shift    |
| Forgetting `setRequestLocale`       | Route silently becomes dynamic, loses prerendering |

---

## Built sections

| Section                           | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/sections/Hero`               | WebGL particle field + the Poleum mark assembled from particles. The mark's target positions come from rasterising `src/app/icon.svg`'s path and sampling its alpha (`src/lib/particles/sampleShape.ts`) — no hand-authored point data. Two particle groups share one draw call: `aRole=0` stays in the field, `aRole=1` morphs into the mark. Portrait viewports have no clear space for the mark, so it becomes a faint centred watermark instead of a foreground object. three.js loads only on the client, only after the copy has painted.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `src/sections/Services`           | SIX PLACES, ONE PER CHAPTER, AND THE PAGE STEPS BETWEEN THEM. Each chapter stands in its own environment (`scene/environments.ts`): a flooded valley the road of light runs down (still water in `scene/water.ts` — noise ripples, the ranges reflected dark toward the shores, the haze down the middle, the road's reflection out in the distance; ridged, domain-warped mountains on a dense smooth-shaded grid with slope shading, under a sky dome that hazes at the horizon), a canyon seen from above with the river on its floor lighting the walls and running off into the dark, columns of light out of the ground, open ground with a pass the rivers thread, a massif the rivers come down off, and the yard the home page opens on — the neon P on its stand, a settlement of lights. Every place is smooth, warped, ridged ground under a sky dome, each in its own night (`NIGHT` in environments.ts: olive, teal, ochre, cold, the hero's warmth). All of them are the hero's ground re-shaped (`scene/landscape.ts`: a height function on the mesh — `smooth` with a near-biased grid everywhere on this page; the facets remain available for the hero's own language) with the hero's palette, mark, stand, motes and dust; the rivers are `scene/streams.ts` (curves baked into a float texture, closed-form flow, one draw call). The home hero's ripple (`Hero/scene/rippleTransition`) hands over between places: the place being left is driven forward — out of the valley a long ride down the stream, the camera following the road's bends low over the water — then the sweep, and the next place is found still moving; how much of each step is travel and how long it takes is `scene/pacing.ts`, shared with the choreography. `ServicesChoreo` makes every wheel notch, swipe or arrow key move the page exactly one chapter through Lenis with `lock`, so a statement is never half in the frame — inside the section only: past the last chapter the page scrolls as pages do, into the footer and back; chapters are one screen each, statements bottom-right like the hero's second copy, arriving with `RevealText`/`Copy`/`Reveal`. Shape from `docs/reference/hubtown-teardown.md`; copy from `docs/content/en/services-index.md`. |
| `src/sections/Contact`            | THE LIVE PAGE'S WORDS, OUR ARRANGEMENT. Two columns on the stage's dark ground: the heading and lead poleum.com opens with, then the three emails, two telephones, the office and a directions link (all from `lib/site` `CONTACT`); the form in a cream chamfered panel on the right, stacking below `lg`. `ContactForm` is the client island: validation on blur and submit mirroring `lib/contact/schema.ts` (name ≥ 2, email, message ≥ 20, phone optional, a honeypot off-screen), a POST to `/api/contact`, sent / failed / rate-limited states in live regions. Copy from `docs/content/en/contact.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `src/sections/Legal`              | ONE COMPONENT, THREE DOCUMENTS. `LegalPage` renders a document from `src/content/legal.ts` — typed blocks (paragraph, list, facts, table, the cookie-settings control) in sections with ids — under the room's dark band (title, effective date, the three documents as a switch with `aria-current`), beside a sticky rail of the document's contents and the company. Legal text is English on both locales with a notice on the Turkish page. Privacy policy and imprint verbatim from poleum.com; the cookie notice ours (open items 14–15 in `docs/content/README.md`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `src/components/ui/CookieConsent` | CONSENT, NOT A NUDGE. A cream chamfered panel bottom-left (clear of the menu bar on phones): accept and reject the same button side by side, categories behind "Manage choices" with analytics off, the choice kept a year under `poleum.cookieConsent.v1` (`consent.ts`), a `cookie-consent` event for anything that must wait for it, `cookie-consent:open` to bring it back (the footer link, the cookie policy). Reads storage as an external store so a returning visitor never sees it. Nothing loads on consent today — see README open item 15.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `src/sections/About`              | A STANDING SCENE, one viewport tall — no scrub, no chapters, nothing crossfading. A turned WARM room (`--color-stage-room`, the first stage on the site that is not one of the page's three airs) with one lamp, a visible shaft, and a pane of cold smoked glass hanging in it, bowed. The mote field is seeded on quantised spherical shells around the LAMP and drifts radially outward from it — the home hero's field, same lifecycle and same envelope. **Everything written on the pane is drawn into its texture** by `scene/print.ts` — the wordmark from the same `WORDMARK` paths the logo and the home hero use, the heading and statement as canvas text — so the writing bends with the sheet and takes the lamp's falloff; the same words stay in the document visually hidden, because text in a texture is invisible to a screen reader and a crawler. Where the pane sits is declared once in CSS (`--sheet-w`, `[data-sheet-box]`) and read by the renderer and by the no-WebGL fallback, which paints the same pane; the fallback is on by default and removed by the `.js` class at first paint. **THE RENDER LOOP IS NEVER CANCELLED while mounted** — it runs and skips the work behind `inView`/`tabVisible` flags, exactly as HeroScene does. Cancelling and restarting it leaves the canvas holding a buffer the browser may have cleared, and compositing that is a whole blank frame; it was reported as flickering and a recording of it is what identified it. Three other things were also flicker, each noted where it was fixed: sub-pixel motes popping (`floorPx`), the etching minified with mipmaps off (`scene/print.ts`), and no multisampling in the composer's own target (`RoomScene`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `src/sections/WhoWeAre`           | THE LAYOUT IS OFF A REFERENCE, THE REST IS OURS. Four blocks on the same twelve columns, between Intro and What We Do: a hairline row of four micro marks (kicker · one small sentence · a measured rule · the year, derived like the footer's copyright so it is a dateline and not a founding claim), a statement against four checked capabilities and a link to `/about`, a wide media frame with a short blurb beside it, and a footer of four columns divided by vertical rules that carry a slow accent pulse. Motion is the shared wrappers only — `Copy` for every string that animates, the About chapters' line-by-line mask — plus that pulse, which is pure CSS and off under reduced motion. THE MEDIA IS SCRUBBED BY THE READER (`SeedGrowth.tsx`): eight seconds of a cereal plant growing inside a translucent slab, mapped onto the block's passage up the window, so the plant grows because you scrolled and stops when you do. The clip is fetched only within a screen of the viewport, and a reader who asked for no motion or set Save-Data never fetches it at all - they get the closing still. It is blended into the page with `mix-blend-mode: multiply`, because the artwork is an object on white and the white is not wanted: that is why it is NOT wrapped in `Reveal` (an inline transform makes a stacking context and a blend stops at one) and why the box clips a pixel on every side (a blended layer landing on a fractional boundary gets a hard black seam painted down its edge). The box gets taller as the column narrows, cropping the empty sides rather than shrinking the stone to fit them. Copy is ours in both languages and the artwork is generated, none of it approved — open item 18 in `docs/content/README.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
