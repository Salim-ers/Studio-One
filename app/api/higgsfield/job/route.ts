import { NextResponse } from "next/server";
import { resolveHiggsfieldCredentials } from "@/lib/higgsfield-server";

/**
 * État d'un job vidéo Higgsfield (jobset). Le client appelle cette route en
 * boucle jusqu'à obtenir la vidéo. Requête courte : compatible tout plan.
 */

export const runtime = "nodejs";

export async function GET(request: Request) {
  const credentials = resolveHiggsfieldCredentials();
  if (!credentials) {
    return NextResponse.json({ error: "Higgsfield non configuré." }, { status: 501 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id requis." }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`https://platform.higgsfield.ai/v1/job-sets/${id}`, {
      headers: { Authorization: `Key ${credentials}` },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ status: "in_progress" });
  }
  if (!res.ok) {
    // 5xx transitoire : on demande au client de continuer à poller.
    return NextResponse.json({ status: "in_progress", http: res.status });
  }

  const data = (await res.json()) as {
    jobs?: Array<{ status?: string; results?: { raw?: { url?: string }; min?: { url?: string } } }>;
  };
  const jobs = data.jobs ?? [];

  const completed = jobs.find((j) => j.status === "completed");
  if (completed) {
    const videoUrl = completed.results?.raw?.url ?? completed.results?.min?.url;
    if (videoUrl) return NextResponse.json({ status: "completed", videoUrl });
  }
  if (jobs.some((j) => j.status === "failed")) {
    return NextResponse.json({ status: "failed" });
  }
  if (jobs.some((j) => j.status === "nsfw")) {
    return NextResponse.json({ status: "nsfw" });
  }
  return NextResponse.json({ status: "in_progress" });
}
