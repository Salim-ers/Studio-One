import { NextResponse } from "next/server";

/** Indique si l'audio IA (ElevenLabs) est configuré, sans exposer la clé. */
export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.ELEVENLABS_API_KEY),
  });
}
