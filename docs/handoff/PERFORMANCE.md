# Performance evidence and remaining work

Updated 4 October 2026. These are local production-build measurements, not an SLA or a
physical-device certification. F01/F02 in OPEN-ITEMS remain frontend/DevOps work, not a task
for the backend team to debug blindly.

## What the review verified

- Individual homepage section dwell checks: stable retained JS heap and live GPU resource counts.
- Hidden/offscreen scenes stop drawing, inactive video stops, hidden-tab audio suspends.
- Leaving home releases its GPU contexts; only the currently visible film plays.
- Mobile Chromium navigation/page-load checks across ten main routes found no JS page errors,
  failed assets or horizontal overflow in those tested states.
- At 3 Mbps download and 80 ms latency, a cold 390×844 mobile emulation transferred about
  3.77 MiB. Main-content LCP was about 1.38 seconds; the world reported ready after 11.8 seconds.
  This used a local production server and a desktop GPU, not a real phone/CDN.

Do not translate desktop CPU throttling into an asserted real-phone timing. A preloader
controls presentation, not transfer, decoding or GPU cost. Measure deployed CDN caching,
physical iPhone/Android behavior, thermal pressure and repeated navigation.

## Open: retained DOM/images across navigation (F01)

Ten home → catalogue → home cycles increased post-GC JS heap from approximately 11 to 17 MiB;
DOM nodes from approximately 2,100 to 7,200; listeners also rose. GPU contexts were released,
so correct Three.js cleanup alone does not resolve this. Reproduced after patching Next.js to
16.3.6 in an isolated production build.

A heap snapshot's retaining path included Chromium's `MediaQueryMatcher` → responsive-image
`ViewportChangeListener` → detached lazy product images → detached catalogue grid. This is
an investigation lead, **not proof of a single root cause**. A trial per-image ref cleanup did
not fix it and was removed. Do not work around this by eagerly loading every image without
measuring the resulting mobile download cost.

Next frontend steps: reproduce in current Chromium and WebKit without probe instrumentation;
compare lazy responsive-image retention with framework cache behavior; inspect DOM/React/GSAP
retainers; test rapid navigation and filters. Fix only with a measured plateau after warmup
and unchanged visual/loading behavior. Record browser version and device with the result.

The resource script previously checked per-section dwell and GPU cleanup but did not assert
cross-navigation heap/DOM growth. It now runs ten cycles and checks retained heap, nodes and
listeners after warmup. **This is an open failing acceptance check**, not a green launch gate.
An intermittent duplicate animation-callback assertion also occurred in one desktop run and
was absent on follow-up; keep this in lifecycle testing.

## Reproduction

```sh
pnpm build
pnpm exec next start --hostname localhost --port 3213
# In another terminal:
node scripts/profile-home-resources.mjs http://localhost:3213 15 mobile /tmp/hugo-mobile-resources.json
node scripts/profile-home-resources.mjs http://localhost:3213 15 desktop /tmp/hugo-desktop-resources.json
node scripts/check-world-lifecycle.mjs http://localhost:3213
node scripts/check-mobile-home.mjs http://localhost:3213
node scripts/check-mobile-cube.mjs http://localhost:3213
node scripts/check-mobile-story.mjs http://localhost:3213 webkit
node scripts/check-mobile-range.mjs http://localhost:3213 webkit
node scripts/check-category-pages.mjs http://localhost:3213 webkit
node scripts/check-wholesale.mjs http://localhost:3213 webkit
node scripts/check-private-label.mjs http://localhost:3213 webkit
node scripts/check-delivery-drive.mjs http://localhost:3213 webkit
```

Use a fresh production build and browser context. Do not rebuild `.next` while a server uses
it; use an isolated checkout/output. The resource script requests macOS Metal; other platforms
may use software WebGL and should not be compared directly for frame timings. JS heap figures
do not include all decoded media/GPU/process memory.

## Preserve existing performance controls

Mobile scene assets/DPR caps, lazy scene imports, offscreen/visibility pause, reduced-motion
fallbacks, one active film, decoded-frame-driven video uploads and renderer/material disposal
are already part of the app. Desktop paper effects and phone story composition intentionally
differ. Catalogue/commerce pages do not need Three.js. Original media masters live in
`assets-src/`, outside served `public/`.

Mobile cube quality update, 6 October: the home hero uses up to 2× DPR while the cube is
visible, capped at 1.8 million drawing-buffer pixels. Product selection and the flight return
to the 1.25× cap; desktop stays at 1.5×. The cube's surfaces are protected from the mobile
depth blur and most haze; the entrance focus pull and background atmosphere remain. This
increases hero pixel work relative to the 4 October measurements above, without adding a
render pass. `check-mobile-cube.mjs` checks quality transitions, shader errors and a plateau
in live GPU resources across repeat scrolls. Physical-device thermal/frame checks remain required.

Phones (`width < 48rem`) deliberately skip the heaviest motion: the World → paper hand-off is a
static torn sheet moved with `translate` (no full-screen shader); the home's video sheets swap
and leave by crossfading in place (no flight, bend or flex); `.flies` copy only fades (no
per-letter movement or blur); product rails have no reveal. The footer opening redraws in the
same frame when it resizes, so toolbar-driven resizes cannot show an empty frame.

Before launch: set cold-load and interaction budgets, test 20+ minute sessions on real devices,
record dropped frames and memory plateaus, and verify readable fallback content if WebGL/media
fails. Keep contact/catalogue navigation usable while scene assets load.
