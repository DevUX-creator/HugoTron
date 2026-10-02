/** node scripts/check-mobile-home.mjs http://localhost:3213 [chromium|webkit] */
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
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
page.on("pageerror", (error) => errors.push(error.message));
let release;
const model = new Promise((resolve) => {
  release = resolve;
});
try {
  await page.route("**/hugo-world-mobile.glb", async (route) => {
    await model;
    await route.continue();
  });
  await page.goto(`${base}/en`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.hasAttribute("data-world-loading"));
  const loading = await page.locator(".world__loading").boundingBox();
  assert.ok(
    loading && loading.width === 390 && loading.height === 844,
    "Mobile preloader covers the viewport",
  );
  assert.equal(
    await page.evaluate(() => getComputedStyle(document.documentElement).overflowY),
    "hidden",
  );
  await page.screenshot({ path: `/tmp/hugo-mobile-${engine}-loader.png` });
  release();
  await page.waitForFunction(
    () => document.querySelector(".world-journey")?.dataset.status === "ready",
  );
  await page.waitForFunction(() => !document.documentElement.hasAttribute("data-world-loading"));
  await page.waitForTimeout(3800);
  const geometry = await page.evaluate(() => {
    const box = (s) => document.querySelector(s).getBoundingClientRect().toJSON();
    return {
      frame: box(".world__frame"),
      identity: box(".world__identity"),
      hero: box(".world"),
      action: box(".world__mobile-action"),
      switcher: box(".world__switcher"),
    };
  });
  assert.equal(geometry.hero.height, 844);
  assert.ok(
    Math.abs(
      geometry.identity.top - geometry.frame.top - (geometry.identity.left - geometry.frame.left),
    ) < 1,
    "Identity has equal top and left frame insets",
  );
  assert.ok(
    Math.abs(geometry.action.bottom - geometry.switcher.bottom) < 2,
    "Action and product arrows align",
  );
  assert.ok(geometry.action.right < geometry.switcher.left, "Controls do not overlap");
  assert.ok(Math.abs(geometry.frame.bottom - geometry.action.bottom - 16) < 2);
  assert.equal(await page.locator(".world__categories").isVisible(), false);
  assert.equal(await page.locator(".world__lead").isVisible(), false);
  await page.screenshot({ path: `/tmp/hugo-mobile-${engine}-hero.png` });
  const initialTitle = await page.locator("#world-title").innerText();
  for (let index = 0; index < 7; index++) {
    await page.getByRole("button", { name: "Next product category" }).click();
    await page.waitForTimeout(100);
    assert.ok(
      await page.locator("#world-title").evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
      "Category heading fits",
    );
  }
  assert.equal(
    await page.locator("#world-title").innerText(),
    initialTitle,
    "Cycle returns to the brand cube",
  );
  await page.getByRole("button", { name: "Previous product category" }).click();
  assert.notEqual(await page.locator("#world-title").innerText(), initialTitle);

  const handoff = async (progress) => {
    await page.locator(".daylight__handoff").evaluate((e, value) => {
      scrollTo(
        0,
        e.getBoundingClientRect().top + scrollY - e.clientHeight / 1.7 + e.clientHeight * value,
      );
    }, progress);
    await page.waitForTimeout(350);
    assert.ok(
      Math.abs(Number(await page.locator(".daylight").getAttribute("data-handoff")) - progress) <
        0.003,
    );
  };
  for (const progress of [0.35, 0.7, 1]) {
    await handoff(progress);
    await page.screenshot({ path: `/tmp/hugo-mobile-${engine}-paper-${progress}.png` });
  }
  for (const progress of [0.7, 0.35, 0]) await handoff(progress);
  await handoff(0.5);
  const oldInnerHeight = await page.evaluate(() => innerHeight);
  // Emulate toolbar expansion independently of the CSS small viewport.
  await page.evaluate((height) => {
    window.mobileHeightDescriptor = Object.getOwnPropertyDescriptor(window, "innerHeight");
    Object.defineProperty(window, "innerHeight", { configurable: true, value: height + 90 });
    dispatchEvent(new Event("resize"));
  }, oldInnerHeight);
  await page.waitForTimeout(350);
  assert.equal(
    await page.locator(".daylight").getAttribute("data-handoff"),
    "0.500",
    "Toolbar changes do not move the paper handoff",
  );
  await page.evaluate(() => {
    Object.defineProperty(window, "innerHeight", window.mobileHeightDescriptor);
    delete window.mobileHeightDescriptor;
    dispatchEvent(new Event("resize"));
  });

  for (const height of [744, 844, 744]) {
    await page.setViewportSize({ width: 390, height });
    await page.waitForTimeout(250);
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(200);
    const excess = await page.evaluate(
      () =>
        document.documentElement.scrollHeight -
        (document.querySelector(".paper-contact").getBoundingClientRect().bottom + scrollY),
    );
    assert.ok(Math.abs(excess) <= 2, `No empty document tail after resize (${height}): ${excess}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(350);
  await page
    .locator(".paper-range__rail")
    .evaluate((e) => scrollTo(0, e.getBoundingClientRect().top + scrollY - 190));
  await page.waitForTimeout(350);
  if (engine === "chromium") {
    const cdp = await page.context().newCDPSession(page);
    const y = await page.evaluate(() => scrollY);
    const hit = await page.evaluate(
      () => document.elementFromPoint(320, 360)?.closest(".paper-range__rail") !== null,
    );
    assert.equal(hit, true, "Touch starts inside the product rail");
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 320, y: 360 }],
    });
    for (let step = 1; step <= 12; step++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: 320 - step * 20, y: 360 }],
      });
      await page.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(500);
    assert.ok(
      await page.locator(".paper-range__rail").evaluate((e) => e.scrollLeft > 100),
      "Finger swipe moves product cards",
    );
    assert.ok(
      Math.abs((await page.evaluate(() => scrollY)) - y) < 4,
      "Horizontal swipe does not move the page",
    );
    await cdp.detach();
  }
  await page
    .locator(".paper-range__film")
    .evaluate((e) => scrollTo(0, e.getBoundingClientRect().top + scrollY - 200));
  await page.waitForFunction(() => document.querySelector(".paper-range [data-engraved]"));
  await page
    .locator(".paper-portal")
    .evaluate((e) => scrollTo(0, e.getBoundingClientRect().top + scrollY - 180));
  await page.waitForFunction(
    () => document.querySelector(".paper-portal")?.dataset.ready === "true",
  );
  await page.waitForTimeout(800);
  assert.equal(await page.locator(".paper-portal").getAttribute("data-reveal"), "1.000");
  const portal = await page.locator(".paper-portal").boundingBox();
  assert.equal(portal.width, 390);
  assert.equal(portal.x, 0);
  await page.screenshot({ path: `/tmp/hugo-mobile-${engine}-footer.png` });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(`${base}/de`);
  await page.waitForFunction(
    () => document.querySelector(".world-journey")?.dataset.status === "ready",
  );
  await page.waitForTimeout(3000);
  for (let index = 0; index < 7; index++) {
    await page.getByRole("button", { name: "Nächster Produktbereich" }).click();
    assert.ok(
      await page.locator("#world-title").evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
      "German category heading fits a small phone",
    );
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  console.log(
    `PASS ${engine}: preloader, hero controls, seven selections, forward/reverse handoff, toolbar and viewport changes, no empty ending, product rail, engraving and full-width footer.`,
  );
} catch (error) {
  console.error(
    await page.evaluate(() => ({
      y: scrollY,
      height: innerHeight,
      hit: document.elementFromPoint(320, 360)?.outerHTML.slice(0, 300),
      rail: document.querySelector(".paper-range__rail")?.getBoundingClientRect().toJSON(),
      left: document.querySelector(".paper-range__rail")?.scrollLeft,
      classes: document.documentElement.className,
    })),
  );
  await page.screenshot({ path: `/tmp/hugo-mobile-${engine}-failure.png` });
  throw error;
} finally {
  release();
  await browser.close();
}
