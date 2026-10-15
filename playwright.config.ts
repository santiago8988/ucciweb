import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against a production build (`next build` with
// output: "standalone"). By default they start `.next/standalone/server.js`
// on port 3100; set E2E_BASE_URL to test an already running site instead
// (e.g. https://ucciweb.vercel.app — only read-only checks run there).
const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
const startServer = !process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    // Locally, PW_CHANNEL=chrome reuses the installed Chrome instead of a download.
    ...(process.env.PW_CHANNEL && { channel: process.env.PW_CHANNEL }),
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 780 } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: startServer
    ? {
        command: "node .next/standalone/server.js",
        url: `${baseURL}/robots.txt`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        env: { PORT: "3100", HOSTNAME: "127.0.0.1" },
      }
    : undefined,
});
