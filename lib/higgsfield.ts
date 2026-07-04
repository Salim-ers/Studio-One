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

export async function generateHiggsfieldClip(input: {
  prompt: string;
  aspectRatio?: string;
}): Promise<{ videoUrl: string; imageUrl?: string }> {
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
  return (await res.json()) as { videoUrl: string; imageUrl?: string };
}

export function projectClipUrl(project: VideoProject): string | undefined {
  return project.videoClipUrl ? proxied(project.videoClipUrl) : undefined;
}
