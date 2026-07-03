import type { VideoProject, VideoTone } from "@/types/video";

/**
 * Accès à l'audio IA (ElevenLabs) via les routes serveur. La clé n'est
 * jamais exposée au navigateur : on ne fait que consommer /api/audio/*.
 */

export async function isAudioConfigured(): Promise<boolean> {
  try {
    const res = await fetch("/api/audio/status", { cache: "no-store" });
    if (!res.ok) return false;
    const data = (await res.json()) as { configured?: boolean };
    return Boolean(data.configured);
  } catch {
    return false;
  }
}

/** Texte de narration : les voix off des scènes, enchaînées. */
export function voiceoverTextFor(project: VideoProject): string {
  const parts = project.scenes
    .map((s) => s.voiceOver.trim())
    .filter(Boolean);
  return parts.join("\n\n");
}

const MOOD: Record<VideoTone, string> = {
  premium: "élégante et raffinée, cordes douces et piano",
  pedagogique: "claire et rassurante, tempo modéré",
  dynamique: "énergique et entraînante, percussions modernes",
  corporate: "professionnelle et confiante, synthés discrets",
  chaleureux: "chaleureuse et positive, guitare acoustique",
  direct: "moderne et percutante, beat minimal",
};

/** Prompt de musique de fond dérivé du ton du projet. */
export function musicPromptFor(project: VideoProject): string {
  const mood = MOOD[project.tone] ?? MOOD.premium;
  return `Musique de fond instrumentale pour une vidéo de démonstration de produit SaaS, ${mood}, sans voix, montée en intensité vers la fin, boucle propre.`;
}

async function fetchAudio(
  url: string,
  body: unknown
): Promise<ArrayBuffer> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Erreur audio (${res.status}).`;
    try {
      const data = await res.json();
      message = data.error ?? message;
      if (data.detail) message += ` ${data.detail}`;
    } catch {
      /* réponse non JSON */
    }
    throw new Error(message);
  }
  return res.arrayBuffer();
}

export function fetchVoiceover(text: string): Promise<ArrayBuffer> {
  return fetchAudio("/api/audio/voiceover", { text });
}

export function fetchMusic(
  prompt: string,
  durationMs: number
): Promise<ArrayBuffer> {
  return fetchAudio("/api/audio/music", { prompt, durationMs });
}
