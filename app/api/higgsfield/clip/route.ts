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
    if (imgJob.isNsfw) {
      return NextResponse.json(
        { error: "Image refusée par la modération. Reformule le thème.", step: "image" },
        { status: 422 }
      );
    }
    if (!imgJob.isCompleted) {
      return NextResponse.json(
        { error: "Génération d'image non aboutie.", step: "image", status: imgJob.status },
        { status: 502 }
      );
    }
    imageUrl = imgJob.jobs?.[0]?.results?.raw?.url;
  } catch (e) {
    return NextResponse.json(
      { error: "Échec texte → image (Higgsfield).", step: "image", detail: String(e).slice(0, 400) },
      { status: 502 }
    );
  }

  if (!imageUrl) {
    return NextResponse.json(
      { error: "Aucune image renvoyée.", step: "image" },
      { status: 502 }
    );
  }

  // Étape 2 — image → vidéo (dop)
  try {
    const vidJob = await higgsfield.subscribe("/v1/image2video/dop", {
      input: {
        model: "dop-turbo",
        prompt: motion,
        input_images: [{ type: "image_url", image_url: imageUrl }],
      },
      withPolling: true,
    });
    if (!vidJob.isCompleted) {
      return NextResponse.json(
        { error: "Génération vidéo non aboutie.", step: "video", status: vidJob.status, imageUrl },
        { status: 502 }
      );
    }
    const videoUrl = vidJob.jobs?.[0]?.results?.raw?.url;
    if (!videoUrl) {
      return NextResponse.json(
        { error: "Aucune vidéo renvoyée.", step: "video", imageUrl },
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
