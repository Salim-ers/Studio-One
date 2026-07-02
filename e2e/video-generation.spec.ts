import { test, expect } from "@playwright/test";
import { ADMIN, login } from "./helpers";

/**
 * Parcours complet : connexion avec le compte illimité, création d'une
 * vidéo dans le tunnel en 8 étapes, lancement du rendu sans paiement,
 * puis attente de la fin du rendu simulé (~90 s).
 */
test.describe("Génération de vidéo — accès illimité", () => {
  test("crée une vidéo de bout en bout et obtient l'export", async ({
    page,
  }) => {
    test.setTimeout(240_000);

    await login(page, ADMIN.email, ADMIN.password);
    await page.goto("/dashboard/new-video");

    // Étape 1 — Objectif
    await page.getByRole("button", { name: /Démo SaaS commerciale/ }).click();
    await page.getByRole("button", { name: /Continuer/ }).click();

    // Étape 2 — Durée (90 s recommandée)
    await page
      .getByRole("button", { name: /Démonstration standard premium/ })
      .click();
    await page.getByRole("button", { name: /Continuer/ }).click();

    // Étape 3 — Produit
    await page.fill("#productName", "Nova CRM");
    await page.fill(
      "#promise",
      "un pipeline clair et des relances qui partent toutes seules"
    );
    await page.getByRole("button", { name: /Continuer/ }).click();

    // Étape 4 — Assets (optionnels)
    await page.getByRole("button", { name: /Continuer/ }).click();

    // Étape 5 — Storyboard
    await page.getByRole("button", { name: /Générer le storyboard/ }).click();
    await expect(
      page.getByRole("button", { name: /Régénérer une autre structure/ })
    ).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /Continuer/ }).click();

    // Étape 6 — Script
    await page.getByRole("button", { name: /Générer le script/ }).click();
    await expect(page.getByLabel("Script voix off")).not.toHaveValue("", {
      timeout: 10_000,
    });
    await page.getByRole("button", { name: /Continuer/ }).click();

    // Étape 7 — Prévisualisation
    await page.getByRole("button", { name: /Continuer/ }).click();

    // Étape 8 — Export : mode test, aucun paiement
    await expect(page.getByText("Rendu 4K sans paiement")).toBeVisible();
    await page.getByRole("button", { name: "Lancer le rendu 4K" }).click();

    // Redirection vers la page projet, rendu en cours
    await page.waitForURL(/\/dashboard\/projects\/prj-/, { timeout: 15_000 });
    await expect(page.getByText("Rendu en cours").first()).toBeVisible();
    await expect(page.getByText(/Rendu 4K en cours/)).toBeVisible();

    // Le rendu simulé (~90 s) se termine : export prêt
    await expect(page.getByText("Export prêt").first()).toBeVisible({
      timeout: 150_000,
    });
    await expect(
      page.getByRole("button", { name: /Télécharger les exports/ })
    ).toBeVisible();
  });

  test("le projet créé apparaît sur le dashboard", async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await expect(
      page.getByRole("heading", { name: "Vue d'ensemble" })
    ).toBeVisible();
    await expect(page.getByText(/Nova CRM — Nouvelle démo/).first()).toBeVisible();
  });
});
