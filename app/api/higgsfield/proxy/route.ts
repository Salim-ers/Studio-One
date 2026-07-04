import { NextResponse } from "next/server";

/**
 * Relaie un média distant (image/vidéo Higgsfield) sur notre origine, pour
 * l'afficher/dessiner sans souci de CORS et le rendre téléchargeable.
 * Restreint aux médias https, avec plafond de taille.
 */

export const runtime = "nodejs";
const MAX_BYTES = 80 * 1024 * 1024;

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  if (!url || !/^https:\/\//i.test(url)) {
    return NextResponse.json({ error: "URL https requise." }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, { cache: "no-store" });
  } catch {
    return NextResponse.json({ error: "Média inaccessible." }, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: `Média indisponible (${upstream.status}).` },
      { status: 502 }
    );
  }

  const type = upstream.headers.get("content-type") ?? "";
  if (!/^(image|video|application\/octet-stream)/i.test(type)) {
    return NextResponse.json(
      { error: "Type de média non autorisé." },
      { status: 415 }
    );
  }
  const length = Number(upstream.headers.get("content-length") ?? 0);
  if (length && length > MAX_BYTES) {
    return NextResponse.json({ error: "Média trop volumineux." }, { status: 413 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
