#!/usr/bin/env node
/**
 * Capture d'écran de ton SaaS pour animer les captures dans la vidéo démo.
 *
 * Se connecte à ton application (login automatique par sélecteurs, ou login
 * manuel dans une fenêtre ouverte), visite les pages listées et enregistre
 * une capture de chacune dans references/produit/.
 *
 * Usage :
 *   1. cp capture.config.example.json capture.config.json
 *   2. Renseigne l'URL de ton SaaS, le login et les pages à capturer.
 *   3. Mets tes identifiants dans l'environnement (recommandé) :
 *        $env:CAPTURE_EMAIL="toi@exemple.com"; $env:CAPTURE_PASSWORD="..."
 *      (ou dans capture.config.json, mais ce fichier est ignoré par git).
 *   4. npm run capture           (login automatique)
 *      npm run capture -- --manual   (login à la main : 2FA, Google, etc.)
 *
 * Les captures atterrissent dans references/produit/. Tu les glisses ensuite
 * dans l'étape « Assets » du tunnel de création : elles seront animées
 * (zoom, panoramique) dans la vidéo.
 */

import { chromium } from "@playwright/test";
import { readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline";
import { resolve, join } from "node:path";

const args = process.argv.slice(2);
const manual = args.includes("--manual");
const configArg = args.find((a) => a.endsWith(".json"));
const configPath = resolve(configArg ?? "capture.config.json");

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

async function waitForEnter(message) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  await new Promise((res) => rl.question(message, () => res()));
  rl.close();
}

async function main() {
  if (!existsSync(configPath)) {
    fail(
      `Config introuvable : ${configPath}\n` +
        `Crée-la : cp capture.config.example.json capture.config.json`
    );
  }

  const config = JSON.parse(await readFile(configPath, "utf8"));
  const baseUrl = (config.baseUrl ?? "").replace(/\/$/, "");
  if (!baseUrl) fail("Renseigne baseUrl dans la config (URL de ton SaaS).");

  const viewport = config.viewport ?? { width: 1440, height: 900 };
  const outDir = resolve(config.output ?? "references/produit");
  await mkdir(outDir, { recursive: true });

  const pages = Array.isArray(config.pages) ? config.pages : [];
  if (pages.length === 0) fail("Ajoute au moins une page dans config.pages.");

  const login = config.login ?? {};
  const email = process.env.CAPTURE_EMAIL ?? login.email ?? "";
  const password = process.env.CAPTURE_PASSWORD ?? login.password ?? "";

  console.log(`\n▶ Capture de ${baseUrl}`);
  console.log(`  Fenêtre : ${viewport.width}×${viewport.height}`);
  console.log(`  Sortie  : ${outDir}\n`);

  const browser = await chromium.launch({
    headless: !manual,
    // deviceScaleFactor 2 → captures nettes (rendu "retina").
  });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  try {
    // ── Connexion ────────────────────────────────────────────────
    if (manual || login.mode === "manual") {
      const startUrl = login.url ? baseUrl + login.url : baseUrl;
      await page.goto(startUrl, { waitUntil: "domcontentloaded" });
      console.log("  Fenêtre ouverte : connecte-toi à la main dans le navigateur.");
      await waitForEnter("  Une fois connecté, reviens ici et appuie sur Entrée… ");
    } else if (login.url) {
      const loginUrl = baseUrl + login.url;
      console.log(`  Connexion via ${loginUrl}`);
      await page.goto(loginUrl, { waitUntil: "domcontentloaded" });

      if (!email || !password) {
        fail(
          "Identifiants manquants. Définis CAPTURE_EMAIL et CAPTURE_PASSWORD\n" +
            "dans l'environnement, ou passe en login manuel : npm run capture -- --manual"
        );
      }
      if (login.emailSelector) await page.fill(login.emailSelector, email);
      if (login.passwordSelector) await page.fill(login.passwordSelector, password);
      if (login.submitSelector) {
        await Promise.all([
          page.waitForLoadState("networkidle").catch(() => {}),
          page.click(login.submitSelector),
        ]);
      }
      if (login.waitForSelector) {
        await page.waitForSelector(login.waitForSelector, { timeout: 20000 });
      } else {
        await page.waitForLoadState("networkidle").catch(() => {});
      }
      console.log("  ✓ Connecté");
    } else {
      console.log("  (Pas de login configuré — capture des pages publiques.)");
    }

    // ── Captures ─────────────────────────────────────────────────
    let ok = 0;
    for (const [i, spec] of pages.entries()) {
      const name = (spec.name ?? `page-${i + 1}`).replace(/[^a-z0-9-_]/gi, "-");
      const url = spec.path?.startsWith("http") ? spec.path : baseUrl + (spec.path ?? "");
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        if (spec.waitFor) await page.waitForSelector(spec.waitFor, { timeout: 15000 });
        if (spec.delayMs) await page.waitForTimeout(spec.delayMs);
        const file = join(outDir, `${String(i + 1).padStart(2, "0")}-${name}.png`);
        await page.screenshot({ path: file, fullPage: Boolean(spec.fullPage) });
        console.log(`  ✓ ${name} → ${file}`);
        ok += 1;
      } catch (e) {
        console.warn(`  ✖ ${name} (${url}) : ${e.message.split("\n")[0]}`);
      }
    }

    console.log(`\n✔ ${ok}/${pages.length} capture(s) enregistrée(s) dans ${outDir}`);
    console.log(
      "  Glisse-les dans l'étape « Assets » du tunnel de création pour les animer.\n"
    );
  } finally {
    await browser.close();
  }
}

main().catch((e) => fail(e.stack ?? String(e)));
