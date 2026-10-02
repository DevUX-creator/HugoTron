/** Run against a production preview: node scripts/check-world-lifecycle.mjs http://localhost:3213 */
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({
  args: ["--enable-gpu", "--use-angle=metal", "--enable-unsafe-swiftshader"],
});
const context = await browser.newContext({ viewport: { width: 1512, height: 982 } });

// Store counters and weak references only: the probe must not retain scenes or media itself.
await context.addInitScript(() => {
  const probe = (window.worldLifecycle = {
    liveContexts: 0,
    duplicateFrames: 0,
    portalDraws: 0,
    videos: [],
  });
  const contexts = new WeakSet();
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (...args) {
    const gl = getContext.apply(this, args);
    if (gl && args[0].startsWith("webgl") && !contexts.has(gl)) {
      contexts.add(gl);
      probe.liveContexts++;
      this.addEventListener("webglcontextlost", () => probe.liveContexts--, { once: true });
      for (const method of [
        "drawElements",
        "drawArrays",
        "drawElementsInstanced",
        "drawArraysInstanced",
      ]) {
        if (!gl[method]) continue;
        const draw = gl[method].bind(gl);
        gl[method] = (...params) => {
          if (this.closest(".paper-portal__canvas")) probe.portalDraws++;
          return draw(...params);
        };
      }
    }

    return gl;
  };
  const create = document.createElement.bind(document);
  document.createElement = function (tag, ...args) {
    const element = create(tag, ...args);
    if (tag === "video") probe.videos.push(new WeakRef(element));
    return element;
  };
  const request = requestAnimationFrame;
  const cancel = cancelAnimationFrame;
  const counts = new WeakMap();
  const requests = new Map();
  window.requestAnimationFrame = (callback) => {
    let count = counts.get(callback);
    if (!count) counts.set(callback, (count = { pending: 0 }));
    if (++count.pending > 1) probe.duplicateFrames++;
    const id = request((time) => {
      requests.delete(id);
      count.pending--;
      callback(time);
    });
    requests.set(id, count);
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    const count = requests.get(id);
    if (count) count.pending--;
    requests.delete(id);
    cancel(id);
  };
});

const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const ready = () =>
  page.waitForFunction(() => document.querySelector(".world-journey")?.dataset.status === "ready");
const released = () =>
  page.waitForFunction(() => {
    const probe = window.worldLifecycle;
    return (
      probe.liveContexts === 0 &&
      probe.videos.every((ref) => {
        const video = ref.deref();
        return !video || (video.paused && !video.getAttribute("src"));
      })
    );
  });

try {
  await page.goto(`${base}/en`);
  await ready();
  await page.waitForTimeout(3500);
  // The story may have its own film/engraving contexts. Their count must stay
  // stable across visits; the footer adds exactly one, including its paper mask.
  const homeContexts = await page.evaluate(() => window.worldLifecycle.liveContexts);
  assert.ok(homeContexts >= 2);
  for (let cycle = 0; cycle < 3; cycle++) {
    // Decode all three films before teardown, including the ones that are now paused.
    for (let film = 0; film < 3; film++) {
      await page.evaluate((index) => {
        const h = document.querySelector(".world__visual").clientHeight;
        scrollTo(0, h * (1.55 + 0.95 * index));
      }, film);
      await page.waitForFunction((index) => {
        const scene = document.querySelector(".world__scene").dataset;
        return Number(scene.film) === index && scene.filmsPlaying === "1";
      }, film);
      await page.waitForTimeout(500);
    }
    // The harbour film decodes only inside its own chapter.
    await page
      .locator(".paper-hamburg")
      .evaluate((e) => scrollTo(0, e.getBoundingClientRect().top + scrollY));
    await page.waitForFunction(() => {
      const video = document.querySelector(".story-harbour-film video");
      return video?.readyState >= 2 && !video.paused;
    });
    await page
      .locator(".paper-contact")
      .evaluate((e) => scrollTo(0, e.getBoundingClientRect().top + scrollY));
    await page.waitForFunction(
      () => document.querySelector(".paper-portal")?.dataset.ready === "true",
    );
    assert.equal(
      await page.locator(".paper-portal").getAttribute("data-cube"),
      "Hugo_core_cube",
      "footer must use the current hero cube",
    );
    assert.ok(
      await page.locator(".paper-portal__canvas").evaluate((host) => {
        const canvas = host.querySelector("canvas");
        return canvas.width >= host.clientWidth && canvas.height >= host.clientHeight;
      }),
      "footer render buffer must match the revealed scene, not its starting mask",
    );
    await page.waitForFunction(
      (expected) =>
        window.worldLifecycle.liveContexts === expected && window.worldLifecycle.portalDraws > 0,
      homeContexts + 1,
    );
    assert.equal(await page.locator(".paper-portal").getAttribute("data-paper-reveal"), "true");
    assert.ok(await page.locator(".story-harbour-film video").evaluate((v) => v.paused));
    await page
      .locator(".paper-buying")
      .evaluate((e) => scrollTo(0, e.getBoundingClientRect().top + scrollY));
    await page.waitForTimeout(300);
    const draws = await page.evaluate(() => window.worldLifecycle.portalDraws);
    await page.waitForTimeout(500);
    assert.equal(
      await page.evaluate(() => window.worldLifecycle.portalDraws),
      draws,
      "offscreen footer must stop drawing",
    );
    assert.equal(await page.evaluate(() => window.worldLifecycle.duplicateFrames), 0);
    await page.evaluate(() => scrollTo(0, 0));
    await page.locator(".world__cta a").click();
    await page.waitForURL("**/en/products");
    await released();
    assert.equal(await page.locator(".world__scene canvas").count(), 0);
    await page.goBack();
    await ready();
    await page.waitForFunction(
      (expected) => window.worldLifecycle.liveContexts === expected,
      homeContexts,
    );
    assert.equal(await page.evaluate(() => window.worldLifecycle.liveContexts), homeContexts);
  }

  // Aborting while the model is loading must release the loading atmosphere too.
  await page.route("**/models/world/*.glb", () => {});
  await page.reload();
  await page.waitForFunction(
    (expected) => window.worldLifecycle.liveContexts === expected,
    homeContexts,
  );
  await page.locator(".header__links a").first().click();
  await page.waitForURL("**/en/products");
  await released();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: one frame loop, three film/harbour/footer/navigation cycles, offscreen pause, all GPU and media release, loading cancellation",
  );
} finally {
  await browser.close();
}
