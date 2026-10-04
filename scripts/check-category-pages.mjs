/** Category interaction, paper contrast, buying controls and renderer teardown. */
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
    [1440, 1000, "en"],
    [390, 844, "de"],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      isMobile: width < 768,
      hasTouch: width < 768,
    });
    page.on("pageerror", (error) => errors.push(error.message));
    for (const slug of ["rice", "nuts", "spices", "saffron", "pulses", "tea", "raw-materials"]) {
      await page.goto(
        `${base}/${locale}/${locale === "de" ? "sortiment" : "products"}/${locale === "de" ? { rice: "reis", nuts: "nuesse", spices: "gewuerze", saffron: "safran", pulses: "huelsenfruechte", tea: "tee", "raw-materials": "rohstoffe" }[slug] : slug}`,
      );
      await page.waitForFunction(
        () => document.querySelector(".category-world")?.dataset.status === "ready",
        null,
        { timeout: 60000 },
      );
      const scene = page.locator(".category-world__scene");
      const activate = page.locator(".category-interaction button");
      await activate.click();
      await page.waitForFunction((rice) => {
        const state = document.querySelector(".category-world__scene").dataset;
        return rice ? state.playing === "true" : Number(state.productInteraction) > 0.15;
      }, slug === "rice");

      await page.evaluate(() => scrollTo(0, innerHeight * 1.65));
      await page.waitForFunction((rice) => {
        const state = document.querySelector(".category-world__scene").dataset;
        return Number(rice ? state.cameraProgress : state.productProgress) > 0.95;
      }, slug === "rice");
      if (slug === "rice") {
        await page.waitForFunction(
          () => document.querySelector(".category-world__scene").dataset.playing !== "true",
        );
        const before = Number((await scene.getAttribute("data-brush-strokes")) ?? 0);
        await scene.focus();
        await page.keyboard.press("ArrowRight");
        await page.waitForFunction(
          (previous) =>
            Number(document.querySelector(".category-world__scene").dataset.brushStrokes) >
            previous,
          before,
        );
      }
      const buy = page.locator(".category-quantity__buy");
      assert.ok(await buy.isVisible());
      assert.ok((await buy.locator("button, a").count()) > 0);

      await page
        .locator(".category-chapter")
        .first()
        .evaluate((e) => scrollTo(0, e.getBoundingClientRect().top + scrollY + 100));
      await page.waitForFunction(
        () => document.querySelector(".category-world__scene").dataset.covered === "true",
      );
      assert.equal(await page.evaluate(() => document.documentElement.dataset.homeTheme), "light");
      assert.equal(
        await page
          .locator(".category-chapter h2")
          .first()
          .evaluate((e) => getComputedStyle(e).color),
        "rgb(23, 44, 62)",
      );
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0);
      assert.ok(
        await page
          .locator(".category-art img")
          .first()
          .evaluate((e) => e.getAttribute("src").includes("category-editorial")),
      );
      assert.ok((await page.locator(".category-interaction").getAttribute("inert")) !== null);

      const rail = page.locator(".category-assortment .paper-range__rail");
      await rail.scrollIntoViewIfNeeded();
      const cards = rail.locator(".range-product");
      assert.ok((await cards.count()) > 0);
      assert.equal(await rail.evaluate((e) => getComputedStyle(e).scrollSnapType), "none");
      if (await rail.evaluate((e) => e.scrollWidth > e.clientWidth + 1)) {
        await page.locator(".category-assortment .paper-range__navigation button").last().click();
        await page.waitForFunction(
          () => document.querySelector(".category-assortment .paper-range__rail").scrollLeft > 20,
        );
      }
      for (const link of await rail.locator(".range-product__enquiry").all()) {
        assert.match(await link.getAttribute("href"), /(?:enquiry|anfrage)(?:\?|$)/);
      }

      await page
        .locator(".paper-contact")
        .evaluate((e) => scrollTo(0, e.getBoundingClientRect().top + scrollY));
      await page.waitForFunction(
        () => document.querySelector(".paper-portal")?.dataset.ready === "true",
      );
      if (width < 768)
        assert.equal(await page.locator(".paper-portal").getAttribute("data-reveal"), "1.000");
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      const legal = await page.locator(".paper-contact__bottom").boundingBox();
      const frame = await page.locator(".world__frame").boundingBox();
      assert.ok(legal.y + legal.height < frame.y + frame.height - 12);

      // SPA navigation must release all three owned rendering contexts.
      const owned = await page.evaluate(() => {
        window.categoryContextsLost = 0;
        const canvases = document.querySelectorAll(".category canvas");
        for (const canvas of canvases)
          canvas.addEventListener("webglcontextlost", () => window.categoryContextsLost++, {
            once: true,
          });
        return canvases.length;
      });
      await page.locator(".paper-contact__actions a").first().click();
      await page.waitForFunction(() => !document.querySelector(".category"));
      await page.waitForFunction((count) => window.categoryContextsLost === count, owned);
      console.log(
        `${engine} ${locale} ${slug}: interaction, paper, products, footer and teardown passed`,
      );
    }
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
