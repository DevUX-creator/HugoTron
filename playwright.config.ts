import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  ...(process.env.CI ? { workers: 2 } : {}),
  use: { baseURL: "http://localhost:3426", trace: "retain-on-failure", reducedMotion: "reduce" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
  webServer: [
    {
      command: "pnpm exec next start --hostname localhost --port 3426",
      url: "http://localhost:3426/en/products",
      reuseExistingServer: false,
      env: {
        COMMERCE_BACKEND: "mock",
        COMMERCE_ALLOW_MOCK: "false",
        NEXT_PUBLIC_COMMERCE_DEV_TOOLS: "false",
      },
      timeout: 60_000,
    },
    {
      command: "pnpm exec next start --hostname localhost --port 3427",
      url: "http://localhost:3427/en/account",
      reuseExistingServer: false,
      env: {
        COMMERCE_BACKEND: "mock",
        COMMERCE_ALLOW_MOCK: "true",
        COMMERCE_COOKIE_SECRET: "local-browser-test-only-never-deploy-0123456789",
        NEXT_PUBLIC_SITE_URL: "https://preview.example.invalid",
        NEXT_PUBLIC_COMMERCE_DEV_TOOLS: "false",
      },
      timeout: 60_000,
    },
  ],
});
