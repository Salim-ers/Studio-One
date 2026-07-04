import { NextResponse } from "next/server";

/** Indique si la génération IA (Claude) est configurée, sans exposer la clé. */
export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.ANTHROPIC_API_KEY),
  });
}
