/** Exercise the real audio graph, trusted map controls and the shared mute button. */
import assert from "node:assert/strict";
import { chromium, webkit } from "@playwright/test";
const base = process.argv[2] ?? "http://localhost:3000",
  engine = process.argv[3] ?? "chromium";
const browser = await (engine === "webkit" ? webkit : chromium).launch(
  engine === "webkit" ? {} : { args: ["--enable-gpu", "--use-angle=metal"] },
);
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const requests = [],
    errors = [];
  page.on("request", (r) => {
    if (r.url().includes("/audio/delivery/")) requests.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    localStorage.setItem("hugo-sound-enabled", "false");
    window.vehicleAudio = [];
    const create = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function () {
      const source = create.call(this),
        start = source.start.bind(source),
        stop = source.stop.bind(source);
      const connect = source.connect.bind(source);
      let destination;
      source.connect = (node, ...args) => {
        destination = node;
        return connect(node, ...args);
      };
      source.start = (...args) => {
        const entry = {
          source,
          duration: source.buffer?.duration,
          loop: source.loop,
          stopped: false,
          gain: destination.gain,
        };
        window.vehicleAudio.push(entry);
        source.addEventListener("ended", () => {
          entry.stopped = true;
        });
        start(...args);
      };
      source.stop = (...args) => {
        const entry = window.vehicleAudio.find((v) => v.source === source);
        if (entry) entry.stopRequested = true;
        stop(...args);
      };
      return source;
    };
  });
  await page.goto(base + "/en/delivery");
  await page.waitForSelector(".delivery-map[data-ready]");
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(350);
  await page.keyboard.up("ArrowDown");
  await page.waitForTimeout(700);
  assert.equal(requests.length, 0, "muted driving does not fetch or play car sounds");
  await page.locator(".sound-toggle").click();
  await page.waitForTimeout(600);
  await page.locator(".delivery-map__canvas").focus();
  await page.keyboard.down("ArrowDown");
  await page.waitForFunction(() =>
    window.vehicleAudio.some((v) => !v.loop && v.duration > 4.4 && v.duration < 4.7),
  );
  await page.waitForFunction(
    () => window.vehicleAudio.some((v) => v.loop && v.duration > 7.4 && v.duration < 7.8),
    null,
    { timeout: 12000 },
  );
  assert.equal(requests.length, 2);
  assert.equal(
    await page.evaluate(
      () => window.vehicleAudio.find((v) => v.loop && v.duration > 8)?.gain.value,
    ),
    0,
    "background music fades out while driving",
  );
  assert.ok(
    await page.evaluate(
      () =>
        window.vehicleAudio.find((v) => v.loop && v.duration > 7.4 && v.duration < 7.8)?.gain
          .value <= 0.21,
    ),
    "engine mix is quieter",
  );
  const loop = (p) =>
    p.evaluate(() =>
      window.vehicleAudio.findLast((v) => v.loop && v.duration > 7.4 && v.duration < 7.8),
    );
  assert.ok((await loop(page)).duration > 7.4);
  await page.keyboard.up("ArrowDown");
  await page.waitForFunction(() =>
    window.vehicleAudio
      .filter((v) => v.loop && v.duration > 7.4 && v.duration < 7.8)
      .every((v) => v.stopped),
  );
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(300);
  assert.equal(
    await page.evaluate(
      () =>
        window.vehicleAudio.filter((v) => !v.loop && v.duration > 4.4 && v.duration < 4.7).length,
    ),
    1,
    "starter plays only once",
  );
  await page.locator(".sound-toggle").click();
  await page.waitForTimeout(350);
  assert.equal(
    await page.evaluate(() =>
      window.vehicleAudio
        .filter((v) => v.duration > 7.4 && v.duration < 7.8)
        .every((v) => v.stopped),
    ),
    true,
  );
  await page.keyboard.up("ArrowRight");
  assert.deepEqual(errors, []);
  console.log(
    `${engine}: lazy car sounds, starter-to-loop sequencing, stop fade, first-start-only and shared mute passed`,
  );
  await page.close();
} finally {
  await browser.close();
}
