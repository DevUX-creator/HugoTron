# Home memory check — 2026-10-02

## Current whole-home profile

Production Chromium checks on macOS covered desktop (1512 × 982, DPR 2) and
mobile emulation (390 × 844, DPR 3). Each spent 30 seconds on the hero, final
3D film, Hamburg engraving, range engraving and footer, then checked offscreen
and hidden-tab pauses and three SPA trips to the catalogue and back.

Live JavaScript heap after explicit garbage collection, in MiB:

| Stage                      | Desktop samples       | Mobile emulation samples |
| -------------------------- | --------------------- | ------------------------ |
| Hero                       | 10.33 → 10.64 → 10.64 | 9.85 → 10.24 → 10.26     |
| Final 3D film              | 10.82 → 10.99 → 10.96 | 10.50 → 10.62 → 10.61    |
| Hamburg film               | 11.68 → 11.69 → 11.70 | 11.35 → 11.35 → 11.36    |
| Range film                 | 11.73 → 11.73 → 11.74 | 11.38 → 11.39 → 11.39    |
| Footer                     | 12.17 → 12.42 → 12.42 | 11.81 → 12.06 → 12.56    |
| Static paper, after footer | 12.35 → 12.35         | 12.01 → 12.01            |

The mobile footer's higher last sample returned to 12.01 MiB in the next paper
chapter. GPU texture, buffer and program counts stayed constant during each
dwell. Initial loading now creates two WebGL contexts; the two engraved films
and footer create theirs only when approached, for at most five. Only the
visible scene or film renders. All five stop drawing when offscreen or hidden;
audio suspends when hidden. Leaving home releases all home contexts and video
sources. No duplicate pending animation callbacks were found.

After three return visits, live heap was 12.07 / 12.55 / 12.59 MiB on desktop
and 11.88 / 12.21 / 12.40 MiB on mobile emulation. Router and module warm-up
retain some memory, but old scenes and video sources were released each time.
These finite checks did not find continuing scene-resource accumulation.

Changes in this review:

- Engraving contexts are created only when a visible video has a decoded frame.
- Video effects use `requestVideoFrameCallback` instead of uploading the same
  frame on every display refresh. A decoded-frame check supports older engines.
  Hamburg uploads fell from about 60/s to 23/s; range uploads now run about 29/s.
  Existing texture storage is updated with `texSubImage2D`.
- Playback and rendering stop on pause, visibility changes and unmount. A late
  Hamburg `play()` promise cannot restart an offscreen video.
- Mobile loading covers the first scene until model, textures and shader
  compilation finish, with the existing 20-second fallback. Sound still follows
  browser autoplay/gesture rules; later films and the footer remain lazy.
- The paper line measures normal layout height, not its own scroll overflow.
  Repeated viewport shrinking previously retained about 650 px below the footer.
- Paper scroll progress uses the same small-viewport height as its CSS runway.
  The paper shader uses high precision to avoid mobile pixel-noise overflow,
  and falls back to a plain wipe if compilation fails.

This is **live JS heap, not total tab RAM or GPU memory**. Browser buffers,
decoded images/video, graphics targets and caches add to the real footprint.
Active 3D remains GPU work. Mobile emulation and WebKit on macOS do not establish
frame rate, thermal behaviour or memory limits on physical iOS/Android phones.

Reproduce against a production preview:

```sh
pnpm build
pnpm exec next start --hostname localhost --port 3213
# In separate terminals after the preview is ready:
node scripts/profile-home-resources.mjs http://localhost:3213 30
node scripts/profile-home-resources.mjs http://localhost:3213 30 mobile
node scripts/check-mobile-home.mjs http://localhost:3213
node scripts/check-mobile-home.mjs http://localhost:3213 webkit
```

Resource reports are written to `/tmp/hugo-home-resources-{desktop,mobile}.json`.
The mobile regression covers loading, hero/category controls, an actual Chromium
touch swipe, reversible paper handoff, toolbar/viewport changes, the page ending,
full-width footer, and the narrower German layout. WebKit covers the same layout
and rendering path; automated native touch swiping is tested through Chromium CDP.

### Follow-up mobile layout and compositing checks

The mobile story now keeps its initial small viewport height until the screen
width changes. In-app browsers can resize even `svh` as their bars move; allowing
that to reflow every long chapter compounded the movement into visible jumps.
The regression repeatedly changes height around Hamburg and verifies unchanged
chapter positions, document height and scroll position. Width/orientation changes
still remeasure the page; the viewport override is removed when home unmounts.

The paper wipe now uses explicitly premultiplied output and discards uncovered
pixels, keeping both their RGB and alpha at zero. Chromium and WebKit checks read
those pixels during forward and reverse handoff to catch the pale overlay seen
on mobile. The footer retains its torn outline at full reveal on phones.
The mobile regression also covers the menu, shared CTA sizes, reduced noise and
buying a selected rice pack from the hero. These changes add no recurring frame loop.

## Earlier scene lifecycle review — 2026-10-01

The production home was profiled in Chromium on macOS at 1512 × 982, device
scale factor 2 (the scene caps rendering at 1.5). Measurements covered an idle
hero, all three films, a minute of looping video, and three SPA trips to the
catalogue and back. Heap samples were taken after explicit garbage collection;
these are **live JavaScript heap**, not total browser or GPU memory.

## Findings and changes

- Idle hero and video playback did not show continuously growing WebGL texture,
  buffer, or program counts. The hero used 35 textures; visiting all three films
  brought that to 42 and it stayed there.
- Model readiness called `render()` directly while the loading atmosphere already
  had a pending animation frame. That overwrote the pending handle and created
  two recurring frame chains. Readiness now wakes the existing scheduler only.
- Teardown removed the canvas and disposed application resources, but left its
  WebGL context and internal rendering resources alive until browser cleanup.
  Teardown now explicitly loses the context after disposal. After three return
  visits, the probe observed three released contexts and one active context.
- Thirty diagnostic DOM attributes were rewritten every rendered frame. They
  now update at most four times a second and only when their values change.
  Reduced-motion renders publish immediately; animation uniforms and UI progress
  callbacks still update at their original cadence.

The retest held around 9.6–9.7 MiB live heap on the idle hero and 10.0–10.1 MiB
with the final film looping (one transient 10.5 MiB sample returned to 10.1).
GPU resource counts remained constant during both idle intervals. This is a
short desktop profile, not a guarantee for every browser or low-memory phone.
Process resident memory also includes rendering buffers, decoded media, browser
caches and allocator reserves; it does not equal the live JavaScript heap.

## Regression check

Run against a local production build for consistent results:

```sh
pnpm build
pnpm exec next start --hostname localhost --port 3213
# In a separate terminal:
node scripts/check-world-lifecycle.mjs http://localhost:3213
```

The browser check instruments frame scheduling, WebGL context release and weak
video references without retaining scenes. It visits all three films on each of
three home/catalogue cycles and also navigates away during model loading. It
asserts that no callback has duplicate pending frames, no old context stays
active, and old videos are paused with their sources removed. It also checks
for uncaught page errors. Run it again after changes to scene loading, disposal
or video ownership.

## Paper story continuation

The paper chapter now owns a second, small WebGL context for the textured wipe.
It draws only when progress or viewport size changes, with pixel ratio capped
at 1.25; the illustrations and packaging do not introduce another Three.js scene.
Both graphics contexts are explicitly released on route changes. The wipe owns
a fresh canvas per effect setup so React Strict Mode does not reuse a lost context.

A production browser regression confirmed that the World renderer makes no draw
calls once the paper fully covers it, its films pause, and rendering resumes on
reverse scroll. Three complete film/catalogue/return cycles released both
contexts and the old video sources each time. The earlier heap figures above
belong to the earlier scene profile; they are not a new whole-page memory measurement.

The complementary story check is:

```sh
node scripts/check-paper-story.mjs http://localhost:3213
```

It checks the persistent identity, handoff, covered renderer and media, cart,
private-label enquiry purpose, English/German mobile views, reduced motion,
no-JavaScript text and no-WebGL fallback.
