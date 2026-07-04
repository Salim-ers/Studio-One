import { NextResponse } from "next/server";
import { resolveHiggsfieldCredentials } from "@/lib/higgsfield-server";

/**
 * Génère un clip d'ambiance IA thématique via Higgsfield : texte → image
 * (flux) puis image → vidéo (dop). Deux jobs asynchrones ; la route bloque
 * jusqu'au résultat, d'où maxDuration élevé (nécessite un plan Vercel qui
 * autorise les fonctions longues). Les clés restent côté serveur.
 */

export const runtime = "nodejs";
export const maxDuration = 300;

const ASPECTS: Record<string, string> = {
  "16:9": "16:9",
  "9:16": "9:16",
  "1:1": "1:1",
};

export async function POST(request: Request) {
  const credentials = resolveHiggsfieldCredentials();
  if (!credentials) {
    return NextResponse.json(
      { error: "Higgsfield non configuré (HF_CREDENTIALS ou HF_API_KEY/HF_API_SECRET)." },
      { status: 501 }
    );
  }

  let body: { prompt?: string; motion?: string; aspectRatio?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const prompt =
    String(body.prompt ?? "").trim() ||
    "Cinematic premium establishing shot, warm lighting, shallow depth of field, elegant, no text";
  const motion =
    String(body.motion ?? "").trim() ||
    "Slow cinematic camera movement, subtle parallax, premium ad feel";
  const aspect_ratio = ASPECTS[String(body.aspectRatio ?? "16:9")] ?? "16:9";
  const seed = Math.floor(Math.random() * 1_000_000);

  let higgsfield: any;
  try {
    const mod = await import("@higgsfield/client/v2");
    mod.config({ credentials });
    higgsfield = mod.higgsfield;
  } catch (e) {
    return NextResponse.json(
      { error: "SDK Higgsfield indisponible.", detail: String(e).slice(0, 300) },
      { status: 500 }
    );
  }

  // Récupère l'URL du premier résultat d'un JobSet, quelle que soit la forme.
  const resultUrl = (job: any): string | undefined =>
    job?.jobs?.[0]?.results?.raw?.url ??
    job?.jobs?.[0]?.results?.min?.url ??
    job?.results?.raw?.url ??
    job?.video?.url ??
    job?.images?.[0]?.url;

  // Étape 1 — texte → image (flux)
  let imageUrl: string | undefined;
  try {
    const imgJob = await higgsfield.subscribe(
      "flux-pro/kontext/max/text-to-image",
      {
        input: { aspect_ratio, prompt, safety_tolerance: 2, seed },
        withPolling: true,
      }
    );
    const st = String(imgJob?.status ?? "");
    if (st === "nsfw" || imgJob?.isNsfw) {
      return NextResponse.json(
        { error: "Image refusée par la modération. Reformule le thème.", step: "image" },
        { status: 422 }
      );
    }
    if (st === "failed") {
      return NextResponse.json(
        { error: "La génération d'image a échoué.", step: "image" },
        { status: 502 }
      );
    }
    imageUrl = resultUrl(imgJob);
    if (!imageUrl) {
      return NextResponse.json(
        {
          error: "Aucune URL d'image renvoyée.",
          step: "image",
          status: st,
          jobs: Array.isArray(imgJob?.jobs) ? imgJob.jobs.length : 0,
          keys: imgJob ? Object.keys(imgJob).slice(0, 12) : [],
        },
        { status: 502 }
      );
    }
  } catch (e) {
    return NextResponse.json(
      { error: "Échec texte → image (Higgsfield).", step: "image", detail: String(e).slice(0, 400) },
      { status: 502 }
    );
  }

  // Étape 2 — image → vidéo (dop)
  try {
    // Le SDK envoie l'input à plat, mais l'endpoint dop exige un wrapper
    // `params` (contrairement à flux). On pré-emballe donc l'input.
    const vidJob = await higgsfield.subscribe("/v1/image2video/dop", {
      input: {
        params: {
          model: "dop-turbo",
          prompt: motion,
          input_images: [{ type: "image_url", image_url: imageUrl }],
        },
      },
      withPolling: true,
    });
    const st = String(vidJob?.status ?? "");
    if (st === "failed") {
      return NextResponse.json(
        { error: "La génération vidéo a échoué.", step: "video", imageUrl },
        { status: 502 }
      );
    }
    const videoUrl = resultUrl(vidJob);
    if (!videoUrl) {
      return NextResponse.json(
        {
          error: "Aucune URL de vidéo renvoyée.",
          step: "video",
          status: st,
          jobs: Array.isArray(vidJob?.jobs) ? vidJob.jobs.length : 0,
          keys: vidJob ? Object.keys(vidJob).slice(0, 12) : [],
          imageUrl,
        },
        { status: 502 }
      );
    }
    return NextResponse.json({ videoUrl, imageUrl });
  } catch (e) {
    return NextResponse.json(
      { error: "Échec image → vidéo (Higgsfield).", step: "video", detail: String(e).slice(0, 400), imageUrl },
      { status: 502 }
    );
  }
}
