# Tech debt

Known leftovers, kept on purpose for now. Remove or resolve each when its note says.

## Old rice page sections (kept as reference)

Since the category pages replaced the rice page (`/range/rice` renders `CategoryPage`), these
are no longer rendered anywhere:

- `src/sections/Opening/` — the original rice hero ("Direct from growers" / "Every quantity").
- `src/sections/PaperChapter/` — the original paper chapter, except `RangeReveal.tsx` and
  `rangeReveal.css`, which the category pages use.
- `src/components/rice/scene.ts` and its helpers (`grain.ts`, `surface.ts`, `vessel.ts`,
  `motion.ts`, `riceScene.css`), used only by `Opening`. `HomeTheme.tsx`, `homeTheme.css` and
  `themePreference.ts` are still in use.

Keep them as design and code reference while the category pages are built out. When cleaning
up: move `RangeReveal` (and its CSS) into `src/sections/Category/`, then delete the rest and
any messages only they read (e.g. the `paperChapter` namespace; `RangeReveal` and
`FilmPlaylist` still read some of its keys, so check readers first).

## Origins section (unrendered)

`src/sections/Origins/` (with `src/content/origins.ts`, `originsMap.ts` and
`scripts/build-origins-map.py`) is not imported by any page. Wire it into a page or delete it
together with its data and messages.

## Preview gate (unmounted)

`src/components/preview/PreviewGate.tsx` and `previewGate.css` are no longer mounted in
`src/app/[locale]/layout.tsx`. Re-add `<PreviewGate />` there to show the "available on Monday"
modal again, or delete both files once the subpages are public.

## Category page assets

Stand-in engravings and films on the category pages are listed in
`src/content/categoryStories.ts` (every `needs` entry; nuts, spices, saffron, pulses and raw
materials borrow existing films). Replace as final assets and 3D scenes arrive.

## SEO descriptions

Several `category.<slug>.seoDescription` messages run 170–190 characters; trim to about 155
before launch.
