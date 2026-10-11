/** Hamburg cargo regression: node scripts/check-hamburg-story.mjs [base] [chromium|webkit] */
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

async function seek(page, progress) {
  // Changing the motion preference reflows the opening scene. Follow that layout
  // until the reading position settles instead of using a stale document offset.
  await page.waitForFunction((p) => {
    const chapter = document.querySelector(".paper-hamburg");
    const height = document.querySelector(".story__visuals").clientHeight;
    const target =
      chapter.getBoundingClientRect().top + scrollY - height + p * (chapter.offsetHeight + height);
    if (Math.abs(scrollY - target) > 1) scrollTo(0, target);
    return (
      Math.abs(
        Number(
          document.querySelector('[data-story-group="hamburg"]').style.getPropertyValue("--p"),
        ) - p,
      ) < 0.001
    );
  }, progress);
  await page.locator(".story-layer--drive img").evaluate((image) => image.decode());
}

async function geometry(page) {
  return page.evaluate(() => {
    const box = (selector) => document.querySelector(selector).getBoundingClientRect().toJSON();
    const truck = document.querySelector(".story-layer--drive");
    return {
      truck: box(".story-layer--drive"),
      image: box(".story-layer--drive img"),
      dock: box(".story-layer--dock"),
      harbour: box(".story-harbour"),
      quay: box(".story-harbour-film"),
      facts: box(".paper-hamburg__facts"),
      clip: getComputedStyle(truck).clipPath,
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
}

try {
  for (const [width, height, locale] of [
    [1512, 982, "en"],
    [1366, 768, "de"],
    [1024, 768, "en"],
    [768, 1024, "de"],
    [1920, 600, "en"],
    [2560, 1080, "de"],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/${locale}`);
    await page.waitForFunction(
      () => document.querySelector(".world-journey")?.dataset.status === "ready",
    );
    await page.evaluate(() => document.fonts.ready);
    const notice = page.locator(".cookie-notice button").last();
    if (await notice.isVisible()) await notice.click();
    let previous;
    let settled;
    for (const progress of [0.36, 0.4, 0.48, 0.55, 0.62, 0.69, 0.77, 0.85]) {
      await seek(page, progress);
      const state = await geometry(page);
      assert.equal(state.overflow, false, "Departure cannot widen the document");
      assert.equal(state.clip, "none", "The lorry must not be cut by its own moving box");
      assert.ok(state.dock.right < state.truck.left, "Dock stock must never cross the lorry");
      assert.ok(
        Math.abs(state.truck.bottom - state.dock.bottom) < 1,
        "Stock and tyres share a ground line",
      );
      assert.ok(
        state.quay.top < state.dock.top && state.quay.bottom >= state.dock.bottom,
        "The harbour reaches the dock stock even on tall screens",
      );
      assert.ok(
        Math.abs(state.image.left - state.truck.left) < 1,
        "The complete loaded image moves with its box",
      );
      assert.ok(state.truck.bottom <= height - 96, "Tyres clear the frame on short screens");
      if (previous) {
        assert.ok(state.truck.left >= previous.truck.left - 1, "The vehicle drives forward");
        assert.ok(
          Math.abs(
            state.dock.left - previous.dock.left - (state.harbour.left - previous.harbour.left),
          ) < 1,
          "Dock stock stays attached to the harbour",
        );
      }
      if (progress === 0.55) {
        settled = state;
        assert.ok(
          state.truck.right <= state.facts.left ||
            state.truck.left >= state.facts.right ||
            state.truck.bottom <= state.facts.top ||
            state.truck.top >= state.facts.bottom,
          "The settled lorry leaves the chapter facts clear",
        );
        await page.screenshot({ path: `/tmp/hugo-hamburg-${engine}-${width}.png` });
      }
      previous = state;
    }
    assert.ok(previous.truck.left > width, "The whole lorry leaves before the next chapter");
    await seek(page, 0.55);
    const reversed = await geometry(page);
    assert.ok(
      Math.abs(reversed.truck.left - settled.truck.left) < 1,
      "Reverse scroll restores the lorry",
    );
    assert.ok(
      Math.abs(reversed.dock.left - settled.dock.left) < 1,
      "Reverse scroll restores the dock",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(
      () => document.querySelector(".daylight")?.dataset.enhanced === "false",
    );
    await seek(page, 0.62);
    await page.waitForFunction(() =>
      [".story-layer--drive", ".story-harbour"].every((selector) => {
        const transform = getComputedStyle(document.querySelector(selector)).transform;
        return transform === "none" || new DOMMatrixReadOnly(transform).isIdentity;
      }),
    );
    const reducedStart = await geometry(page);
    await seek(page, 0.7);
    const reducedEnd = await geometry(page);
    assert.ok(
      Math.abs(reducedStart.truck.left - reducedEnd.truck.left) < 1,
      "Reduced motion keeps the lorry still",
    );
    assert.ok(
      Math.abs(reducedStart.harbour.left - reducedEnd.harbour.left) < 1,
      "Reduced motion keeps the harbour still",
    );
    assert.ok(
      await page.locator(".story-harbour-film video").evaluate((el) => el.paused),
      "Reduced motion pauses the loop",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator(".story__pinned").isVisible(), false);
    assert.ok(await page.locator('[data-mobile-chapter="hamburg"]').isVisible());
    await page.close();
    console.log(
      `PASS ${engine}: ${width}×${height} ${locale}, reverse scroll, reduced motion, mobile resize`,
    );
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
