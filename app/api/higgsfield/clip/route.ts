import { NextResponse } from "next/server";
import { resolveHiggsfieldCredentials } from "@/lib/higgsfield-server";

/**
 * Lance un clip d'ambiance IA : texte → image (flux, rapide), puis SOUMET
 * image → vidéo (dop) sans attendre. Renvoie l'URL image + l'id du job vidéo.
 * Le client poll ensuite /api/higgsfield/job jusqu'à obtenir la vidéo — ça
 * garde cette route courte (robuste aux limites serverless). Clés côté serveur.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const ASPECTS: Record<string, string> = { "16:9": "16:9", "9:16": "9:16", "1:1": "1:1" };

const resultUrl = (job: any): string | undefined =>
  job?.jobs?.[0]?.results?.raw?.url ??
  job?.jobs?.[0]?.results?.min?.url ??
  job?.results?.raw?.url ??
  job?.video?.url ??
  job?.images?.[0]?.url;

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
    "Cinematic premium establishing footage, warm lighting, shallow depth of field, elegant, no text";
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

  // Étape 1 — texte → image (flux, format v2 : le SDK poll jusqu'au bout)
  let imageUrl: string | undefined;
  try {
    const imgJob = await higgsfield.subscribe("flux-pro/kontext/max/text-to-image", {
      input: { aspect_ratio, prompt, safety_tolerance: 2, seed },
      withPolling: true,
    });
    const st = String(imgJob?.status ?? "");
    if (st === "nsfw" || imgJob?.isNsfw) {
      return NextResponse.json(
        { error: "Image refusée par la modération. Reformule le thème.", step: "image" },
        { status: 422 }
      );
    }
    imageUrl = resultUrl(imgJob);
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Aucune URL d'image renvoyée.", step: "image", status: st },
        { status: 502 }
      );
    }
  } catch (e) {
    return NextResponse.json(
      { error: "Échec texte → image (Higgsfield).", step: "image", detail: String(e).slice(0, 400) },
      { status: 502 }
    );
  }

  // Étape 2 — SOUMET image → vidéo (dop) sans attendre. L'endpoint dop exige
  // un wrapper `params` ; il renvoie un jobset (id + jobs) à poller.
  try {
    const vidJob = await higgsfield.subscribe("/v1/image2video/dop", {
      input: {
        params: {
          model: "dop-turbo",
          prompt: motion,
          input_images: [{ type: "image_url", image_url: imageUrl }],
        },
      },
      withPolling: false,
    });
    const jobSetId = vidJob?.id;
    // Parfois la vidéo est déjà prête (peu probable) :
    const immediate = resultUrl(vidJob);
    if (immediate) return NextResponse.json({ imageUrl, videoUrl: immediate });
    if (!jobSetId) {
      return NextResponse.json(
        { error: "Soumission vidéo sans identifiant.", step: "video", imageUrl, keys: vidJob ? Object.keys(vidJob) : [] },
        { status: 502 }
      );
    }
    return NextResponse.json({ imageUrl, jobSetId });
  } catch (e) {
    return NextResponse.json(
      { error: "Échec soumission image → vidéo (Higgsfield).", step: "video", detail: String(e).slice(0, 400), imageUrl },
      { status: 502 }
    );
  }
}
