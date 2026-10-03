/** Production mobile scroll sample: node scripts/profile-paper-scroll.mjs URL report [isolate] */
import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const base = process.argv[2] ?? "http://localhost:3213";
const report = process.argv[3] ?? "/tmp/hugo-paper-scroll.json";
const isolate = process.argv[4] === "isolate";
const browser = await chromium.launch({
  args: ["--enable-gpu", "--use-angle=metal", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
const cdp = await page.context().newCDPSession(page);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const rows = [];
const metricNames = [
  "TaskDuration",
  "ScriptDuration",
  "LayoutDuration",
  "RecalcStyleDuration",
  "LayoutCount",
  "RecalcStyleCount",
];
async function metrics() {
  const { metrics } = await cdp.send("Performance.getMetrics");
  return Object.fromEntries(
    metrics.filter((m) => metricNames.includes(m.name)).map((m) => [m.name, m.value]),
  );
}
try {
  await page.goto(`${base}/en`);
  await page.waitForFunction(
    () => document.querySelector(".world-journey")?.dataset.status === "ready",
  );
  await page.evaluate(() =>
    scrollTo(0, document.querySelector(".paper-buying").getBoundingClientRect().top + scrollY),
  );
  await page.waitForTimeout(1500);
  await cdp.send("Performance.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const variants = [{ name: "current", css: "" }];
  if (isolate)
    variants.push(
      {
        name: "no-live-image-filters",
        css: ".story-layer img,.story-harbour-film video { filter: none !important; }",
      },
      {
        name: "no-live-filters-or-layer-motion",
        css: ".story-layer img,.story-harbour-film video { filter: none !important; } .story-layer,.story-layer__motion,.story-layer img { animation: none !important; transition: none !important; clip-path: none !important; transform: none !important; translate: none !important; rotate: none !important; }",
      },
    );
  for (const variant of variants) {
    const style = variant.css ? await page.addStyleTag({ content: variant.css }) : undefined;
    await page.evaluate(() => {
      const mobile = document.querySelector(".mobile-story");
      const start = mobile?.getBoundingClientRect().width
        ? mobile
        : document.querySelector(".paper-origin");
      scrollTo(0, start.getBoundingClientRect().top + scrollY + 200);
    });
    await page.waitForTimeout(600);
    const before = await metrics();
    const sample = await page.evaluate(async () => {
      const mobile = document.querySelector(".mobile-story");
      const first = mobile?.getBoundingClientRect().width
        ? mobile
        : document.querySelector(".paper-origin");
      const start = first.getBoundingClientRect().top + scrollY + 200;
      const end =
        document.querySelector(".paper-buying").getBoundingClientRect().top + scrollY + 200;
      const frames = [];
      let mutations = 0;
      const observer = new MutationObserver((records) => {
        mutations += records.length;
      });
      observer.observe(document.querySelector(".paper-story"), { attributes: true, subtree: true });
      for (const reverse of [false, true])
        await new Promise((resolve) => {
          let began, previous;
          function tick(now) {
            began ??= now;
            if (previous !== undefined) frames.push(now - previous);
            previous = now;
            const progress = Math.min(1, (now - began) / 6000);
            scrollTo(0, start + (end - start) * (reverse ? 1 - progress : progress));
            if (progress < 1) requestAnimationFrame(tick);
            else resolve();
          }
          requestAnimationFrame(tick);
        });
      observer.disconnect();
      frames.sort((a, b) => a - b);
      return {
        distance: end - start,
        frames: frames.length,
        frameP95ms: frames[Math.floor(frames.length * 0.95)],
        over34ms: frames.filter((x) => x > 34).length,
        mutations,
        oversizedImages: [
          ...document.querySelectorAll(".story__visuals img, .mobile-story img"),
        ].filter((e) => e.getBoundingClientRect().width > innerWidth).length,
        liveFilteredImages: [
          ...document.querySelectorAll(".story__visuals img, .mobile-story img"),
        ].filter(
          (e) => e.getBoundingClientRect().width > 0 && getComputedStyle(e).filter !== "none",
        ).length,
      };
    });
    const after = await metrics();
    const costs = Object.fromEntries(
      metricNames.map((name) => [name, +(after[name] - before[name]).toFixed(4)]),
    );
    const row = { variant: variant.name, ...sample, ...costs };
    rows.push(row);
    console.log(JSON.stringify(row));
    await style?.evaluate((e) => e.remove());
  }
} finally {
  await writeFile(
    report,
    JSON.stringify({ base, viewport: "390x844 DPR3", cpuThrottle: 4, rows, errors }, null, 2),
  );
  await browser.close();
}
