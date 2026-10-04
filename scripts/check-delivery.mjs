/** Delivery topics remain accessible without moving or rebuilding the map. */
import assert from "node:assert/strict";
import { chromium, webkit } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3000";
const engine = process.argv[3] ?? "chromium";
const browser = await (engine === "webkit" ? webkit : chromium).launch();
const errors = [];
try {
  for (const [width, height, locale] of [
    [1440, 1000, "en"],
    [1024, 768, "de"],
    [768, 1024, "en"],
    [390, 844, "de"],
    [320, 640, "en"],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      isMobile: width < 768,
      hasTouch: width < 768,
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base + (locale === "de" ? "/de/lieferung" : "/en/delivery"));
    const tabs = page.getByRole("tab");
    await tabs.first().waitFor();
    await page.waitForTimeout(700);
    const map = page.locator(".delivery-map");
    const geography = await map.innerHTML();
    const mapBounds = await map.boundingBox();
    const frame = await page.locator(".world__frame").boundingBox();
    for (const tab of await tabs.all()) {
      if (width < 768) await tab.tap();
      else await tab.click();
      await page.waitForTimeout(500);
      assert.equal(await tab.getAttribute("aria-selected"), "true");
      assert.equal(await page.getByRole("tabpanel").count(), 1);
      const content = await page.locator(".delivery-explorer__content").boundingBox();
      assert.ok(content.y > 140, `content clears the fixed identity at ${width}`);
      assert.ok(content.x >= frame.x && content.x + content.width <= frame.x + frame.width);
      assert.ok(content.y + content.height < frame.y + frame.height - 8);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      assert.equal(await map.innerHTML(), geography, "topic selection preserves the map");
      assert.deepEqual(
        await map.boundingBox(),
        mapBounds,
        "topic selection preserves map position",
      );
    }
    await tabs.last().press("Home");
    assert.equal(await tabs.first().getAttribute("aria-selected"), "true");
    await tabs.first().press("ArrowDown");
    assert.equal(await tabs.nth(1).getAttribute("aria-selected"), "true");
    assert.equal(await tabs.nth(1).evaluate((e) => e === document.activeElement), true);
    assert.equal(await page.locator(".delivery-map__region-energy").count(), 1);
    assert.equal(
      await page.locator(".delivery-map__region-energy").getAttribute("data-paths"),
      "1",
      "the parked van's state (Hamburg) holds a still glow",
    );
    assert.equal(await page.locator(".delivery-explorer__content > a").count(), 0);
    assert.equal(await page.locator(".delivery-info__eyebrow").count(), 0);
    assert.equal(await page.locator(".delivery-map__regions path").count(), 16);
    assert.equal(await page.locator(".delivery-map__roads-major").count(), 1);
    assert.equal(await page.locator(".delivery-map__cities").count(), 0);
    assert.equal(await page.locator(".delivery-map__roads-glow").count(), 0);
    assert.equal(await page.locator(".delivery-map__city").textContent(), "HAMBURG");
    assert.equal(await page.locator("#delivery-current-trail").count(), 0);
    assert.equal(await page.locator(".door-flood").count(), 0);
    await tabs.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `/tmp/hugo-delivery-${engine}-${width}.png` });
    await page.close();
    console.log(
      `${engine} ${width} ${locale}: topics, keyboard, frame bounds and fixed geography passed`,
    );
  }
  const reduced = await browser.newPage({ reducedMotion: "reduce" });
  await reduced.goto(base + "/en/delivery");
  assert.equal(
    await reduced
      .locator(".delivery-map__pulse")
      .evaluate((e) => getComputedStyle(e).animationName),
    "none",
  );
  await reduced.close();
  const noScript = await browser.newPage({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  await noScript.goto(base + "/en/delivery");
  for (const panel of await noScript.locator(".delivery-info").all()) {
    assert.equal(
      await panel.isVisible(),
      true,
      "all delivery facts remain readable without JavaScript",
    );
  }
  assert.equal(await noScript.locator(".delivery-tabs").isVisible(), false);
  await noScript.close();
  assert.deepEqual(errors, []);
  console.log(`${engine}: no JavaScript and reduced motion passed`);
} finally {
  await browser.close();
}
