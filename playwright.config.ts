import { defineConfig, devices } from "@playwright/test";

/**
 * One end-to-end smoke test, run against the real dev server in a real browser: the class of
 * bug this suite guards (native browser default actions, such as mousedown stealing focus from
 * a prompt input) cannot be reproduced in jsdom, so it needs an actual Chromium.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    port: 5173,
    reuseExistingServer: true,
  },
});
