import { expect, test } from "@playwright/test";
import { issueGuestAccess } from "../../src/commerce/checkout/guestAccess";

test("unconfigured production commerce offers contact without collecting payment details", async ({
  page,
}) => {
  for (const path of ["/en/checkout", "/en/account"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("here to help");
    await expect(
      page.locator("#main").getByRole("link", { name: "Contact us", exact: true }),
    ).toBeVisible();
    await expect(
      page.locator('input[autocomplete="cc-number"], input[autocomplete="cc-csc"]'),
    ).toHaveCount(0);
  }
});

test("only signed guest access exposes a seeded order on the active mock backend", async ({
  context,
  page,
}) => {
  const preview = "http://localhost:3427";
  // Establish that this is the active preview, not a trivially disabled order service.
  await page.goto(preview + "/en/account");
  await expect(page.locator('input[type="password"]')).toHaveCount(1);
  await context.addCookies([{ name: "ht_last_order", value: "HT-260928-7KQ2", url: preview }]);
  await page.goto(preview + "/en/checkout/confirmation?ref=HT-260928-7KQ2");
  await expect(page.locator(".order-details")).toHaveCount(0);
  await expect(page.getByText("Ada Demo", { exact: true })).toHaveCount(0);
  const token = issueGuestAccess(
    "HT-260928-7KQ2",
    Date.now(),
    "local-browser-test-only-never-deploy-0123456789",
  );
  await context.addCookies([{ name: "ht_last_order", value: token, url: preview }]);
  await page.reload();
  await expect(page.locator(".order-details")).toHaveCount(1);
});

test("OAuth callback cannot redirect to an arbitrary origin", async ({ request }) => {
  const state = encodeURIComponent("/\\example.invalid");
  const response = await request.get(`/api/commerce/auth/not-a-provider/callback?state=${state}`, {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(307);
  expect(new URL(response.headers().location!).origin).toBe("http://localhost:3426");
});

test("mock webhooks never acknowledge real payment events", async ({ request }) => {
  const response = await request.post("/api/commerce/payments/webhook", {
    data: { status: "paid" },
  });
  expect(response.status()).toBe(503);
});

test("catalogue cart survives a reload", async ({ page }) => {
  await page.goto("/en/products");
  const product = page.locator('[data-product-id="pardis-1121-basmati-indien"]');
  await product.getByRole("button", { name: /Add .* to/i }).click();
  await page.goto("/en/cart");
  await expect(page.locator("#main")).toContainText("Pardis");
  await page.reload();
  await expect(page.locator("#main")).toContainText("Pardis");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
