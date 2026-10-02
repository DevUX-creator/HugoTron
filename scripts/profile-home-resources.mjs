/** Production resource soak: node scripts/profile-home-resources.mjs http://localhost:3213 45 [mobile] */
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3213";
const seconds = Number(process.argv[3] ?? 45);
const mobile = process.argv[4] === "mobile";
const report = process.argv[5] ?? `/tmp/hugo-home-resources-${mobile ? "mobile" : "desktop"}.json`;
const browser = await chromium.launch({
  args: [
    "--enable-gpu",
    "--use-angle=metal",
    "--enable-unsafe-swiftshader",
    "--enable-precise-memory-info",
  ],
});
const context = await browser.newContext({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1512, height: 982 },
  deviceScaleFactor: mobile ? 3 : 2,
  isMobile: mobile,
  hasTouch: mobile,
});
await context.addInitScript(() => {
  const probe = (window.homeResources = {
    contexts: [],
    videos: [],
    audio: [],
    duplicateFrames: 0,
  });
  const seen = new WeakSet();
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (...args) {
    const gl = getContext.apply(this, args);
    if (!gl || !args[0].startsWith("webgl") || seen.has(gl)) return gl;
    seen.add(gl);
    const stats = {
      host: this.parentElement?.className ?? "",
      lost: false,
      draws: 0,
      uploads: 0,
      resources: {},
    };
    probe.contexts.push(stats);
    this.addEventListener(
      "webglcontextlost",
      () => {
        stats.lost = true;
      },
      { once: true },
    );
    for (const kind of [
      "Texture",
      "Buffer",
      "Framebuffer",
      "Renderbuffer",
      "Program",
      "Shader",
      "VertexArray",
    ]) {
      const create = gl["create" + kind]?.bind(gl),
        remove = gl["delete" + kind]?.bind(gl);
      if (!create || !remove) continue;
      const live = new WeakSet();
      stats.resources[kind] = 0;
      gl["create" + kind] = (...params) => {
        const value = create(...params);
        if (value) {
          live.add(value);
          stats.resources[kind]++;
        }
        return value;
      };
      gl["delete" + kind] = (value) => {
        if (value && live.delete(value)) stats.resources[kind]--;
        return remove(value);
      };
    }
    for (const name of [
      "drawElements",
      "drawArrays",
      "drawElementsInstanced",
      "drawArraysInstanced",
    ]) {
      if (!gl[name]) continue;
      const original = gl[name].bind(gl);
      gl[name] = (...params) => {
        stats.draws++;
        return original(...params);
      };
    }
    for (const name of ["texImage2D", "texSubImage2D"]) {
      const original = gl[name].bind(gl);
      gl[name] = (...params) => {
        if (params.some((value) => value instanceof HTMLVideoElement)) stats.uploads++;
        return original(...params);
      };
    }
    return gl;
  };
  const seenVideos = new WeakSet();
  probe.captureVideos = () => {
    for (const video of document.querySelectorAll("video")) {
      if (!seenVideos.has(video)) {
        seenVideos.add(video);
        probe.videos.push(new WeakRef(video));
      }
    }
  };
  const create = document.createElement.bind(document);
  document.createElement = (tag, ...args) => {
    const result = create(tag, ...args);
    if (tag === "video") {
      seenVideos.add(result);
      probe.videos.push(new WeakRef(result));
    }
    return result;
  };
  if (window.AudioContext) {
    const Original = window.AudioContext;
    window.AudioContext = new Proxy(Original, {
      construct(target, args) {
        const audio = Reflect.construct(target, args);
        probe.audio.push(new WeakRef(audio));
        return audio;
      },
    });
  }
  const request = requestAnimationFrame,
    cancel = cancelAnimationFrame;
  const pending = new Map(),
    counts = new WeakMap();
  window.requestAnimationFrame = (callback) => {
    const count = counts.get(callback) ?? { pending: 0 };
    counts.set(callback, count);
    if (++count.pending > 1) probe.duplicateFrames++;
    const id = request((time) => {
      pending.delete(id);
      count.pending--;
      callback(time);
    });
    pending.set(id, count);
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    const count = pending.get(id);
    if (count) {
      count.pending--;
      pending.delete(id);
    }
    cancel(id);
  };
});
const page = await context.newPage();
const client = await context.newCDPSession(page);
await client.send("Performance.enable");
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const rows = [];
const wait = (ms) => page.waitForTimeout(ms);
const ready = () =>
  page.waitForFunction(() => document.querySelector(".world-journey")?.dataset.status === "ready");
async function sample(label) {
  await client.send("HeapProfiler.collectGarbage");
  const { metrics } = await client.send("Performance.getMetrics");
  const metric = (name) => metrics.find((x) => x.name === name)?.value;
  const state = await page.evaluate(() => {
    const p = window.homeResources;
    p.captureVideos();
    const videos = p.videos.map((ref) => ref.deref()).filter(Boolean);
    return {
      contexts: p.contexts.filter((c) => !c.lost),
      liveVideos: videos.filter((v) => v.getAttribute("src")).length,
      playing: videos.filter((v) => !v.paused).length,
      detachedPlaying: videos.filter((v) => !v.isConnected && !v.paused).length,
      audio: p.audio.map((ref) => ref.deref()?.state).filter(Boolean),
      duplicateFrames: p.duplicateFrames,
      viewportOverflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  const row = {
    label,
    mobile,
    heapMiB: +(metric("JSHeapUsedSize") / 1048576).toFixed(2),
    nodes: metric("Nodes"),
    listeners: metric("JSEventListeners"),
    ...state,
  };
  rows.push(row);
  console.log(
    JSON.stringify({
      label,
      mobile,
      heapMiB: row.heapMiB,
      nodes: row.nodes,
      listeners: row.listeners,
      contexts: state.contexts.length,
      playing: state.playing,
      audio: state.audio,
      draws: state.contexts.map((c) => c.draws),
      uploads: state.contexts.map((c) => c.uploads),
    }),
  );
  assert.equal(state.duplicateFrames, 0);
  assert.equal(state.viewportOverflow, false);
  assert.ok(state.playing <= 1, "Only the current section's film should play");
  return row;
}
async function dwell(label) {
  await wait(3500);
  const first = await sample(label + "-start");
  for (let i = 1; i <= Math.ceil(seconds / 15); i++) {
    await wait(Math.min(15, seconds) * 1000);
    await sample(label + "-" + i);
  }
  const last = rows.at(-1);
  assert.deepEqual(
    last.contexts.map((c) => c.resources),
    first.contexts.map((c) => c.resources),
    label + ": GPU resource counts grew while idle",
  );
  assert.ok(last.heapMiB - first.heapMiB < 5, label + ": retained JS heap grew unexpectedly");
}
async function chapter(selector) {
  await page
    .locator(selector)
    .evaluate((e) => scrollTo(0, e.getBoundingClientRect().top + scrollY));
}
try {
  await page.goto(base + "/en");
  await ready();
  await page.mouse.click(mobile ? 195 : 750, 350);
  await dwell("hero");
  for (let i = 0; i < 3; i++) {
    await page.evaluate(
      (i) => scrollTo(0, document.querySelector(".world__visual").clientHeight * (1.55 + 0.95 * i)),
      i,
    );
    await wait(1500);
  }
  await dwell("world-film");
  await chapter(".paper-hamburg");
  await dwell("harbour");
  await chapter(".paper-range__film");
  await dwell("range-film");
  await chapter(".paper-contact");
  await page.waitForFunction(
    () => document.querySelector(".paper-portal")?.dataset.ready === "true",
  );
  await dwell("footer");
  await chapter(".paper-buying");
  await wait(1500);
  const paused = await sample("paper-static");
  await wait(3000);
  const still = await sample("paper-static-after");
  assert.deepEqual(
    still.contexts.map((c) => c.draws),
    paused.contexts.map((c) => c.draws),
    "Offscreen canvases must stop drawing",
  );
  assert.equal(still.playing, 0);
  // Controlled visibility event exercises application pause behavior independently of
  // Chromium's own background throttling (which would hide a runaway frame loop).
  await chapter(".paper-contact");
  await wait(1000);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await wait(700);
  const hidden = await sample("hidden");
  await wait(2000);
  const hiddenAfter = await sample("hidden-after");
  assert.deepEqual(
    hiddenAfter.contexts.map((c) => c.draws),
    hidden.contexts.map((c) => c.draws),
  );
  assert.equal(hiddenAfter.playing, 0);
  assert.ok(hiddenAfter.audio.every((state) => state !== "running"));
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  for (let cycle = 0; cycle < 3; cycle++) {
    // Installed Next exposes its public App Router here. This bypasses the temporary
    // preview click dialog only, and exercises actual SPA resource disposal.
    await page.evaluate(() => window.next.router.push("/en/products"));
    await page.waitForURL("**/en/products");
    await wait(1200);
    const away = await sample("away-" + cycle);
    assert.equal(away.contexts.length, 0);
    assert.equal(away.liveVideos, 0);
    await page.evaluate(() => window.next.router.push("/en"));
    await ready();
    await wait(3500);
    await sample("return-" + cycle);
    await chapter(".paper-contact");
    await page.waitForFunction(
      () => document.querySelector(".paper-portal")?.dataset.ready === "true",
    );
    await wait(600);
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: stable live heap/GPU counts, offscreen and hidden-tab pause, single active film, three SPA cleanup cycles.",
  );
} finally {
  await writeFile(
    report,
    JSON.stringify({ base, mobile, secondsPerStage: seconds, rows, errors }, null, 2),
  );
  console.log(`Report: ${report}`);
  await browser.close();
}
