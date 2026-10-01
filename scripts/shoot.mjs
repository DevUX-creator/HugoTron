/**
 * Measure and photograph the running dev server.
 *
 * The browser tooling available in this session cannot screenshot or run
 * scripts against localhost, which meant a long run of changes being made
 * blind — and a layout bug (a film cropped to 40% of its height) surviving
 * three rounds of guessing because nobody could see it. Playwright is already
 * a devDependency; this drives it directly.
 *
 *   pnpm dev                 # in one terminal
 *   node scripts/shoot.mjs   # prints boxes, writes the screenshot
 */
import { chromium } from "@playwright/test";
const out = process.env.SHOOT_OUT ?? ".";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1728, height: 912 } });
await p.goto("http://localhost:3000/en", { waitUntil: "networkidle" });
await p.waitForTimeout(2500);
const box = async (sel) =>
  p.evaluate((s) => {
    const e = document.querySelector(s);
    if (!e) return null;
    const r = e.getBoundingClientRect();
    const c = getComputedStyle(e);
    return {
      t: Math.round(r.top),
      b: Math.round(r.bottom),
      l: Math.round(r.left),
      r: Math.round(r.right),
      w: Math.round(r.width),
      h: Math.round(r.height),
      pos: c.position,
      overflow: c.overflow,
      padT: c.paddingTop,
      padB: c.paddingBottom,
      fit: c.objectFit,
    };
  }, sel);
const info = {
  viewport: await p.evaluate(() => ({
    vw: innerWidth,
    vh: innerHeight,
    docH: document.documentElement.scrollHeight,
  })),
  section: await box(".opening"),
  container: await box(".opening > .container-wide"),
  film: await box(".opening__film"),
  video: await box(".behind-film video"),
  band: await box(".opening__band"),
  title: await box(".opening__title"),
  rule: await box(".opening__rule"),
  points: await box(".opening__points"),
  videoNatural: await p.evaluate(() => {
    const v = document.querySelector(".behind-film video");
    return v ? { w: v.videoWidth, h: v.videoHeight, ready: v.readyState } : null;
  }),
};
console.log(JSON.stringify(info, null, 1));
await p.screenshot({ path: `${out}/page.png` });
await b.close();
