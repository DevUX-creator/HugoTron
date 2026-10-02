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
await page.addInitScript(() => {
  const draw = WebGLRenderingContext.prototype.drawArrays;
  WebGLRenderingContext.prototype.drawArrays = function (...args) {
    draw.apply(this, args);
    if (!this.canvas.closest(".daylight__fill")) return;
    const empty = new Uint8Array(4);
    this.readPixels(
      Math.floor(this.drawingBufferWidth / 2),
      this.drawingBufferHeight - 2,
      1,
      1,
      this.RGBA,
      this.UNSIGNED_BYTE,
      empty,
    );
    window.paperEmptyPixel = Array.from(empty);
  };
});
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
      action: box(".world__cta"),
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
    Math.abs(
      (geometry.frame.top + geometry.frame.bottom) / 2 -
        (geometry.switcher.top + geometry.switcher.bottom) / 2,
    ) < 2,
    "Product arrows sit at the vertical centre of the frame",
  );
  assert.ok(geometry.action.top > geometry.switcher.bottom, "Controls do not overlap");
  assert.ok(Math.abs(geometry.frame.bottom - geometry.action.bottom - 16) < 2);
  assert.equal(await page.locator(".world__categories").isVisible(), false);
  assert.equal(await page.locator(".world__lead").isVisible(), false);
  assert.equal(await page.locator(".world__note-end").isVisible(), false);
  assert.equal(await page.getByRole("button", { name: "Search", exact: true }).count(), 0);
  assert.ok(
    await page.evaluate(() => Number(getComputedStyle(document.body, "::before").opacity) < 0.06),
  );
  const menu = page.locator(".header__menu");
  await menu.click();
  assert.equal(await page.locator(".mobile-menu").isVisible(), true);
  assert.equal(await page.locator(".mobile-menu__nav a").count(), 6);
  assert.equal(await page.locator(".mobile-menu__categories a").count(), 6);
  await page.screenshot({ path: `/tmp/hugo-mobile-${engine}-menu.png` });
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".mobile-menu").isVisible(), false);
  assert.equal(await menu.evaluate((e) => e === document.activeElement), true);
  assert.notEqual(await page.evaluate(() => document.body.style.overflow), "hidden");
  const buttons = await page.evaluate(() =>
    [".world__cta", ".paper-range__intro", ".paper-contact__actions"].map((s) => {
      const button = document.querySelector(`${s} .arrow-link--large`);
      const label = getComputedStyle(button.querySelector(".arrow-link__label"));
      const mark = getComputedStyle(button.querySelector(".arrow-link__mark"));
      const style = getComputedStyle(button);
      return [label.fontSize, mark.width, style.padding, style.borderWidth];
    }),
  );
  assert.deepEqual(buttons[0], buttons[1], "Hero and product rail use the same button");
  assert.deepEqual(buttons[0], buttons[2], "Footer uses the same button without a box");
  await page.screenshot({ path: `/tmp/hugo-mobile-${engine}-hero.png` });
  const initialTitle = await page.locator("#world-title").innerText();
  for (let index = 0; index < 7; index++) {
    await page.getByRole("button", { name: "Next product category" }).click();
    await page.waitForTimeout(100);
    if (index === 0) {
      const purchase = page.locator(".world__purchase");
      await purchase.getByRole("button", { name: "5 kg", exact: true }).click();
      await purchase.getByRole("button", { name: /Increase quantity/i }).click();
      await purchase.locator(".add-to-cart--link").click();
      assert.equal(await page.locator(".header__count").innerText(), "2");
      await page.screenshot({ path: `/tmp/hugo-mobile-${engine}-purchase.png` });
    }
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
    if (progress < 1)
      assert.deepEqual(
        await page.evaluate(() => window.paperEmptyPixel),
        [0, 0, 0, 0],
        "Uncovered paper pixels contain no pale RGB veil",
      );
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

  await page
    .locator(".paper-hamburg")
    .evaluate((e) => scrollTo(0, e.getBoundingClientRect().top + scrollY - 80));
  await page.waitForTimeout(400);
  const chapterMetrics = () =>
    page.evaluate(() => ({
      y: scrollY,
      height: document.documentElement.scrollHeight,
      chapters: [...document.querySelectorAll(".story-chapter")].map(
        (e) => e.getBoundingClientRect().top + scrollY,
      ),
    }));
  const stable = await chapterMetrics();
  for (const height of [744, 844, 744, 844]) {
    await page.setViewportSize({ width: 390, height });
    await page.waitForTimeout(400);
    assert.deepEqual(
      await chapterMetrics(),
      stable,
      "Browser bars do not reflow chapters or jump the scroll position",
    );
  }

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
    if (index === 0) {
      await page.waitForTimeout(900);
      await page.screenshot({ path: `/tmp/hugo-mobile-${engine}-small-purchase.png` });
      const action = await page.locator(".world__cta").boundingBox();
      const arrows = await page.locator(".world__switcher").boundingBox();
      assert.ok(
        action.y >= arrows.y + arrows.height,
        "Buying options clear the arrows on a small phone",
      );
    }
    assert.ok(
      await page.locator("#world-title").evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
      "German category heading fits a small phone",
    );
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  console.log(
    `PASS ${engine}: preloader, menu, no search, shared buttons, hero purchase, seven selections, transparent handoff, stable toolbar resizing, no empty ending, touch rail and organic footer.`,
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
