import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";

export default defineConfig({
  testDir: "./tests/voting-e2e", globalSetup: "./tests/voting-e2e/setup.ts",
  outputDir: ".artifacts/voting-test-results", fullyParallel: false, workers: 1,
  retries: 0, reporter: "list", timeout: 60000,
  use: { baseURL: "http://localhost:3012", trace: "retain-on-failure" },
  projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }, { name: "mobile-safari", use: { ...devices["iPhone 13"] } }],
  webServer: {
    command: `node node_modules/next/dist/bin/next start ${process.env.VOTING_BUILD_DIR || "."} --port 3012`,
    url: "http://localhost:3012", reuseExistingServer: false, timeout: 60000,
    env: { DATABASE_URL: "", VERCEL: "", VERCEL_ENV: "", ADMIN_DATABASE_PATH: resolve(".artifacts/voting-e2e.sqlite"), ADMIN_SESSION_SECRET: "synthetic-voting-test-secret-of-at-least-32-characters", NEXT_PUBLIC_SITE_URL: "http://localhost:3012", SITE_INDEXABLE: "false" },
  },
});
