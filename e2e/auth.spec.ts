import { test, expect } from "@playwright/test";
import { ADMIN, login } from "./helpers";

test.describe("Authentification", () => {
  test("redirige un visiteur non connecté vers la page de connexion", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=/);
    await expect(
      page.getByRole("heading", { name: "Content de vous revoir" })
    ).toBeVisible();
  });

  test("refuse un mauvais mot de passe", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", ADMIN.email);
    await page.fill("#password", "mauvais-mot-de-passe");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: /incorrects/i })
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("connecte le compte illimité et affiche le dashboard", async ({
    page,
  }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await expect(
      page.getByRole("heading", { name: "Vue d'ensemble" })
    ).toBeVisible();
    await expect(page.getByText("Illimité").first()).toBeVisible();
  });

  test("la déconnexion ramène à l'accueil et re-protège le dashboard", async ({
    page,
  }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await page.getByRole("button", { name: "Menu utilisateur" }).click();
    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/dashboard"));
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
