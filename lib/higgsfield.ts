import type { VideoProject } from "@/types/video";

/** Accès à Higgsfield via les routes serveur. Clés jamais exposées. */

export async function isHiggsfieldConfigured(): Promise<boolean> {
  try {
    const res = await fetch("/api/higgsfield/status", { cache: "no-store" });
    if (!res.ok) return false;
    const data = (await res.json()) as { configured?: boolean };
    return Boolean(data.configured);
  } catch {
    return false;
  }
}

/** URL same-origin pour afficher/dessiner/télécharger un média Higgsfield. */
export function proxied(url: string): string {
  return `/api/higgsfield/proxy?url=${encodeURIComponent(url)}`;
}

/** Prompt d'ambiance dérivé de l'univers du produit. */
export function ambiancePromptFor(input: {
  productName: string;
  sector?: string;
  brief?: string;
}): string {
  const universe = input.sector?.trim() || input.productName;
  const extra = input.brief?.trim() ? ` ${input.brief.trim()}.` : "";
  return `Cinematic premium establishing footage evoking the world of ${universe}.${extra} Warm cinematic lighting, shallow depth of field, elegant, no text, ad-quality.`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function generateHiggsfieldClip(
  input: { prompt: string; motion?: string; aspectRatio?: string },
  onStatus?: (label: string) => void
): Promise<{ videoUrl: string; imageUrl?: string }> {
  onStatus?.("Génération de l'image…");
  const res = await fetch("/api/higgsfield/clip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    let message = `Génération Higgsfield indisponible (${res.status}).`;
    try {
      const data = await res.json();
      if (data.error) message = data.error;
      if (data.step) message += ` (étape : ${data.step})`;
      if (data.detail) message += ` — ${data.detail}`;
    } catch {
      /* réponse non JSON */
    }
    throw new Error(message);
  }

  const first = (await res.json()) as {
    videoUrl?: string;
    imageUrl?: string;
    jobSetId?: string;
  };
  if (first.videoUrl) return { videoUrl: first.videoUrl, imageUrl: first.imageUrl };
  if (!first.jobSetId) throw new Error("Aucun job vidéo à suivre.");

  // Poll de l'état du job vidéo (jusqu'à ~6 min).
  onStatus?.("Animation de la vidéo…");
  const deadline = Date.now() + 6 * 60 * 1000;
  while (Date.now() < deadline) {
    await sleep(4000);
    try {
      const jr = await fetch(
        `/api/higgsfield/job?id=${encodeURIComponent(first.jobSetId)}`,
        { cache: "no-store" }
      );
      const jd = (await jr.json()) as { status?: string; videoUrl?: string };
      if (jd.status === "completed" && jd.videoUrl) {
        return { videoUrl: jd.videoUrl, imageUrl: first.imageUrl };
      }
      if (jd.status === "failed") throw new Error("La génération vidéo a échoué.");
      if (jd.status === "nsfw")
        throw new Error("Vidéo refusée par la modération. Reformule le thème.");
    } catch (e) {
      if (e instanceof Error && /échoué|modération/.test(e.message)) throw e;
      // erreur réseau transitoire : on retente
    }
  }
  throw new Error("Délai dépassé pour la génération vidéo.");
}

export function projectClipUrl(project: VideoProject): string | undefined {
  return project.videoClipUrl ? proxied(project.videoClipUrl) : undefined;
}
