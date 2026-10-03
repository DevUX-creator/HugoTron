/** Mobile chapter composition, reverse scroll and fallback checks. */
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
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${base}/${locale}`);
    await page.waitForFunction(
      () => document.querySelector(".world-journey")?.dataset.status === "ready",
    );
    const chapters = ["source", "land", "india", "pakistan", "hamburg"];
    const top = await page
      .locator(".mobile-story")
      .evaluate((e) => e.getBoundingClientRect().top + scrollY);
    for (const index of [0, 1, 2, 3, 4, 3, 2, 1, 0]) {
      await page.evaluate(
        ([top, height, index]) => scrollTo(0, top + height * (index + (index === 4 ? 0 : 0.25))),
        [top, height, index],
      );
      await page.waitForTimeout(350);
      const shown = page.locator('.mobile-story__panel[data-shown="true"]');
      assert.equal(await shown.count(), 1);
      assert.equal(await shown.getAttribute("data-mobile-chapter"), chapters[index]);
      const bounds = await shown.evaluate((e) => {
        const title = e.querySelector("h2").getBoundingClientRect();
        const header = e.querySelector("header").getBoundingClientRect();
        const art = e.querySelector(".mobile-story__art").getBoundingClientRect();
        const identity = document.querySelector(".world__identity").getBoundingClientRect();
        const frame = document.querySelector(".world__frame").getBoundingClientRect();
        return {
          title: title.toJSON(),
          header: header.toJSON(),
          art: art.toJSON(),
          identity: identity.toJSON(),
          frame: frame.toJSON(),
        };
      });
      assert.ok(bounds.title.top > bounds.identity.bottom, "Title clears permanent sound identity");
      assert.ok(bounds.art.top >= bounds.header.bottom, "Illustration stays below copy");
      assert.ok(bounds.art.height > 100, "Illustration remains large enough on a short screen");
      assert.ok(bounds.art.bottom <= bounds.frame.bottom, "Composition fits inside the frame");
      await page.screenshot({ path: `/tmp/hugo-story-${engine}-${locale}-${chapters[index]}.png` });
    }
    assert.equal(await page.locator(".story__pinned").isVisible(), false);
    assert.equal(
      await page.locator(".story-harbour-film video").getAttribute("src"),
      null,
      "Desktop film stays unloaded on mobile",
    );
    assert.equal(await page.locator(".story__line").isVisible(), false);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    const y = await page.evaluate(() => scrollY);
    await page.setViewportSize({ width, height: height - 80 });
    await page.waitForTimeout(350);
    assert.equal(await page.evaluate(() => scrollY), y, "Toolbar changes preserve scroll position");
    await page.evaluate(() => window.next.router.push("/en/products"));
    await page.waitForURL("**/en/products");
    assert.equal(await page.locator(".mobile-story").count(), 0);
    await page.close();
  }
  for (const options of [{ reducedMotion: "reduce" }, { javaScriptEnabled: false }]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, ...options });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${base}/en`);
    if (options.reducedMotion)
      await page.waitForFunction(
        () => document.querySelector(".mobile-story")?.dataset.enhanced === "false",
      );
    for (const panel of await page.locator(".mobile-story__panel").all()) {
      await panel.scrollIntoViewIfNeeded();
      assert.equal(await panel.getAttribute("aria-hidden"), null);
      assert.ok(await panel.locator("h2").isVisible());
    }
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    `PASS ${engine}: five focused chapters, reverse scroll, EN/DE small-screen fit, stable resize, lazy media, navigation cleanup, reduced motion and no-JS.`,
  );
} finally {
  await browser.close();
}
