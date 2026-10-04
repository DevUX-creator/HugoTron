/** Visual stations, real links, static fallbacks and renderer ownership for the palace walk. */
import assert from "node:assert/strict";
import { chromium, webkit } from "@playwright/test";
const base = process.argv[2] ?? "http://localhost:3000";
const engine = process.argv[3] ?? "chromium";
const browser = await (engine === "webkit" ? webkit : chromium).launch(
  engine === "webkit"
    ? {}
    : { args: ["--enable-gpu", "--use-angle=metal", "--enable-unsafe-swiftshader"] },
);
const errors = [];
const path = (locale) => (locale === "de" ? "/de/grosshandel" : "/en/wholesale");
const walk = async (page, progress) => {
  await page.evaluate((p) => {
    const hall = document.querySelector(".hall");
    const stage = hall.querySelector(".hall__stage");
    scrollTo(
      0,
      hall.getBoundingClientRect().top + scrollY + p * (hall.offsetHeight - stage.clientHeight),
    );
  }, progress);
  await page.waitForFunction(
    (p) => Math.abs(Number(document.querySelector(".hall__scene")?.dataset.progress) - p) < 0.008,
    progress,
  );
  await page.waitForTimeout(100);
};
try {
  for (const [width, height, locale] of [
    [1440, 1000, "en"],
    [390, 844, "de"],
    [320, 640, "en"],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      isMobile: width < 768,
      hasTouch: width < 768,
    });
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error" && /THREE|Shader|WebGL/.test(m.text())) errors.push(m.text());
    });
    await page.goto(base + path(locale));
    await page.waitForFunction(
      () => document.querySelector(".hall")?.dataset.ready === "true",
      null,
      { timeout: 60000 },
    );
    await page.waitForTimeout(1300);
    assert.equal(await page.locator(".hall .range-product").count(), 0);
    const start = await page.locator(".hall__scene").evaluate((e) => ({ ...e.dataset }));
    for (const [progress, key] of [
      [0, "intro"],
      [0.24, "audience"],
      [0.46, "range"],
      [0.69, "process"],
      [0.91, "door"],
    ]) {
      await walk(page, progress);
      const station = page.locator(`[data-chapter="${key}"]`);
      assert.equal(
        await station.getAttribute("inert"),
        null,
        `${key} reading station is accessible`,
      );
      assert.equal(await page.locator(".hall-chapter:not([inert])").count(), 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
      const bounds = await station.boundingBox();
      const frameBounds = await page.locator(".world__frame").boundingBox();
      assert.ok(
        bounds.y > 135 && bounds.y + bounds.height < frameBounds.y + frameBounds.height - 12,
        `${width} ${key} fits around fixed navigation: ${JSON.stringify(bounds)}`,
      );
      if (key === "range")
        assert.match(
          await station.locator("a").getAttribute("href"),
          locale === "de" ? /\/de\/sortiment$/ : /\/en\/products$/,
        );
      await page.screenshot({ path: `/tmp/hugo-palace-${engine}-${width}-${key}.png` });
    }
    for (const progress of [0.2, 0.7, 0.1, 0.8, 0.2]) await walk(page, progress);
    const end = await page.locator(".hall__scene").evaluate((e) => ({ ...e.dataset }));
    assert.equal(start.textures, end.textures, "textures remain constant across repeat walks");
    assert.equal(
      start.geometries,
      end.geometries,
      "geometry count remains constant across repeat walks",
    );
    assert.ok(Number(end.calls) < 60, `bounded draw calls: ${end.calls}`);
    assert.ok(Number(end.geometries) < 40, `bounded geometry count: ${end.geometries}`);
    // Visibility must suspend the render loop, even while the scene is otherwise in view.
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    const beforeHidden = await page.locator(".hall__scene").getAttribute("data-frames");
    await page.waitForTimeout(300);
    assert.equal(await page.locator(".hall__scene").getAttribute("data-frames"), beforeHidden);
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForFunction(
      (n) => Number(document.querySelector(".hall__scene").dataset.frames) > Number(n),
      beforeHidden,
    );
    await page.evaluate(() => {
      window.hallLost = false;
      document
        .querySelector(".hall canvas")
        .addEventListener("webglcontextlost", () => (window.hallLost = true), { once: true });
    });
    await walk(page, 1);
    await page.waitForTimeout(900);
    assert.ok(page.url().endsWith(path(locale)), "the end of the walk must not navigate");
    const door = Number(await page.locator(".hall__scene").getAttribute("data-door"));
    assert.ok(door > 0.16 && door <= 0.181, "the door stays only slightly open");
    assert.equal(await page.locator('[data-chapter="door"]').getAttribute("inert"), null);
    await page.screenshot({ path: `/tmp/hugo-palace-${engine}-${width}-end.png` });
    const beforeEntering = Number(await page.locator(".hall__scene").getAttribute("data-camera-z"));
    const enterLink = page.locator('[data-chapter="door"] a');
    if (width === 390) await enterLink.press("Enter");
    else await enterLink.click();
    await page.waitForFunction((z) => {
      const scene = document.querySelector(".hall__scene");
      return Number(scene?.dataset.door) > 0.95 && Number(scene?.dataset.cameraZ) < z - 1.2;
    }, beforeEntering);
    assert.ok(page.url().endsWith(path(locale)), "the physical door opens before navigation");
    assert.equal(await enterLink.getAttribute("aria-disabled"), "true");
    assert.equal(
      await page.locator(".door-flood:not(.door-flood--arrival)").getAttribute("data-state"),
      "out",
      "the walk stays visible until the camera reaches the threshold",
    );
    if (width === 1440) {
      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", { configurable: true, value: true });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      const pausedZ = await page.locator(".hall__scene").getAttribute("data-camera-z");
      await page.waitForTimeout(300);
      assert.equal(await page.locator(".hall__scene").getAttribute("data-camera-z"), pausedZ);
      await page.evaluate(() => {
        delete document.hidden;
        document.dispatchEvent(new Event("visibilitychange"));
      });
    }
    // A repeated activation must not restart the walk or schedule another navigation.
    await enterLink.dispatchEvent("click");
    await page.screenshot({ path: `/tmp/hugo-palace-${engine}-${width}-entering.png` });
    await page.waitForURL(`**/${locale}/private-label`);
    await page.waitForFunction(() => window.hallLost);
    assert.notEqual(await page.evaluate(() => document.body.style.overflow), "hidden");
    await page.goBack();
    await page.waitForFunction(() => document.querySelector(".hall")?.dataset.ready === "true");
    await page.waitForTimeout(1600);
    assert.ok(
      page.url().endsWith(path(locale)),
      "Back does not automatically send visitors through the door again",
    );
    console.log(
      `${engine} ${width} ${locale}: stations, links, reverse walk, hidden pause, disposal passed (${end.calls} calls, ${end.textures} textures, ${end.geometries} geometries)`,
    );
    await page.close();
  }
  const reduced = await browser.newPage({
    reducedMotion: "reduce",
    viewport: { width: 390, height: 844 },
  });
  await reduced.goto(base + "/en/wholesale");
  await reduced.waitForFunction(
    () =>
      document.querySelector(".hall")?.dataset.reading === "true" &&
      document.querySelector(".hall")?.dataset.ready === "true",
  );
  assert.equal(await reduced.locator(".hall-chapter[inert]").count(), 0);
  assert.equal(
    await reduced.locator(".hall__stage").evaluate((e) => getComputedStyle(e).position),
    "relative",
  );
  await reduced.waitForTimeout(500);
  const staticFrames = await reduced.locator(".hall__scene").getAttribute("data-frames");
  await reduced.waitForTimeout(300);
  assert.equal(await reduced.locator(".hall__scene").getAttribute("data-frames"), staticFrames);
  await reduced.close();
  const failed = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await failed.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return /^webgl/.test(type) ? null : original.call(this, type, ...args);
    };
  });
  await failed.goto(base + "/en/wholesale");
  await failed.waitForFunction(() => document.querySelector(".hall")?.dataset.failed === "true");
  assert.equal(await failed.locator(".hall-chapter[inert]").count(), 0);
  assert.equal(await failed.locator(".hall canvas").count(), 0);
  assert.equal(
    await failed.locator(".hall__stage").evaluate((e) => getComputedStyle(e).position),
    "relative",
  );
  await failed.close();
  const noScript = await browser.newPage({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  await noScript.goto(base + "/en/wholesale");
  assert.equal(
    await noScript.locator(".hall__stage").evaluate((e) => getComputedStyle(e).position),
    "relative",
  );
  for (const chapter of await noScript.locator(".hall-chapter").all())
    assert.equal(await chapter.evaluate((e) => getComputedStyle(e).opacity), "1");
  await noScript.close();
  assert.deepEqual(errors, []);
  console.log(`${engine}: reduced motion, no WebGL, no JavaScript passed`);
} finally {
  await browser.close();
}
