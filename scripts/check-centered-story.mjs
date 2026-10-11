/** Centered story review: node scripts/check-centered-story.mjs [base] [chromium|webkit] */
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
    [1512, 982, "en"],
    [1366, 768, "de"],
    [768, 1024, "en"],
    [390, 844, "en"],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${base}/${locale}`);
    await page.waitForFunction(
      () => document.querySelector(".world-journey")?.dataset.status === "ready",
    );
    await page.evaluate(() => document.fonts.ready);
    const notice = page.locator(".cookie-notice button").last();
    if (await notice.isVisible()) await notice.click();
    if (width >= 768) {
      for (const chapter of ["fields", "pakistan", "hamburg"]) {
        for (const progress of [0.4, 0.55]) {
          await page.waitForFunction(
            ({ chapter, progress }) => {
              const section = document.querySelector(`[data-story-chapter="${chapter}"]`);
              const h = document.querySelector(".story__visuals").clientHeight;
              const target =
                section.getBoundingClientRect().top +
                scrollY -
                h +
                progress * (section.offsetHeight + h);
              if (Math.abs(scrollY - target) > 1) scrollTo(0, target);
              return Math.abs(Number(section.style.getPropertyValue("--p")) - progress) < 0.001;
            },
            { chapter, progress },
          );
          await page.waitForTimeout(450);
          if (chapter === "hamburg" && progress === 0.55) {
            const video = page.locator(".story-harbour-film video");
            await video.evaluate(
              (el) =>
                new Promise((resolve, reject) => {
                  if (el.readyState >= 2) return resolve();
                  el.addEventListener("loadeddata", resolve, { once: true });
                  el.addEventListener("error", reject, { once: true });
                }),
            );
            assert.ok(await video.evaluate((el) => el.loop && el.muted && !el.paused));
            assert.equal(await video.evaluate((el) => el.duration), 6);
            await video.evaluate((el) => {
              el.currentTime = el.duration - 0.1;
            });
            await page.waitForFunction(
              () => document.querySelector(".story-harbour-film video").currentTime < 1,
            );
          }
          for (const text of await page
            .locator(`[data-story-chapter="${chapter}"] .story-text`)
            .all()) {
            const centered = await text.evaluate((el) => {
              const box = el.getBoundingClientRect();
              return (
                getComputedStyle(el).textAlign === "center" &&
                Math.abs(box.x + box.width / 2 - innerWidth / 2) < 2
              );
            });
            assert.ok(centered, `${chapter} copy shares the page centre`);
          }
          await page.screenshot({
            path: `/tmp/hugo-center-${engine}-${width}-${chapter}-${progress}.png`,
          });
        }
      }
    }
    await page
      .locator(".paper-buying")
      .evaluate((el) => scrollTo(0, el.getBoundingClientRect().top + scrollY));
    await page.waitForTimeout(450);
    const paths = await page.locator(".paper-buying__path").evaluateAll((items) =>
      items.map((el) => ({
        box: el.getBoundingClientRect().toJSON(),
        align: getComputedStyle(el).textAlign,
        display: getComputedStyle(el).display,
        transform: getComputedStyle(el).translate,
        href: el.getAttribute("href"),
      })),
    );
    assert.equal(paths.length, 3, "All buying paths remain available");
    assert.ok(
      paths.every((p) => p.align === "center" && p.transform === "none" && p.display === "flex"),
      "Buying paths stay centered and stable",
    );
    if (width >= 768)
      assert.ok(
        paths.every((p) => Math.abs(p.box.top - paths[0].box.top) < 1),
        "Buying paths share one row",
      );
    assert.equal(paths[0].href, locale === "de" ? "/de/sortiment" : "/en/products");
    assert.ok(paths[1].href.includes("purpose=quote"));
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await page.screenshot({ path: `/tmp/hugo-center-${engine}-${width}-buying.png` });
    await page.close();
    console.log(`PASS ${engine}: ${width}×${height} ${locale} centered chapters and buying links`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
