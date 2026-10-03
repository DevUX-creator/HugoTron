# Mobile paper story — 3 October 2026

The source-to-Hamburg sequence now uses five composed mobile chapters. Each holds a
title, short note and illustration together, then transitions the complete composition
using opacity and a small vertical translation. Native scrolling remains in control.
Desktop keeps its existing layered illustrations and Hamburg film.

## What was expensive

The previous mobile sequence retained 16 live filtered illustration layers, including
five images wider than the viewport. Its scroll handler repeatedly read individual
chapter bounds between style writes and rewrote unchanged attributes and variables.
The already-completed paper transition also kept writing document-level theme styles.

The new mobile sequence has no live illustration filters, independent illustration
loops or Hamburg video shader. It uses existing transparent WebP illustrations sized
for a phone. Unchanged panel states and story properties are not rewritten. Chapter
positions are measured together when layout changes; the mobile route line is neither
drawn nor updated. The paper handoff stops writing once its progress is unchanged.

## Production comparison

Chromium on macOS, 390 × 844 viewport, DPR 3, 4× CPU throttling. Each sample scrolls
from source to the buying section for six seconds, then returns over six seconds.
The page is loaded and visited through the buying section before measurement. No other
browser checks ran during these samples.

| Measurement                              |   Before |    After |
| ---------------------------------------- | -------: | -------: |
| Main-thread task time                    |   5.65 s |   2.84 s |
| Style recalculation time                 |   2.20 s |   0.50 s |
| Script time                              |   0.78 s |   0.39 s |
| Story attribute/style mutations          |   14,658 |      653 |
| Live filtered story images               |       16 |        0 |
| Story images wider than viewport         |        5 |        0 |
| 95th-percentile animation-frame interval |  16.7 ms |  16.8 ms |
| Frame intervals above 34 ms              |        0 |        0 |
| Source-to-buying scroll distance         | 5,520 px | 4,220 px |

This is about 50% less main-thread task time and 96% fewer DOM mutations in the sampled
journey. It compares the complete old and new experiences, whose scroll distances differ.
Removing only the old image filters and layer motion lowered main-thread task time by
about 18% in an isolation sample; avoiding repeated updates contributes further savings.

The test machine maintained roughly 60 fps before and after. These results demonstrate
less rendering work, not reproduction of the reported phone stutter or a guaranteed
frame rate on physical phones. CPU throttling does not emulate a mobile GPU, thermal
limits or browser memory pressure. This is not a new memory-soak measurement; the earlier
finite resource checks are recorded in [HOME-MEMORY.md](HOME-MEMORY.md).

## Checks and reproduction

The mobile regression covers English at 390 px, German at 320 px, forward and reverse
scrolling, title/illustration fit, toolbar height changes, unloaded desktop media, route
cleanup, reduced motion and no-JavaScript content. The existing paper/home checks cover
the handoff, persistent identity, paused 3D/video, catalogue interaction and footer.

```sh
pnpm build
pnpm exec next start --hostname localhost --port 3213
# After the preview is ready:
node scripts/profile-paper-scroll.mjs http://localhost:3213 /tmp/hugo-paper-scroll.json
node scripts/check-mobile-story.mjs http://localhost:3213
node scripts/check-mobile-story.mjs http://localhost:3213 webkit
node scripts/check-mobile-home.mjs http://localhost:3213
node scripts/check-paper-story.mjs http://localhost:3213
```

The optional fourth argument `isolate` compares CSS filter/layer-motion variants of the
currently checked-out implementation. Reports are local diagnostics, not shipped assets.
