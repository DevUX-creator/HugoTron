# Design system

Everything below lives in **`src/styles/theme.css`**, inside Tailwind v4's
`@theme` block. That makes each token available two ways:

```css
/* as a utility */
<p class="text-hunter-800 lg:col-6">
/* as a custom property */ .hero__title {
  color: var(--color-hunter-800);
}
```

## The one rule

**No raw hex, and no media query, outside `theme.css`.**

Stylelint enforces both and fails CI. The reference project we modelled this on
declared the same rule in prose and then accumulated 72 hardcoded colours and
fourteen breakpoints against a declared four. Prose does not hold; a lint rule
does.

## The chamfer

One shape, three scales. A corner cut away on the diagonal — on buttons
(`--chamfer-cut`), on small controls (`--chamfer-cut-sm`), and on whole panels
(`--chamfer-cut-lg`, via the `.notch` utility in `globals.css`).

`.notch` ships two implementations. `polygon()` can only draw straight edges,
so it gives the cut sharp points and leans on `border-radius` for the other
three corners; where `clip-path: shape()` is supported the whole outline is
drawn in one path, so the cut gets a small bevel at each end
(`--chamfer-joint`) and meets the radius cleanly. `.notch--br` cuts the
bottom-right corner instead — the one the buttons cut.

A notch is only visible where the panel differs from its ground, so give it a
surface: on the page's own `--color-bg-base` there is no shape to see.

## Colour

Five ramps (50–900) generated in **OKLCH**, so lightness steps are perceptually
even rather than eyeballed. Each brand anchor is pinned verbatim to its nearest
step, and `tests/tokens.test.ts` fails if one drifts.

| Ramp     | Anchor                      | Step | Role                                                   |
| -------- | --------------------------- | ---- | ------------------------------------------------------ |
| `hunter` | `#3A4A3F` Dark Hunter Green | 800  | Primary brand green — headings, dark surfaces          |
| `lime`   | `#91A673` Luscious Lime     | 400  | Living accent — highlights, active states              |
| `sand`   | `#AE8F60` Wet Sand          | 500  | Warm counterweight                                     |
| `sand`   | `#D4B26D` legacy brand gold | 400  | Carried over so the old identity is still recognisable |
| `bokara` | `#2A2725` Bokara Grey       | 900  | Body text, borders, inverse ground                     |
| `cream`  | `#F6F2F1` Bright White      | 50   | Page ground — warm, never clinical                     |
| `cream`  | `#EAE2D3` Whisper White     | 200  | Raised surface                                         |

### Always use the semantic alias, never the ramp step

```css
color: var(--color-fg-primary); /* ✅ */
color: var(--color-bokara-900); /* ❌ — breaks <Section inverse> */
```

This indirection is what lets `<Section inverse>` flip an entire subtree to the
dark palette by re-pointing the semantic tokens in one place
(`src/components/ui/section.css`). Every child rule keeps working untouched.

### Contrast

`tests/tokens.test.ts` asserts WCAG AA for every foreground/background pair in
use. It has caught two: `--color-fg-tertiary` originally mapped to
`bokara-500`, which measures **2.97:1** on the cream ground — under even the
3:1 floor for large text — and was moved to `bokara-600`; and that step, as the
generated ramp gave it (`#736f6d`), measured **4.47:1**, three hundredths under
the 4.5:1 that tertiary text needs because it is _small_ text — eyebrows,
footer labels, the language switch. `bokara-600` is now `#6d6967` (4.89:1),
still a clear step lighter than `bokara-700`. Do not "fix" a failure by
lowering the threshold.

Text that is faded with `opacity` counts at its faded colour. The footer's
sponsor credit held the whole block at 82% for the logo's sake and took its
label down to 3.2:1 with it; the opacity now sits on the logo alone.

The browser chrome — `theme-color`, the manifest's colours — takes the same
four stage greens the stylesheet paints, from `src/styles/surfaces.ts`, and the
same test holds that file to `theme.css`. A page declares the colour of its
first viewport; `HeaderTheme` moves the tint to the cream whenever the band
under it is light.

### Organic gradient meshes

`--mesh-hero`, `--mesh-soft`, `--mesh-inverse` (defined under `:root`, below the
`@theme` block) hold the soft green blooms from the reference feel. Sections use
these; they do not hand-roll radial gradients.

## Typography

Two families, strictly separated.

|                  | Family           | Used for                     |
| ---------------- | ---------------- | ---------------------------- |
| `--font-display` | **Nasalization** | Titles **only**              |
| `--font-sans`    | **Open Sans**    | Body, UI, captions, numerals |

### Nasalization has exactly one weight

This is a constraint to design within, not a gap to work around.

- **Never set `font-weight` on display text.** There is nothing to switch to.
  `font-synthesis: none` in `globals.css` stops the browser faking a bold.
- Hierarchy comes from **size, letter-spacing and case**.
- It is a wide face, so large sizes take negative tracking
  (`--tracking-display: -0.015em`).
- Verified: 758 mapped glyphs including the full Turkish set
  (ş Ş ğ Ğ ı İ ç Ç ö Ö ü Ü). Turkish headlines render in brand.

Open Sans is loaded with `subsets: ["latin", "latin-ext"]`. **`latin-ext` is
required** — the Turkish ğ, ı, İ, ş live there, and dropping it makes a
sentence fall back to a system face mid-word.

### Scale

`--text-hero-xl` → `--text-eyebrow`, all fluid `clamp()`. Minimums are lower
than the outgoing site's on purpose: Nasalization is wide and Turkish runs
longer, so the old 4rem floor overflowed on a 320px screen.

Use `<Heading as={n} size="...">`. `as` sets the document outline, `size` sets
the look — they are independent, so a section's second heading can be visually
large without becoming an `<h1>`.

### Turkish length

**Turkish runs roughly 15–25% longer than English.** Every section must be
checked at **320px in Turkish** before it is considered done. This is the single
most common way a layout breaks here.

## Spacing and rhythm

Three tiers, and a hard rule that they are never inverted:

```
--gap-block  <  --gap-section-header  <  --gap-section
```

`tests/tokens.test.ts` asserts the ordering. `.section` owns block padding —
a section component must not add its own top/bottom padding.

## Grid

A real 12-column system in `src/styles/grid.css`: `.grid-12` with `.col-*`,
`.col-md-*`, `.col-lg-*` spans, plus `.container`, `.container-wide`,
`.container-text`, `.container-fluid`.

Reach for a bespoke `grid-template-columns` only when the layout genuinely is
not columnar — not as the default.

## Breakpoints

Mobile-first `min-width`, defined only in `@theme`:

|       |       |        |
| ----- | ----- | ------ |
| `xs`  | 30rem | 480px  |
| `sm`  | 40rem | 640px  |
| `md`  | 48rem | 768px  |
| `lg`  | 64rem | 1024px |
| `xl`  | 80rem | 1280px |
| `2xl` | 90rem | 1440px |

## Motion vocabulary

A closed set: `--ease-standard`, `--ease-decelerate`, `--ease-accelerate`,
`--ease-quint`, `--ease-organic`; `--duration-fast|base|slow|reveal`.
Sections pick from these rather than inventing per-component curves.
