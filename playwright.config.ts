import { defineConfig, devices } from "@playwright/test";

/**
 * Tests E2E Studio One. Le serveur Next.js de dev est lancé automatiquement.
 * Identifiants surchargeables via E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    locale: "fr-FR",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chrome",
      // Chrome installé (canal stable) : le Chromium embarqué de Playwright
      // n'a pas les codecs propriétaires et crashe sur l'encodage WebCodecs.
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
