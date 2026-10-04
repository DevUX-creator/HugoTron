# Performance, especially on phones

The site carries several real-time scenes (the home world, category courtyards, the wholesale
palace, the private-label room, the delivery map). They stay usable on phones because of a few
rules every scene follows, and because phones get lighter versions of the heaviest effects.

## Rules every scene follows

- **One scene renders at a time.** Scenes stop drawing when offscreen, covered or in a hidden
  tab, and stop decoding video they are not showing.
- **Load late.** Three.js scenes are dynamically imported after the page mounts; later films,
  engraved videos and the footer cube are created only when approached.
- **Release on leave.** Geometry, textures, render targets, observers and listeners are
  disposed on unmount, and the WebGL context is explicitly lost.
- **Cap the pixels.** Device pixel ratio is capped at 1.25 on phones and 1.5 on desktop.
  Phones get smaller models, textures and video files (`*-mobile.*`).
- **Settle.** Scenes render at 30 fps when nothing moves and up to 60 during interaction; the
  delivery map's frame loop sleeps once the van and camera stop.
- **No per-frame DOM churn.** Scroll handlers write only values that changed and never read
  layout between writes. Diagnostic attributes update at most four times a second.
- **Fallbacks.** Reduced motion, failed WebGL and disabled JavaScript all leave readable copy
  and working links in normal document flow.

## Phone-specific versions

| Where                  | Desktop                                                  | Phones (< 48rem)                                                       |
| ---------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| Home: 3D world → paper | full-screen WebGL paper front (`useToneFill`, fbm noise) | one torn-paper sheet (`.daylight__sheet`) moved with `translate` only  |
| Home: flying copy      | letters move, fade and blur                              | letters move and fade, no per-letter blur filter                       |
| Home: paper story      | pinned engraving plane, line, Hamburg film               | five composed chapters (`MobileStory`), no live filters or film shader |
| Footer                 | tear-open reveal                                         | finished opening shown, no reveal field                                |
| Product rail           | bounded mouse glide                                      | native touch scrolling, no snap correction                             |

The torn sheet uses `public/textures/paper-torn-edge.svg` as a mask on a flat paper colour, so
the compositor moves it without repainting. Its position follows the shader's mapping
(`1.02 − progress × 1.14`), so the header still turns light at the same moment as on desktop.

## Measurements (4 October 2026)

Production build, Chromium with the Metal GPU, Pixel 7 emulation, 4× CPU throttling. A
desktop GPU flatters every number; the structural wins (fewer full-screen shaders, fewer
filtered layers) are what matter on real phones.

| Page                     | p95 frame | Frames > 34 ms | WebGL contexts while scrolling       |
| ------------------------ | --------: | -------------: | ------------------------------------ |
| Home, 3D → paper handoff |     33 ms |            2–3 | 1 (was 2 before the torn sheet)      |
| Products                 |     16 ms |              1 | 1 (footer cube)                      |
| Rice, nuts categories    |     16 ms |            1–2 | not counted (one courtyard renderer) |
| Wholesale palace         |     16 ms |              0 | 1                                    |
| Private label room       |     16 ms |              0 | 1                                    |

Earlier mobile-story rewrite (3 October): about 50 % less main-thread task time, 75 % less style
recalculation and 96 % fewer DOM mutations over the same journey; 16 live filtered story
images reduced to 0.

Earlier memory checks (1–2 October): live JS heap stayed between 10 and 12.6 MiB through the
whole home on desktop and phone emulation, GPU resource counts stayed constant while idle, and
three trips to the catalogue and back released every old scene and video. Video effects upload
frames only when a new frame is decoded (`requestVideoFrameCallback`), about 23–29 per second
instead of 60.

Known cost: each page loads in one 1–2 s block at 4× throttling (about 0.3–0.6 s on a real
phone), mostly hydration. The full translation file (~15 KB compressed) is sent with every
page; scoping messages per client component would trim it.

## Checks

Run against a production build, not `pnpm dev`:

```sh
pnpm build && pnpm exec next start --port 3213
node scripts/check-mobile-home.mjs http://localhost:3213
node scripts/check-mobile-story.mjs http://localhost:3213 [webkit]
node scripts/check-paper-story.mjs http://localhost:3213
node scripts/check-mobile-range.mjs http://localhost:3213 [webkit]
node scripts/check-category-pages.mjs http://localhost:3213 [webkit]
node scripts/check-world-lifecycle.mjs http://localhost:3213
node scripts/check-wholesale.mjs http://localhost:3213 [webkit]
node scripts/check-private-label.mjs http://localhost:3213 [webkit]
node scripts/check-delivery.mjs http://localhost:3213 [webkit]
node scripts/check-delivery-drive.mjs http://localhost:3213 [webkit]
node scripts/profile-paper-scroll.mjs http://localhost:3213 /tmp/paper-scroll.json
```

Headless Chromium renders WebGL in software unless started with
`--use-angle=metal --enable-gpu` (macOS); without them, timings are inflated several times.
Emulation does not reproduce a phone's GPU, thermal limits or memory pressure: check on a
physical iPhone and a mid-range Android before launch.
