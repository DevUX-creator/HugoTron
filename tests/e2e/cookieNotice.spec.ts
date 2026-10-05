import { expect, test } from "@playwright/test";

test("storage notice links to existing policies and remembers dismissal", async ({ page }) => {
  await page.goto("/en/products");
  const notice = page.getByRole("complementary", { name: "Cookies & your privacy" });
  await expect(notice).toBeVisible();
  await expect(notice.getByRole("link", { name: "Terms", exact: true })).toHaveAttribute(
    "href",
    "/en/terms",
  );
  await expect(notice.getByRole("link", { name: "Privacy", exact: true })).toHaveAttribute(
    "href",
    "/en/privacy",
  );
  const bounds = await notice.boundingBox();
  const viewport = page.viewportSize()!;
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
  await notice.getByRole("button", { name: "Understood" }).click();
  await expect(notice).toHaveCount(0);
  await page.reload();
  await expect(notice).toHaveCount(0);
  await page.goto("/en/terms");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Geschäftsbedingungen");
});

test("German notice remains dismissible when browser storage cannot be written", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage unavailable", "QuotaExceededError");
    };
  });
  await page.goto("/de/sortiment");
  const notice = page.getByRole("complementary", { name: "Cookies & Datenschutz" });
  await expect(notice).toBeVisible();
  await notice.getByRole("button", { name: "Verstanden" }).click();
  await expect(notice).toHaveCount(0);
});
