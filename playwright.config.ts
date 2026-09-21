import { defineConfig, devices } from "@playwright/test";
// Point at a running dev server to catch React's development-only warnings.
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
export default defineConfig({
  testDir: "./tests/e2e", fullyParallel: true, retries: 0,
  reporter: "list",
  use: { baseURL: externalBaseURL || "http://localhost:3001", trace: "retain-on-failure" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }, { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } }],
  webServer: externalBaseURL ? undefined : { command: "npm run start -- --port 3001", url: "http://localhost:3001", reuseExistingServer: true, timeout: 60000 },
});
