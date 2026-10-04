import assert from "node:assert/strict";
import { chromium, webkit } from "@playwright/test";
const base = process.argv[2] ?? "http://localhost:3000",
  engine = process.argv[3] ?? "chromium";
const browser = await (engine === "webkit" ? webkit : chromium).launch(
  engine === "webkit" ? {} : { args: ["--enable-gpu", "--use-angle=metal"] },
);
const errors = [];
const state = (p) => p.locator(".delivery-map").evaluate((e) => ({ ...e.dataset }));
const energy = (p) =>
  p.locator(".delivery-map__region-energy").evaluate((canvas) => {
    const context = canvas.getContext("2d");
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const svg = document.querySelector(".delivery-map__canvas");
    const country = new Path2D(document.querySelector(".delivery-map__germany").getAttribute("d"));
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    const bounds = canvas.getBoundingClientRect();
    const inverse = svg.getScreenCTM().inverse();
    let lit = 0,
      outside = 0,
      signature = 0;
    for (let y = 0; y < canvas.height; y += 8) {
      for (let x = 0; x < canvas.width; x += 8) {
        const alpha = pixels[(y * canvas.width + x) * 4 + 3];
        if (alpha < 3) continue;
        lit++;
        signature += (x + y) * alpha;
        const point = new DOMPoint(
          bounds.x + (x * bounds.width) / canvas.width,
          bounds.y + (y * bounds.height) / canvas.height,
        ).matrixTransform(inverse);
        if (!context.isPointInPath(country, point.x, point.y, "evenodd")) outside++;
      }
    }
    context.restore();
    return {
      ...canvas.dataset,
      lit,
      outside,
      signature,
      width: canvas.width,
      cssWidth: bounds.width,
    };
  });
const idle = async (p) => {
  let before = await state(p);
  for (let i = 0; i < 18; i++) {
    await p.waitForTimeout(300);
    const after = await state(p);
    if (after.frames === before.frames) return after;
    before = after;
  }
  assert.fail("vehicle animation did not settle");
};
const visibility = (p, hidden) =>
  p.evaluate((h) => {
    if (h) Object.defineProperty(document, "hidden", { configurable: true, value: true });
    else delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
try {
  const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(base + "/en/delivery");
  await p.waitForSelector(".delivery-map[data-ready]");
  const initial = await state(p);
  assert.equal(initial.zoom, "4.500");
  assert.equal(initial.run, "ready");
  assert.equal(await p.locator("[data-stop]").count(), 10);
  assert.equal(await p.locator("#delivery-current-trail").count(), 0, "no accumulated map trail");
  await p.keyboard.down("ArrowDown");
  await p.waitForTimeout(1000);
  await p.keyboard.up("ArrowDown");
  const released = await state(p);
  await p.waitForTimeout(180);
  const coast = await state(p);
  assert.ok(Number(coast.carY) > Number(released.carY) + 1, "the van coasts after release");
  assert.ok(Number(coast.velocity) < Number(released.velocity));
  await idle(p);
  const parked = await energy(p);
  assert.equal(parked.rings, "0", "pulses settle after driving stops");
  assert.equal(parked.paths, "1", "the parked van's state keeps a still glow");
  assert.ok(parked.lit > 0);
  assert.equal((await state(p)).run, "running");
  assert.equal(await p.locator(".delivery-van__thrust").getAttribute("opacity"), "0");
  const label = await p.locator(".delivery-map__location").boundingBox(),
    compass = await p.locator(".delivery-compass").boundingBox();
  assert.ok(label.y + label.height <= compass.y);
  await p.keyboard.down("ArrowRight");
  await p.waitForTimeout(120);
  const turning = await state(p);
  assert.ok(
    Number(turning.heading) > 95 && Number(turning.heading) < 180,
    "heading turns progressively",
  );
  await p.waitForTimeout(700);
  const growing = await energy(p);
  assert.ok(Number(growing.paths) > 0 && Number(growing.paths) <= 2);
  assert.ok(growing.lit > 30, "the active region has a visible, restrained pulse");
  assert.ok(growing.outside < growing.lit * 0.02 + 2, "regional light stays within Germany");
  assert.ok(growing.width <= growing.cssWidth * 1.5 + 1, "canvas resolution is capped");
  await p.waitForTimeout(150);
  assert.notEqual(
    (await energy(p)).signature,
    growing.signature,
    "the regional pulse changes gently",
  );
  assert.equal((await energy(p)).region, (await state(p)).region);
  await p.screenshot({ path: `/tmp/delivery-region-energy-${engine}.png` });
  await p.keyboard.up("ArrowRight");
  await idle(p);
  assert.ok(Math.abs(Number((await state(p)).heading) - 90) < 1);
  assert.equal(await p.locator(".delivery-compass__heading").textContent(), "E");
  const beforeHidden = await state(p);
  await visibility(p, true);
  await p.waitForTimeout(500);
  assert.equal((await state(p)).elapsed, beforeHidden.elapsed);
  await visibility(p, false);
  // Timer continues during an intentional stop, without keeping the graphics RAF awake.
  const settled = await idle(p);
  await p.waitForTimeout(400);
  assert.equal((await state(p)).frames, settled.frames);
  assert.ok(Number((await state(p)).elapsed) > Number(settled.elapsed));
  await p.getByRole("button", { name: "Retry the delivery run" }).click();
  await idle(p);
  assert.equal((await state(p)).run, "ready");
  assert.equal((await state(p)).collected, "0");
  assert.equal((await state(p)).carY, initial.carY);
  for (let i = 0; i < 6; i++) await p.getByRole("button", { name: "Zoom out" }).click();
  await idle(p);
  // Drive real routes to all illustrative clients, collecting by actual position.
  for (const id of ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]) {
    const stop = p.locator(`[data-stop="${id}"]`);
    if ((await stop.getAttribute("data-collected")) === "true") continue;
    const locate = () =>
      stop.evaluate((e) => {
        const p = new DOMPoint(0, 0).matrixTransform(e.getScreenCTM());
        return { x: p.x, y: p.y };
      });
    let point = await locate();
    // At a closer zoom, pan a distant stop clear of the fixed navigation and copy.
    if (point.x < 500 || point.x > 1100 || point.y < 170 || point.y > 700) {
      await p.mouse.move(900, 240);
      await p.mouse.down();
      await p.mouse.move(900 + 850 - point.x, 240 + 340 - point.y, { steps: 12 });
      await p.waitForTimeout(120);
      await p.mouse.up();
      await idle(p);
      point = await locate();
    }
    await p.mouse.click(point.x, point.y);
    try {
      await p.waitForFunction(
        (id) => document.querySelector(`[data-stop="${id}"]`)?.dataset.collected === "true",
        id,
        { timeout: 25000 },
      );
    } catch (error) {
      console.error({ id, point, state: await state(p) });
      await p.screenshot({ path: `/tmp/delivery-failure-${engine}.png` });
      throw error;
    }
    await idle(p);
  }
  const complete = await state(p);
  assert.equal(complete.collected, "10");
  assert.equal(complete.run, "complete");
  await p.waitForTimeout(350);
  assert.equal((await state(p)).elapsed, complete.elapsed);
  assert.match(await p.locator(".delivery-run__label").textContent(), /All delivered/);
  await p.screenshot({ path: `/tmp/delivery-complete-${engine}.png` });
  await p.getByRole("button", { name: "Retry the delivery run" }).click();
  await idle(p);
  assert.equal(await p.locator('[data-stop][data-collected="true"]').count(), 0);
  const speed = p.locator(".delivery-map__speed");
  await speed.click();
  await speed.click();
  assert.equal((await state(p)).speed, "2");
  await p.keyboard.down("ArrowDown");
  await p.waitForTimeout(1000);
  await p.keyboard.up("ArrowDown");
  const fast = await idle(p);
  assert.ok(Number(fast.carY) - Number(initial.carY) > 40);
  await p.getByRole("tab").first().press("ArrowDown");
  assert.equal(await p.getByRole("tab").nth(1).getAttribute("aria-selected"), "true");
  await p.close();
  const mobile = await browser.newPage({
    viewport: { width: 320, height: 640 },
    isMobile: true,
    hasTouch: true,
  });
  mobile.on("pageerror", (e) => errors.push(e.message));
  await mobile.addInitScript(() => localStorage.setItem("hugo.delivery.controls.v1", "seen"));
  await mobile.goto(base + "/en/delivery");
  await mobile.waitForSelector(".delivery-map[data-ready]");
  const pad = mobile.getByRole("button", { name: "Drive south" }),
    box = await pad.boundingBox();
  await mobile.mouse.move(box.x + 22, box.y + 22);
  await mobile.mouse.down();
  await mobile.waitForTimeout(1000);
  const mobileEnergy = await energy(mobile);
  assert.ok(Number(mobileEnergy.paths) > 0 && Number(mobileEnergy.paths) <= 2);
  assert.ok(mobileEnergy.lit > 15);
  await mobile.screenshot({ path: `/tmp/delivery-region-energy-mobile-${engine}.png` });
  await mobile.mouse.up();
  await idle(mobile);
  assert.ok(Number((await state(mobile)).carY) > 310);
  const panel = await mobile.locator(".delivery-map__instruments").boundingBox(),
    copy = await mobile.locator(".delivery-explorer__content").boundingBox();
  assert.ok(
    panel.y + panel.height < copy.y,
    `HUD and copy do not overlap: ${JSON.stringify({ panel, copy })}`,
  );
  await mobile.screenshot({ path: `/tmp/delivery-drive-mobile-${engine}.png` });
  await mobile.emulateMedia({ reducedMotion: "reduce" });
  await mobile.keyboard.down("ArrowRight");
  await mobile.waitForTimeout(300);
  const still = await energy(mobile);
  assert.equal(still.rings, "0", "reduced motion has no pulses");
  assert.equal(still.paths, "1", "reduced motion keeps a still highlight");
  await mobile.keyboard.up("ArrowRight");
  await idle(mobile);
  await mobile.close();
  assert.deepEqual(errors, []);
  console.log(
    `${engine}: closer zoom, soft geographic region pulses, steering/coasting, checkpoints, timer/pause/completion/retry, speed, compass, idle sleep, reduced motion and mobile layout passed`,
  );
} finally {
  await browser.close();
}
