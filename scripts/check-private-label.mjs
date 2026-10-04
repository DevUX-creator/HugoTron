/** Checks the room journey, actual pack controls, accessibility and renderer ownership. */
import assert from "node:assert/strict";
import { chromium, webkit } from "@playwright/test";
const base = process.argv[2] ?? "http://localhost:3000";
const engine = process.argv[3] ?? "chromium";
const browser = await (engine === "webkit" ? webkit : chromium).launch(
  engine === "webkit" ? {} : { args: ["--enable-gpu", "--use-angle=metal"] },
);
const errors = [];
const snapshot = (p) => p.locator(".label-room__scene").evaluate((e) => ({ ...e.dataset }));
const walk = async (p, value) => {
  await p.evaluate((v) => {
    const root = document.querySelector(".label-room"),
      stage = root.querySelector(".label-room__stage");
    scrollTo(
      0,
      root.getBoundingClientRect().top + scrollY + v * (root.offsetHeight - stage.clientHeight),
    );
  }, value);
  await p.waitForFunction(
    (v) =>
      Math.abs(Number(document.querySelector(".label-room__scene")?.dataset.progress) - v) < 0.008,
    value,
  );
};
const visibility = (p, hidden) =>
  p.evaluate((v) => {
    if (v) Object.defineProperty(document, "hidden", { configurable: true, value: true });
    else delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
try {
  for (const [width, height, locale] of [
    [1366, 768, "en"],
    [390, 844, "de"],
    [320, 640, "en"],
  ]) {
    const p = await browser.newPage({
      viewport: { width, height },
      isMobile: width < 768,
      hasTouch: width < 768,
    });
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => {
      if (m.type() === "error" && /THREE|Shader|WebGL/.test(m.text())) errors.push(m.text());
    });
    await p.goto(`${base}/${locale}/private-label`);
    await p.waitForSelector(".label-room[data-ready]", { timeout: 60000 });
    await p.waitForTimeout(1400);
    let initial = await snapshot(p);
    assert.ok(Number(initial.floatY) > 1.8, "pack is suspended above its pedestal");
    await p.waitForTimeout(350);
    assert.notEqual((await snapshot(p)).floatY, initial.floatY, "pack floats gently while settled");
    for (const [v, key] of [
      [0, "arrival"],
      [0.29, "source"],
      [0.5, "identity"],
      [0.7, "horizon"],
      [1, "return"],
    ]) {
      await walk(p, v);
      const chapter = p.locator(`[data-label-chapter="${key}"]`);
      assert.equal(await chapter.getAttribute("inert"), null);
      assert.equal(await p.locator("[data-label-chapter]:not([inert])").count(), 1);
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
      const box = await chapter.boundingBox(),
        frame = await p.locator(".world__frame").boundingBox();
      assert.ok(
        box.y > 135 && box.y + box.height < frame.y + frame.height - 10,
        `${width} ${key} bounds: ${JSON.stringify(box)}`,
      );
      if (key === "identity") {
        if (width === 1366) {
          const resting = Number((await snapshot(p)).packRotation);
          await p.mouse.move(748, 335);
          await p.waitForFunction(
            () => Number(document.querySelector(".label-room__scene").dataset.hover) > 0.9,
          );
          assert.ok(
            Math.abs(Number((await snapshot(p)).packRotation) - resting) > 0.2,
            "hover rotates the pack around its centre",
          );
          await p.mouse.move(20, 20);
          await p.waitForFunction(
            () => Number(document.querySelector(".label-room__scene").dataset.hover) < 0.01,
          );
          assert.ok(
            Math.abs(Number((await snapshot(p)).packRotation) - resting) < 0.02,
            "hover settles back",
          );
          await p.mouse.click(710, 335);
          await p.waitForFunction(
            () => document.querySelector(".label-room__scene").dataset.finish === "blue",
          );
          await p.mouse.move(710, 335);
          await p.mouse.down();
          await p.mouse.move(765, 335, { steps: 8 });
          await p.mouse.up();
          assert.equal((await snapshot(p)).finish, "blue", "dragging does not change colour");
          await p.mouse.move(20, 20);
        } else if (width === 390) {
          await p.touchscreen.tap(195, 230);
          await p.waitForFunction(
            () => document.querySelector(".label-room__scene").dataset.finish === "blue",
          );
        }
        assert.equal(
          await p.locator("#label-brand, .label-room__finish").count(),
          0,
          "no name field or colour swatches",
        );
        const pack = p.locator(".label-room__scene");
        await pack.focus();
        const finishes = ["midnight", "blue", "natural"];
        let index = finishes.indexOf((await snapshot(p)).finish);
        for (let i = 0; i < 3; i++) {
          index = (index + 1) % finishes.length;
          await pack.press("Enter");
          await p.waitForFunction(
            (f) => document.querySelector(".label-room__scene").dataset.finish === f,
            finishes[index],
          );
        }
        const beforeTurn = Number((await snapshot(p)).yaw);
        await pack.press("ArrowRight");
        await p.waitForFunction(
          (y) => Number(document.querySelector(".label-room__scene").dataset.yaw) > y + 0.8,
          beforeTurn,
        );
        await pack.evaluate((e) => e.blur());
        await p.waitForTimeout(700);
        await p.screenshot({ path: `/tmp/hugo-label-${engine}-${width}-pack.png` });
      }
      if (key === "horizon")
        assert.match(await chapter.locator("a").getAttribute("href"), /purpose=label/);
    }
    initial = await snapshot(p); // First visit uploads the previously hidden doorway geometry.
    for (const v of [0.2, 0.68, 0.1, 0.9]) await walk(p, v);
    const end = await snapshot(p);
    assert.equal(end.geometries, initial.geometries);
    assert.equal(end.textures, initial.textures);
    assert.ok(Number(end.calls) < 145);
    await visibility(p, true);
    const paused = await snapshot(p);
    await p.waitForTimeout(300);
    assert.deepEqual(await snapshot(p), paused);
    await visibility(p, false);
    await p.evaluate(() => {
      window.roomLost = false;
      document
        .querySelector(".label-room canvas")
        .addEventListener("webglcontextlost", () => (window.roomLost = true), { once: true });
    });
    // Leave through the horizon chapter's contact link: a client navigation that unmounts the room.
    await walk(p, 0.68);
    await p.locator(".label-room__chapter--horizon a").click();
    await p.waitForFunction(() => window.roomLost);
    assert.equal(await p.locator(".label-room canvas").count(), 0);
    console.log(
      `${engine} ${width}/${locale}: journey, pack, layout, hidden pause and disposal passed (${end.geometries} geometries, ${end.textures} textures)`,
    );
    await p.close();
  }
  const reduced = await browser.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await reduced.goto(base + "/en/private-label");
  await reduced.waitForSelector(".label-room[data-ready][data-reading]");
  await reduced.waitForTimeout(500);
  assert.equal(await reduced.locator("[data-label-chapter][inert]").count(), 0);
  const frames = (await snapshot(reduced)).frames;
  await reduced.waitForTimeout(400);
  assert.equal((await snapshot(reduced)).frames, frames);
  await reduced.close();
  const failed = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await failed.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return /^webgl/.test(type) ? null : original.call(this, type, ...args);
    };
    sessionStorage.setItem("hugo:arrival", "door");
  });
  await failed.goto(base + "/en/private-label");
  await failed.waitForSelector(".label-room[data-failed][data-reading]");
  assert.equal(await failed.locator("[data-label-chapter][inert]").count(), 0);
  await failed.waitForSelector('.door-flood--arrival[data-state="out"]', { state: "attached" });
  await failed.close();
  const noscript = await browser.newPage({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  await noscript.goto(base + "/en/private-label");
  for (const chapter of await noscript.locator("[data-label-chapter]").all())
    assert.equal(await chapter.evaluate((e) => getComputedStyle(e).opacity), "1");
  assert.equal(
    await noscript.locator(".label-room__stage").evaluate((e) => getComputedStyle(e).position),
    "relative",
  );
  await noscript.close();
  // Use the physical wholesale door to verify the real route handoff and gated arrival.
  const door = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await door.goto(base + "/en/wholesale");
  await door.waitForSelector('.hall[data-ready="true"]', { timeout: 60000 });
  await door.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await door.waitForSelector('[data-chapter="door"]:not([inert])');
  await door.locator('[data-chapter="door"] a').click();
  await door.waitForURL("**/en/private-label", { timeout: 30000 });
  await door.waitForSelector(".label-room[data-ready]", { timeout: 60000 });
  await door.waitForSelector('.door-flood--arrival[data-state="out"]', { state: "attached" });
  assert.notEqual(await door.evaluate(() => document.body.style.overflow), "hidden");
  await walk(door, 1);
  await door.locator('[data-label-chapter="return"] a').click();
  await door.waitForURL("**/en/wholesale", { timeout: 30000 });
  await door.waitForSelector('.hall[data-ready="true"]', { timeout: 60000 });
  assert.notEqual(await door.evaluate(() => document.body.style.overflow), "hidden");
  await door.close();
  assert.deepEqual(errors, []);
  console.log(`${engine}: reduced motion, no WebGL, no JavaScript, wholesale door handoff passed`);
} finally {
  await browser.close();
}
