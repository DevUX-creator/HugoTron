# Contributing

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Node version comes from `.nvmrc` (24). pnpm 10. No credentials are needed for
local development — the contact form defaults to the `console` provider.

## Before you push

```bash
pnpm verify   # typecheck → lint → stylelint → test → build
```

This is exactly what CI runs. If it passes locally it passes there.

## Branching and commits

- Branch off `main`: `feat/hero-section`, `fix/tr-overflow`, `docs/animation`.
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- One section per pull request. This project is built section by section
  precisely so reviews stay small.

## Definition of done

A section is not done until every one of these is true.

**Correctness**

- [ ] `pnpm verify` passes.
- [ ] No raw hex, no ad-hoc media query (Stylelint will tell you).
- [ ] No `font-weight` on display type.

**Bilingual**

- [ ] Every string comes from `messages/` — none hardcoded in JSX.
- [ ] Both locales render.
- [ ] **Checked at 320px in Turkish.** This is where layouts break.

**Motion**

- [ ] Animations come from the `--ease-*` / `--duration-*` vocabulary.
- [ ] Content is visible and correct under `prefers-reduced-motion`.
- [ ] Content is visible with JavaScript disabled.

**Accessibility**

- [ ] Heading level is semantically right (`as` independent of `size`).
- [ ] Images have meaningful `alt`; decorative ones have `alt=""`.
- [ ] Interactive elements are real `<button>`/`<a>`, keyboard reachable.
- [ ] Overlays trap focus and set `role="dialog"` + `aria-modal`.
- [ ] Focus is visible against the section's background.

**Assets**

- [ ] `next/image` everywhere; within the budgets in [ASSETS.md](ASSETS.md).
- [ ] Masters in `raw/`, delivery files in `public/`.

## Reviewing

Check the things the tooling cannot: is the copy real or invented, is the
heading hierarchy honest, does the Turkish read natively, and does the motion
serve the content rather than decorate it.
