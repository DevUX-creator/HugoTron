import { expect, test, type Page } from "@playwright/test";

test("light pages have dark text before hydration, including on slow or failed script loads", async ({
  page,
}) => {
  await page.route("**/_next/**/*.js*", (route) => route.abort());
  for (const path of ["/en/products", "/en/contact", "/de/impressum"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("data-home-theme", "light");
    await expect(page.locator(".header__brand")).toHaveCSS("color", "rgb(32, 31, 28)");
  }
});

async function navigate(page: Page, path: string) {
  let link = page.locator(`a[href="${path}"]:visible`).first();
  if (!(await link.count())) {
    await page.locator(".header__menu:visible").click();
    link = page.locator(`.mobile-menu a[href="${path}"]:visible`).first();
  }
  await link.click();
  await page.waitForURL(`**${path}`);
}

test("story scroll, menu navigation and history cannot recolour another page", async ({ page }) => {
  // Several scene mounts plus browser-history restoration can exceed the default 30 seconds
  // on CI's software renderer. Assertions still retain their normal short timeout.
  test.setTimeout(90_000);
  await page.addInitScript(() => {
    localStorage.setItem("hugo.storage-notice.v1", "dismissed");
    localStorage.setItem("hugo-sound-enabled", "false");
  });
  await page.goto("/en/products/rice");
  const root = page.locator("html");
  for (let round = 0; round < 2; round++) {
    await page.evaluate(() => scrollTo(0, innerHeight * 5));
    await expect(root).toHaveAttribute("data-world-paper", "");
    await expect(root).toHaveAttribute("data-home-theme", "light");

    // Exercise the scroll-to-top events that also run while a page is departing.
    await page.evaluate(() => {
      const interval = setInterval(() => window.dispatchEvent(new Event("scroll")), 16);
      setTimeout(() => clearInterval(interval), 1500);
    });
    await navigate(page, "/en/contact");
    await expect(root).toHaveAttribute("data-home-theme", "light");
    await expect(root).not.toHaveAttribute("data-world-paper");
    await expect(page.locator(".header__brand")).toHaveCSS("color", "rgb(32, 31, 28)");
    await page.evaluate(() => window.dispatchEvent(new Event("resize")));
    await expect(root).toHaveAttribute("data-home-theme", "light");

    await page.goBack();
    await expect(page).toHaveURL(/\/en\/products\/rice$/);
    await page.evaluate(() => scrollTo(0, innerHeight * 5));
    await expect(root).toHaveAttribute("data-world-paper", "");
    await navigate(page, "/en/wholesale");
    await expect(root).toHaveAttribute("data-home-theme", "dark");
    await expect(root).not.toHaveAttribute("data-world-paper");
    await expect(root).toHaveCSS("background-color", "rgb(10, 19, 32)");
    await expect(page.locator(".header__brand")).toHaveCSS("color", "rgb(236, 235, 231)");
    await page.goBack();
    await expect(page).toHaveURL(/\/en\/products\/rice$/);
  }
});
