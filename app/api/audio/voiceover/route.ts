import { NextResponse } from "next/server";

/**
 * Voix off via ElevenLabs (text-to-speech). La clé reste côté serveur ;
 * renvoie l'audio MP3 au navigateur pour être mixé dans la vidéo.
 */

const DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM"; // Rachel (multilingue)
const MAX_CHARS = 5000;

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY non configurée." },
      { status: 501 }
    );
  }

  let body: { text?: string; voiceId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const text = String(body.text ?? "").trim().slice(0, MAX_CHARS);
  if (text.length < 2) {
    return NextResponse.json({ error: "Texte de voix off vide." }, { status: 400 });
  }
  const voiceId =
    body.voiceId || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE;

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { error: `ElevenLabs (voix off) : ${res.status}`, detail: detail.slice(0, 500) },
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
