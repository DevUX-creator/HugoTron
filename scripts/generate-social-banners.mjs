/** Compose approved AI background masters with the real vector wordmark and local font.
 * Run manually after artwork/copy changes; no browser or generator runs on site requests.
 */
import { readFile, mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const copy = JSON.parse(await readFile("assets-src/social/copy.json", "utf8"));
const font = (await readFile("src/fonts/Mersad-Variable.woff2")).toString("base64");
const logoSource = await readFile("src/components/layout/BrandLogo.tsx", "utf8");
const logo = logoSource
  .match(/<svg[\s\S]*?<\/svg>/)[0]
  .replace(/className=/g, "class=")
  .replace(/fillRule=/g, "fill-rule=")
  .replace(/clipRule=/g, "clip-rule=");
const escape = (text) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  for (const [key, locales] of Object.entries(copy)) {
    const background = (await readFile(`assets-src/social/${key}.png`)).toString("base64");
    for (const [locale, text] of Object.entries(locales)) {
      await page.setContent(`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><style>
        @font-face { font-family: Mersad; src: url(data:font/woff2;base64,${font}); font-weight: 100 900; }
        * { box-sizing: border-box; } body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #07111c; color: #f3f4f2; font-family: Mersad, sans-serif; }
        .art { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .shade { position: absolute; inset: 0; background: linear-gradient(90deg,rgba(4,11,20,.48),transparent 65%); }
        .frame { position: absolute; inset: 26px; border: 1px solid rgba(195,214,239,.26); }
        .frame:after { content: ''; position: absolute; top: 0; right: 0; width: 16px; height: 16px; background: rgba(195,214,239,.6); clip-path: polygon(0 0,100% 0,100% 100%); }
        .logo { position: absolute; top: 55px; left: 60px; } .logo svg { width: 236px; height: auto; display: block; }
        main { position: absolute; left: 60px; top: 205px; width: 590px; }
        .label { margin: 0 0 22px; font-size: 13px; font-weight: 450; letter-spacing: 3px; color: #bccfe6; }
        h1 { font-size: 60px; font-weight: 430; line-height: 1.06; letter-spacing: -2.5px; margin: 0; }
        h1 span { display: block; white-space: nowrap; }
        .note { margin: 24px 0 0; font-size: 17px; font-weight: 400; color: #c2cfdd; }
        footer { position: absolute; bottom: 51px; left: 60px; right: 60px; display: flex; justify-content: space-between; font-size: 13px; letter-spacing: 1px; color: #bccfe6; }
      </style></head><body>
        <img class="art" src="data:image/png;base64,${background}" alt=""><div class="shade"></div><div class="frame"></div>
        <div class="logo">${logo}</div>
        <main><p class="label">${escape(text.label)}</p><h1>${text.title.map((line) => `<span>${escape(line)}</span>`).join("")}</h1><p class="note">${escape(text.note)}</p></main>
        <footer><span>HUGO-TRON.COM</span><span>HAMBURG</span></footer>
      </body></html>`);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map((image) => image.decode()));
        const title = document.querySelector("h1");
        // German compounds keep the same composition without clipping the type.
        while (title.scrollWidth > 590 && parseFloat(getComputedStyle(title).fontSize) > 44) {
          title.style.fontSize = `${parseFloat(getComputedStyle(title).fontSize) - 1}px`;
        }
        if (title.scrollWidth > 590) throw new Error("Share title exceeds its safe area");
      });
      await mkdir(`public/social/${locale}`, { recursive: true });
      await page.screenshot({
        path: `public/social/${locale}/${key}.jpg`,
        type: "jpeg",
        quality: 90,
      });
      console.log(`${locale}/${key}.jpg — 1200 × 630`);
    }
  }
} finally {
  await browser.close();
}
