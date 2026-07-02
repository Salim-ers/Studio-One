import type { Page } from "@playwright/test";

/** Compte illimité seedé — voir lib/auth.ts et le README. */
export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL || "salim.elrs@gmail.com",
  password: process.env.E2E_ADMIN_PASSWORD || "StudioOne2026!",
};

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/dashboard");
}
