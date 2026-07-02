import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createProject, listProjects, type CreateProjectInput } from "@/lib/projects-store";
import type { VideoDuration, VideoObjective, VideoTone } from "@/types/video";

const OBJECTIVES: VideoObjective[] = [
  "demo-commerciale",
  "onboarding",
  "fonctionnalite",
  "landing-page",
  "verticale-metier",
  "avant-apres",
  "investisseurs",
  "reseaux-sociaux",
];
const DURATIONS: VideoDuration[] = [60, 90, 120];
const TONES: VideoTone[] = [
  "premium",
  "pedagogique",
  "dynamique",
  "corporate",
  "chaleureux",
  "direct",
];

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  return NextResponse.json({ projects: listProjects(user.email) });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  let body: Partial<CreateProjectInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const objective = body.objective as VideoObjective;
  const duration = Number(body.duration) as VideoDuration;
  const tone = (body.tone ?? "premium") as VideoTone;
  const productName = String(body.productName ?? "").trim();
  const scriptText = String(body.scriptText ?? "").trim();

  if (!OBJECTIVES.includes(objective)) {
    return NextResponse.json({ error: "Objectif vidéo invalide." }, { status: 400 });
  }
  if (!DURATIONS.includes(duration)) {
    return NextResponse.json({ error: "Durée invalide." }, { status: 400 });
  }
  if (!TONES.includes(tone)) {
    return NextResponse.json({ error: "Ton invalide." }, { status: 400 });
  }
  if (productName.length < 2) {
    return NextResponse.json({ error: "Le nom du produit est requis." }, { status: 400 });
  }
  if (scriptText.length < 20) {
    return NextResponse.json(
      { error: "Le script est requis pour lancer le rendu." },
      { status: 400 }
    );
  }

  // Paiement et crédits désactivés pendant la phase de test :
  // tout compte connecté peut lancer un rendu.
  const project = createProject(user.email, {
    objective,
    duration,
    tone,
    productName,
    scriptText,
    productUrl: body.productUrl ? String(body.productUrl) : undefined,
    sector: body.sector ? String(body.sector) : undefined,
    audience: body.audience ? String(body.audience) : undefined,
    problem: body.problem ? String(body.problem) : undefined,
    promise: body.promise ? String(body.promise) : undefined,
    language: body.language ? String(body.language) : "Français",
    cta: body.cta ? String(body.cta) : undefined,
    subtitles: Boolean(body.subtitles ?? true),
  });

  return NextResponse.json({ project }, { status: 201 });
}
