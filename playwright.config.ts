import { defineConfig, type Project } from "@playwright/test";

const viewportMatrix = [
  { name: "320", width: 320, height: 568 },
  { name: "375", width: 375, height: 667 },
  { name: "390", width: 390, height: 844 },
  { name: "430", width: 430, height: 932 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1280", width: 1280, height: 800 },
  { name: "1440", width: 1440, height: 900 },
  { name: "1920", width: 1920, height: 1080 },
] as const;

const browserNames = ["chromium", "firefox", "webkit"] as const;
const projects: Project[] = browserNames.flatMap((browserName) =>
  viewportMatrix.map(({ name, width, height }) => ({
    name: `${browserName}-${name}`,
    use: {
      browserName,
      viewport: { width, height },
      deviceScaleFactor: 1,
    },
  })),
);

const externalBaseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL?.trim();
const port = Number(process.env.PLAYWRIGHT_PORT || "3210");
if (!Number.isInteger(port) || port < 1024 || port > 65_535) {
  throw new Error("PLAYWRIGHT_PORT must be an integer from 1024 to 65535.");
}
const baseURL = externalBaseUrl || `http://127.0.0.1:${port}`;
const inheritedEnvironment = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => Boolean(entry[1])),
);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 3 : undefined,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  outputDir: "test-results/playwright-artifacts",
  reporter: process.env.CI
    ? [["line"], ["junit", { outputFile: "test-results/playwright-junit.xml" }], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects,
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `npm run start -- --hostname 127.0.0.1 --port ${port}`,
        url: `${baseURL}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...inheritedEnvironment,
          PUBLIC_ENQUIRIES_ENABLED: "false",
          TURNSTILE_REQUIRED: "false",
          NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
          ALLOW_NDJSON_ENQUIRY_FALLBACK: "false",
        },
      },
});
