const { defineConfig, devices } = require("@playwright/test");

const local = "http://127.0.0.1:4173";
const deployed = process.env.WEBSITE_URL;
const executablePath = process.env.CHROMIUM_PATH;
const browserChannel = process.env.PLAYWRIGHT_CHANNEL;
const python = process.env.PYTHON || (process.platform === "win32" ? "python" : "python3");

module.exports = defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.cjs",
  fullyParallel: true,
  use: {
    baseURL: deployed ? new URL("./", deployed.replace(/\/?$/, "/")).href : local,
    channel: browserChannel || undefined,
    launchOptions: executablePath ? { executablePath } : undefined,
    trace: "retain-on-failure"
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 }, hasTouch: true } },
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 320, height: 740 } } }
  ],
  webServer: deployed ? undefined : {
    command: `${python} -m http.server 4173 --bind 127.0.0.1`,
    url: local,
    reuseExistingServer: false
  }
});
