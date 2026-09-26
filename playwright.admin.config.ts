import { defineConfig, devices } from "@playwright/test";
import { scryptSync } from "node:crypto";
// Isolated synthetic data and credentials, never the real admin database.
const password = "integration-test-password-only";
const salt = "integration-test-salt-only";
export default defineConfig({
  testDir:"./tests/admin-e2e",outputDir:".artifacts/admin-test-results",globalSetup:"./tests/admin-e2e/setup.ts",fullyParallel:false,workers:1,retries:0,reporter:"list",
  use:{baseURL:"http://localhost:3002",trace:"retain-on-failure"},
  projects:[{name:"desktop",use:{...devices["Desktop Chrome"]}},{name:"mobile",use:{...devices["iPhone 13"],defaultBrowserType:"chromium"}},{name:"mobile-safari",use:{...devices["iPhone 13"],defaultBrowserType:"webkit"}}],
  webServer:{command:"npm run start -- --port 3002",url:"http://localhost:3002",reuseExistingServer:false,timeout:60000,env:{DATABASE_URL:"",VERCEL:"",ADMIN_DATABASE_PATH:".artifacts/admin-integration.sqlite",ADMIN_PASSWORD_HASH:`${salt}:${scryptSync(password,salt,64).toString("hex")}`,ADMIN_SESSION_SECRET:"integration-test-secret-only-at-least-32-characters",CRON_SECRET:"integration-cron-secret-only",VERCEL_ENV:"",NEXT_PUBLIC_SITE_URL:"http://localhost:3002",SITE_INDEXABLE:"false"}},
});
