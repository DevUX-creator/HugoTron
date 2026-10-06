/** Mobile cube detail, quality transitions and bounded live GPU allocations. */
import assert from "node:assert/strict";
import { chromium, webkit, expect } from "@playwright/test";
const base = process.argv[2] ?? "http://localhost:3000";
for (const [name, engine] of Object.entries({ chromium, webkit })) {
  const browser = await engine.launch(
    name === "chromium"
      ? { args: ["--enable-gpu", "--use-angle=metal", "--enable-unsafe-swiftshader"] }
      : {},
  );
  try {
    for (const [width, height, dpr] of name === "chromium"
      ? [
          [390, 844, 3],
          [440, 1100, 3],
          [1440, 1000, 2],
        ]
      : [[430, 932, 3]]) {
      const page = await browser.newPage({
        viewport: { width, height },
        deviceScaleFactor: dpr,
        isMobile: width < 768,
        hasTouch: width < 768,
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error" && /THREE|Shader|WebGL|GL_INVALID/.test(m.text()))
          errors.push(m.text());
      });
      await page.addInitScript(() => {
        localStorage.setItem("hugo.storage-notice.v1", "dismissed");
        localStorage.setItem("hugo-sound-enabled", "false");
        window.cubeResources = [];
        const contexts = new WeakSet(),
          original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (...args) {
          const gl = original.apply(this, args);
          if (!gl || !args[0].startsWith("webgl") || contexts.has(gl)) return gl;
          contexts.add(gl);
          const stats = {
            canvas: new WeakRef(this),
            Texture: 0,
            Framebuffer: 0,
            Renderbuffer: 0,
            Buffer: 0,
          };
          window.cubeResources.push(stats);
          for (const kind of ["Texture", "Framebuffer", "Renderbuffer", "Buffer"]) {
            const create = gl["create" + kind].bind(gl),
              remove = gl["delete" + kind].bind(gl),
              alive = new WeakSet();
            gl["create" + kind] = (...a) => {
              const x = create(...a);
              if (x) {
                alive.add(x);
                stats[kind]++;
              }
              return x;
            };
            gl["delete" + kind] = (x) => {
              if (x && alive.delete(x)) stats[kind]--;
              return remove(x);
            };
          }
          return gl;
        };
      });
      await page.goto(base + "/en");
      const scene = page.locator(".world__scene");
      await expect(scene).toHaveAttribute("data-arrival", "1.000", { timeout: 60000 });
      await expect(scene).toHaveAttribute("data-cube-formation", "1.000");
      const buffer = () =>
        scene.evaluate((e) => ({
          w: e.querySelector("canvas").width,
          h: e.querySelector("canvas").height,
        }));
      const expectedRatio =
        width < 768 ? Math.min(dpr, 2, Math.sqrt(1800000 / (width * height))) : Math.min(dpr, 1.5);
      const initial = await buffer();
      assert.equal(initial.w, Math.floor(width * expectedRatio));
      assert.equal(initial.h, Math.floor(height * expectedRatio));
      if (width < 768) assert(initial.w * initial.h <= 1800000, "mobile pixel budget");
      await page.screenshot({ path: `/tmp/hugo-detail-${name}-${width}.png` });
      const snapshot = () =>
        page.evaluate(() => {
          const r = window.cubeResources.find((s) => s.canvas.deref()?.closest(".world__scene"));
          return {
            Texture: r.Texture,
            Framebuffer: r.Framebuffer,
            Renderbuffer: r.Renderbuffer,
            Buffer: r.Buffer,
          };
        });
      const flight = async () => {
        await page.evaluate(() => scrollTo(0, innerHeight * 1.1));
        await expect
          .poll(async () => Number(await scene.getAttribute("data-chapter")))
          .toBeGreaterThan(0.7);
        await expect(scene).toHaveAttribute("data-core-presence", "0.000");
        if (width < 768)
          await expect.poll(async () => (await buffer()).w).toBe(Math.floor(width * 1.25));
      };
      const home = async () => {
        await page.evaluate(() => scrollTo(0, 0));
        await expect(scene).toHaveAttribute("data-chapter", "0.000");
        await expect(scene).toHaveAttribute("data-core-presence", "1.000");
        assert.deepEqual(await buffer(), initial);
      };
      await flight();
      await home();
      const resources = await snapshot();
      for (let i = 0; i < 3; i++) {
        await flight();
        await home();
        assert.deepEqual(
          await snapshot(),
          resources,
          "GPU resources plateau across quality changes",
        );
      }
      if (width < 768) {
        await page.getByRole("button", { name: "Next product category" }).tap();
        await expect(scene).toHaveAttribute("data-core-presence", "0.000");
        await expect.poll(async () => (await buffer()).w).toBe(Math.floor(width * 1.25));
        await page.getByRole("button", { name: "Previous product category" }).tap();
        await expect(scene).toHaveAttribute("data-core-presence", "1.000");
        assert.deepEqual(await buffer(), initial);
      }
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.waitForTimeout(500);
      const resting = await scene.getAttribute("data-cube-lift");
      await page.waitForTimeout(500);
      assert.equal(await scene.getAttribute("data-cube-lift"), resting);
      assert.deepEqual(errors, []);
      console.log(
        `${name} ${width}x${height}: hero ${initial.w}x${initial.h}; journey/product scale restored; GPU counts stable ${JSON.stringify(resources)}; no shader errors; reduced motion passed`,
      );
      await page.close();
    }
  } finally {
    await browser.close();
  }
}
