import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  testMatch: "e2e.spec.ts",
  timeout: 30_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
    ...devices["Pixel 7"],
  },
  webServer: {
    command: "npm run build && npm start",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
