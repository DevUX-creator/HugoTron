/** Phone footer clearance, product fit, enquiry selections and native swipe momentum. */
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
try {
  for (const [width, height, locale] of [
    [390, 844, "en"],
    [320, 640, "de"],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/${locale}`);
    await page.waitForFunction(
      () => document.querySelector(".world-journey")?.dataset.status === "ready",
    );
    const rail = page.locator(".paper-range__rail");
    await page.locator(".paper-range__navigation").evaluate((e) => {
      const identity = document.querySelector(".world__identity").getBoundingClientRect();
      scrollTo(0, e.getBoundingClientRect().top + scrollY - identity.bottom - 16);
    });
    await page.waitForTimeout(600);
    const frame = await page.locator(".world__frame").boundingBox();
    const card = await rail.locator(".range-product").first().boundingBox();
    assert.ok(
      card.y + card.height < frame.y + frame.height - 12,
      `${locale} ${width}×${height}: card bottom ${card.y + card.height} clears frame ${frame.y + frame.height}`,
    );
    assert.equal(await rail.evaluate((e) => getComputedStyle(e).scrollSnapType), "none");
    const gap = await page.evaluate(() => {
      const video = document.querySelector(".paper-range__film").getBoundingClientRect();
      const rail = document.querySelector(".paper-range__rail").getBoundingClientRect();
      return rail.top - video.bottom;
    });
    assert.ok(gap >= 90, "Video has breathing room above the products");
    for (const slug of [
      "almonds-cashews",
      "hazelnuts-walnuts",
      "dried-fruits",
      "ginger",
      "cinnamon-cardamom",
      "white-mung-beans",
    ]) {
      const offering = rail.locator(`[data-product-id="${slug}"]`);
      assert.equal(await offering.count(), 1);
      assert.equal(await offering.locator(".add-to-cart").count(), 0);
      assert.match(
        await offering.locator(".range-product__enquiry").getAttribute("href"),
        new RegExp(`product=${slug}`),
      );
    }
    await page.screenshot({ path: `/tmp/hugo-range-${engine}-${locale}.png` });
    if (engine === "chromium") {
      const cdp = await page.context().newCDPSession(page);
      const bounds = await rail.boundingBox();
      const x = width - 65;
      const y = bounds.y + card.height * 0.45;
      const vertical = await page.evaluate(() => scrollY);
      await rail.evaluate((e) => {
        window.railRelease = null;
        e.addEventListener(
          "touchend",
          () => {
            window.railRelease = e.scrollLeft;
          },
          { once: true },
        );
      });
      // CDP's gesture generator suppresses fling by default. Explicitly request
      // the browser's native inertial swipe instead of discrete touch moves.
      await cdp.send("Input.synthesizeScrollGesture", {
        x,
        y,
        xDistance: -170,
        yDistance: 0,
        speed: 1000,
        gestureSourceType: "touch",
        preventFling: false,
      });
      await page.waitForFunction(() => window.railRelease !== null);
      const release = await page.evaluate(() => window.railRelease);
      await page.waitForTimeout(500);
      const coast = await rail.evaluate((e) => e.scrollLeft);
      assert.ok(
        coast > release + 15,
        `Touch momentum continues after release: ${release} → ${coast}`,
      );
      assert.ok(Math.abs((await page.evaluate(() => scrollY)) - vertical) < 3);
      await cdp.detach();
    }
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(400);
    const bottom = await page.locator(".paper-contact__bottom").boundingBox();
    const bottomFrame = await page.locator(".world__frame").boundingBox();
    assert.ok(
      bottom.y + bottom.height <= bottomFrame.y + bottomFrame.height - 24,
      "All legal links and back-to-top clear the fixed frame at maximum scroll",
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await page.screenshot({ path: `/tmp/hugo-footer-bottom-${engine}-${locale}.png` });
    await page.close();
  }
  if (engine === "chromium") {
    const page = await browser.newPage({ viewport: { width: 1512, height: 982 } });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/en`);
    await page.waitForFunction(
      () => document.querySelector(".world-journey")?.dataset.status === "ready",
    );
    const rail = page.locator(".paper-range__rail");
    await rail.evaluate((e) => scrollTo(0, e.getBoundingClientRect().top + scrollY - 220));
    await page.waitForTimeout(500);
    const bounds = await rail.boundingBox();
    await page.mouse.move(800, bounds.y + 160);
    await page.mouse.down();
    for (let step = 1; step <= 6; step++) {
      await page.mouse.move(800 - step * 45, bounds.y + 160);
      await page.waitForTimeout(16);
    }
    const release = await rail.evaluate((e) => e.scrollLeft);
    await page.mouse.up();
    await page.waitForTimeout(250);
    assert.ok(
      (await rail.evaluate((e) => e.scrollLeft)) > release + 15,
      "Mouse drag glides after release",
    );
    await page.waitForTimeout(1300);
    const settled = await rail.evaluate((e) => e.scrollLeft);
    await page.waitForTimeout(300);
    assert.ok(
      Math.abs((await rail.evaluate((e) => e.scrollLeft)) - settled) < 1,
      "Glide stops completely",
    );
    const href = await rail
      .locator('[data-product-id="ginger"] .range-product__enquiry')
      .getAttribute("href");
    await page.evaluate((href) => window.next.router.push(href), href);
    await page.waitForURL("**/en/enquiry?product=ginger");
    assert.equal(await page.locator('input[name="product"]').inputValue(), "Ginger");
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    `PASS ${engine}: mobile card fit, video spacing, six sourcing enquiries, footer clearance and ${engine === "chromium" ? "native touch momentum" : "layout"}.`,
  );
} finally {
  await browser.close();
}
