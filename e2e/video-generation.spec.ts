import { statSync } from "fs";
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
    test.setTimeout(480_000);

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

    // Les sous-titres SRT se téléchargent réellement
    // ("Fichier SRT" : les lignes vidéo contiennent aussi "sous-titres incrustés")
    const srtRow = page
      .getByRole("listitem")
      .filter({ hasText: "Fichier SRT" });
    const srtDownloadPromise = page.waitForEvent("download");
    await srtRow.getByRole("button", { name: "Télécharger" }).click();
    const srtDownload = await srtDownloadPromise;
    expect(srtDownload.suggestedFilename()).toMatch(/\.srt$/);

    // La vidéo 16:9 est encodée dans le navigateur puis téléchargée
    const videoRow = page
      .getByRole("listitem")
      .filter({ hasText: "Vidéo · 16:9" });
    const videoDownloadPromise = page.waitForEvent("download", {
      timeout: 300_000,
    });
    await videoRow.getByRole("button", { name: "Télécharger" }).click();
    const videoDownload = await videoDownloadPromise;
    expect(videoDownload.suggestedFilename()).toMatch(/\.(mp4|webm)$/);
    const videoPath = await videoDownload.path();
    expect(videoPath).toBeTruthy();
    expect(statSync(videoPath!).size).toBeGreaterThan(50_000);

    // Le projet créé apparaît sur le dashboard (stocké dans ce navigateur,
    // donc vérifié dans le même contexte Playwright).
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Vue d'ensemble" })
    ).toBeVisible();
    await expect(page.getByText(/Nova CRM — Nouvelle démo/).first()).toBeVisible();
  });
});
