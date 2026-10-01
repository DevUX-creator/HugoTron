# Home memory check — 2026-10-01

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
