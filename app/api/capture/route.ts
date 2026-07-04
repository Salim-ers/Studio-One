import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

/**
 * Se connecte au SaaS de l'utilisateur (login automatique générique) et
 * capture les écrans clés, via un Chromium headless (compatible Vercel).
 * Les identifiants transitent uniquement le temps de la connexion — jamais
 * stockés. Réservé aux utilisateurs connectés.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const EMAIL_SELECTORS = [
  'input[type="email"]',
  'input[name*="email" i]',
  'input[id*="email" i]',
  'input[autocomplete="username"]',
  'input[name*="user" i]',
  'input[type="text"]',
];

async function launchBrowser() {
  const chromium = (await import("@sparticuz/chromium")).default;
  const { chromium: pw } = await import("playwright-core");
  return pw.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  let body: {
    url?: string;
    email?: string;
    password?: string;
    pages?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const loginUrl = String(body.url ?? "").trim();
  const email = String(body.email ?? "");
  const password = String(body.password ?? "");
  if (!/^https?:\/\//i.test(loginUrl)) {
    return NextResponse.json({ error: "URL de connexion invalide (https)." }, { status: 400 });
  }

  const origin = (() => {
    try {
      return new URL(loginUrl).origin;
    } catch {
      return "";
    }
  })();
  const extraPages = (Array.isArray(body.pages) ? body.pages : [])
    .map((p) => String(p).trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((p) => (p.startsWith("http") ? p : origin + (p.startsWith("/") ? p : `/${p}`)));

  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null;
  try {
    browser = await launchBrowser();
  } catch (e) {
    return NextResponse.json(
      { error: "Impossible de démarrer le navigateur.", detail: String(e).slice(0, 300) },
      { status: 500 }
    );
  }

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    // ── Connexion ─────────────────────────────────────────────────
    try {
      await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

      if (email && password) {
        // Champ email/identifiant
        let filledEmail = false;
        for (const sel of EMAIL_SELECTORS) {
          const loc = page.locator(sel).first();
          if (await loc.count()) {
            await loc.fill(email).catch(() => {});
            filledEmail = true;
            break;
          }
        }
        // Champ mot de passe
        const passLoc = page.locator('input[type="password"]').first();
        const hasPass = await passLoc.count();
        if (hasPass) await passLoc.fill(password).catch(() => {});

        if (filledEmail || hasPass) {
          // Soumission : bouton submit, sinon un bouton "connexion/login", sinon Entrée.
          const submit = page
            .locator(
              'button[type="submit"], input[type="submit"], button:has-text("Se connecter"), button:has-text("Connexion"), button:has-text("Log in"), button:has-text("Sign in")'
            )
            .first();
          if (await submit.count()) {
            await Promise.all([
              page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {}),
              submit.click().catch(() => {}),
            ]);
          } else if (hasPass) {
            await passLoc.press("Enter").catch(() => {});
            await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
          }
        }
      }
      await page.waitForTimeout(1500);
    } catch (e) {
      await browser.close();
      return NextResponse.json(
        { error: "Connexion au SaaS impossible.", detail: String(e).slice(0, 300) },
        { status: 502 }
      );
    }

    // ── Captures ──────────────────────────────────────────────────
    const shots: string[] = [];
    const toDataUrl = (buf: Buffer) => `data:image/png;base64,${buf.toString("base64")}`;

    try {
      shots.push(toDataUrl(await page.screenshot({ fullPage: false })));
    } catch {
      /* ignore */
    }

    for (const purl of extraPages) {
      try {
        await page.goto(purl, { waitUntil: "networkidle", timeout: 25000 });
        await page.waitForTimeout(800);
        shots.push(toDataUrl(await page.screenshot({ fullPage: false })));
      } catch {
        /* page en erreur : on ignore */
      }
    }

    await browser.close();
    browser = null;

    if (shots.length === 0) {
      return NextResponse.json(
        { error: "Aucune capture obtenue (connexion ou pages inaccessibles)." },
        { status: 502 }
      );
    }
    return NextResponse.json({ screenshots: shots });
  } catch (e) {
    if (browser) await browser.close().catch(() => {});
    return NextResponse.json(
      { error: "Échec de la capture.", detail: String(e).slice(0, 300) },
      { status: 500 }
    );
  }
}
