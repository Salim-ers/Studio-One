/** Accès à la génération IA (Claude) via la route serveur. Clé jamais exposée. */

export interface AiScene {
  role: string;
  title: string;
  description: string;
  durationSeconds: number;
  voiceOver: string;
}

export async function isAiConfigured(): Promise<boolean> {
  try {
    const res = await fetch("/api/ai/status", { cache: "no-store" });
    if (!res.ok) return false;
    const data = (await res.json()) as { configured?: boolean };
    return Boolean(data.configured);
  } catch {
    return false;
  }
}

export async function generateAiScenes(input: {
  productName: string;
  duration: number;
  tone: string;
  language: string;
  objective: string;
  brief?: string;
  problem?: string;
  promise?: string;
  audience?: string;
  cta?: string;
  sector?: string;
}): Promise<AiScene[]> {
  const res = await fetch("/api/ai/script", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    let message = `Génération IA indisponible (${res.status}).`;
    try {
      const data = await res.json();
      message = data.error ?? message;
    } catch {
      /* réponse non JSON */
    }
    throw new Error(message);
  }
  const data = (await res.json()) as { scenes: AiScene[] };
  return data.scenes;
}
