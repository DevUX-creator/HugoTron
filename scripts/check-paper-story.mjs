/** node scripts/check-paper-story.mjs http://localhost:3213 */
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const base = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch({
  args: ["--enable-gpu", "--use-angle=metal", "--enable-unsafe-swiftshader"],
});
const errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1512, height: 982 } });
  await context.addInitScript(() => {
    window.paperProbe = { draws: 0, videos: [] };
    const original = HTMLCanvasElement.prototype.getContext;
    const seen = new WeakSet();
    HTMLCanvasElement.prototype.getContext = function (...args) {
      const gl = original.apply(this, args);
      if (gl && args[0].startsWith("webgl") && !seen.has(gl)) {
        seen.add(gl);
        for (const method of [
          "drawElements",
          "drawArrays",
          "drawElementsInstanced",
          "drawArraysInstanced",
        ]) {
          if (!gl[method]) continue;
          const draw = gl[method].bind(gl);
          gl[method] = (...params) => {
            if (this.closest(".world__scene")) window.paperProbe.draws++;
            return draw(...params);
          };
        }
      }
      return gl;
    };
    const create = document.createElement.bind(document);
    document.createElement = (tag, ...args) => {
      const element = create(tag, ...args);
      if (tag === "video") window.paperProbe.videos.push(new WeakRef(element));
      return element;
    };
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/en`);
  await page.waitForFunction(
    () => document.querySelector(".world-journey")?.dataset.status === "ready",
  );
  await page.waitForTimeout(700);
  assert.equal(
    await page.locator(".header__menu").isVisible(),
    false,
    "Desktop keeps inline navigation",
  );
  assert.equal(await page.getByRole("button", { name: "Search", exact: true }).count(), 0);
  assert.equal(await page.locator(".daylight").getAttribute("data-handoff"), "0.000");
  const identity = await page.locator(".world__identity").boundingBox();
  const track = await page
    .locator(".daylight__handoff")
    .evaluate((e) => e.getBoundingClientRect().top + scrollY);
  // Settle in the film chapter before checking its departure, as a normal scroll does.
  await page.evaluate(() => scrollTo(0, innerHeight * 3.45));
  await page.waitForFunction(
    () => Number(document.querySelector(".world-journey")?.dataset.chapterProgress) > 0.99,
  );
  await page.waitForTimeout(600);
  await page.evaluate((top) => scrollTo(0, top - innerHeight + innerHeight * 1.7 * 0.4), track);
  await page.waitForTimeout(800);
  assert.equal(await page.locator(".daylight__fill").getAttribute("data-active"), "true");
  assert.equal(await page.locator(".daylight").getAttribute("data-arrived"), "false");
  assert.ok(
    await page
      .locator("#world-orbit-title .flies")
      .first()
      .evaluate((e) => parseFloat(getComputedStyle(e).opacity) < 0.8),
  );
  await page.screenshot({ path: "/tmp/hugo-paper-transition.png" });
  await page.evaluate((top) => scrollTo(0, top + innerHeight), track);
  await page.waitForFunction(
    () => document.querySelector(".world__scene")?.dataset.covered === "true",
  );
  await page.waitForTimeout(300);
  const draws = await page.evaluate(() => window.paperProbe.draws);
  await page.waitForTimeout(900);
  assert.equal(
    await page.evaluate(() => window.paperProbe.draws),
    draws,
    "covered World must stop rendering",
  );
  assert.ok(
    await page.evaluate(() =>
      window.paperProbe.videos.every((ref) => !ref.deref() || ref.deref().paused),
    ),
    "hidden videos must pause",
  );
  assert.deepEqual(await page.locator(".world__identity").boundingBox(), identity);
  assert.equal(
    await page
      .locator(".header__brand path")
      .first()
      .evaluate((e) => getComputedStyle(e).fill),
    "rgb(23, 44, 62)",
  );
  assert.equal(await page.locator(".origins__list").count(), 0);
  await page.screenshot({ path: "/tmp/hugo-paper-origin.png" });
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForFunction(
    () => document.querySelector(".world__scene")?.dataset.covered === "false",
  );
  await page.waitForTimeout(900);
  assert.ok(
    (await page.evaluate(() => window.paperProbe.draws)) > draws,
    "World must resume on reverse scroll",
  );
  assert.equal(await page.evaluate(() => document.documentElement.dataset.homeTheme), "dark");
  await page.locator(".paper-range .add-to-cart--bar").first().click();
  assert.equal(await page.locator(".header__count").textContent(), "1");
  // The temporary preview gate blocks subpage clicks. Use the installed Next
  // debug router to keep testing SPA cleanup and the destination content.
  await page
    .locator(".paper-label .arrow-link")
    .evaluate((a) => window.next.router.push(a.getAttribute("href")));
  await page.waitForURL("**/en/private-label");
  await page
    .locator(".private-label-page .arrow-link")
    .evaluate((a) => window.next.router.push(a.getAttribute("href")));
  await page.waitForURL("**/en/enquiry?purpose=label");
  assert.equal(await page.locator('input[name="purpose"][value="label"]').isChecked(), true);
  await context.close();

  for (const locale of ["en", "de"]) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/${locale}`);
    await page.waitForFunction(
      () => document.querySelector(".daylight")?.dataset.enhanced === "false",
    );
    for (const selector of [
      '[data-mobile-chapter="source"]',
      '[data-mobile-chapter="hamburg"]',
      ".paper-buying",
      ".paper-label",
      ".paper-range",
    ]) {
      await page
        .locator(selector)
        .evaluate((e) => scrollTo(0, e.getBoundingClientRect().top + scrollY));
      await page.waitForTimeout(150);
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${locale}: no horizontal document overflow`,
      );
      assert.ok(await page.locator(`${selector} h2`).isVisible());
    }
    await page
      .locator('[data-mobile-chapter="source"]')
      .evaluate((e) => scrollTo(0, e.getBoundingClientRect().top + scrollY));
    await page.screenshot({ path: `/tmp/hugo-paper-${locale}-mobile-reduced.png` });
    await page.close();
  }
  const nojs = await browser.newPage({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  await nojs.goto(`${base}/en`);
  await nojs.locator('[data-mobile-chapter="source"]').scrollIntoViewIfNeeded();
  assert.equal(
    await nojs.locator('[data-mobile-chapter="source"] h2').textContent(),
    "Good things begin here.",
  );
  assert.ok(await nojs.locator(".paper-label .arrow-link").isVisible());
  await nojs.close();
  const noGl = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await noGl.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      return kind.startsWith("webgl") ? null : original.call(this, kind, ...args);
    };
  });
  await noGl.goto(`${base}/en`);
  await noGl.waitForFunction(
    () => document.querySelector(".world-journey")?.dataset.status === "unavailable",
  );
  await noGl
    .locator(".mobile-story")
    .evaluate((e) => scrollTo(0, e.getBoundingClientRect().top + scrollY));
  await noGl.waitForFunction(() => document.documentElement.hasAttribute("data-world-paper"));
  assert.equal(await noGl.locator(".daylight").getAttribute("data-enhanced"), "false");
  assert.ok(await noGl.locator('[data-mobile-chapter="source"] h2').isVisible());
  await noGl.close();
  assert.deepEqual(errors, []);
  console.log(
    "PASS: synchronous handoff, persistent identity, paused/resumed renderer and videos, cart and private-label enquiry preset, EN/DE mobile, reduced motion, no-JS and no-WebGL content.",
  );
} finally {
  await browser.close();
}
