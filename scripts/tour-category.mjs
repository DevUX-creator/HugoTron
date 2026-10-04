/** Screenshot tour of a category page at fixed scroll stops, desktop and phone. */
import { chromium } from "@playwright/test";
const base = process.argv[2] ?? "http://localhost:3000";
const path = process.argv[3] ?? "/en/products/rice";
const out = process.argv[4] ?? ".";
const browser = await chromium.launch({ args: ["--enable-gpu", "--use-angle=metal"] });
const errors = [];
for (const [name, viewport, mobile] of [
  ["desk", { width: 1440, height: 900 }, false],
  ["phone", { width: 390, height: 844 }, true],
]) {
  const page = await browser.newPage({ viewport, isMobile: mobile, hasTouch: mobile });
  page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`${name} console: ${m.text()}`));
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const stops = Number(process.env.STOPS ?? (mobile ? 10 : 14));
  for (let i = 0; i < stops; i++) {
    await page.evaluate(
      (y) => window.scrollTo(0, y),
      Math.round(((total - viewport.height) * i) / (stops - 1)),
    );
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${out}/${name}-${String(i).padStart(2, "0")}.png` });
  }
  await page.close();
}
await browser.close();
console.log(errors.length ? errors.join("\n") : "no errors");
