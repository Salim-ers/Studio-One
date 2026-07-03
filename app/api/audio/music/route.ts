import { NextResponse } from "next/server";

/**
 * Musique de fond via ElevenLabs Music. La clé reste côté serveur ; renvoie
 * l'audio au navigateur pour être mixé (en sourdine) sous la voix off.
 */

const MAX_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY non configurée." },
      { status: 501 }
    );
  }

  let body: { prompt?: string; durationMs?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const prompt = String(body.prompt ?? "").trim().slice(0, 800);
  if (prompt.length < 3) {
    return NextResponse.json({ error: "Prompt musique vide." }, { status: 400 });
  }
  const musicLengthMs = Math.min(
    MAX_MS,
    Math.max(10_000, Math.round(Number(body.durationMs) || 60_000))
  );

  try {
    const res = await fetch("https://api.elevenlabs.io/v1/music", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({ prompt, music_length_ms: musicLengthMs }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: `ElevenLabs (musique) : ${res.status}`, detail: detail.slice(0, 500) },
        { status: 502 }
      );
    }

    const audio = await res.arrayBuffer();
    return new Response(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Appel ElevenLabs impossible.", detail: String(e).slice(0, 300) },
      { status: 502 }
    );
  }
}
