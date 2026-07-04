import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Génère le storyboard + la voix off d'une vidéo de démo à partir du brief et
 * des paramètres, via Claude (Opus 4.8, sortie structurée). La clé reste côté
 * serveur. Si ANTHROPIC_API_KEY n'est pas configurée, renvoie 501 et le tunnel
 * retombe sur la génération par gabarit.
 */

const ROLES = [
  "intro",
  "probleme",
  "solution",
  "fonctionnalites",
  "benefices",
  "preuve",
  "conclusion",
  "cta",
] as const;

const SCENES_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    scenes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          role: { type: "string", enum: ROLES as unknown as string[] },
          title: { type: "string" },
          description: { type: "string" },
          durationSeconds: { type: "integer" },
          voiceOver: { type: "string" },
        },
        required: ["role", "title", "description", "durationSeconds", "voiceOver"],
      },
    },
  },
  required: ["scenes"],
} as const;

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY non configurée." },
      { status: 501 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const productName = String(body.productName ?? "").trim() || "le produit";
  const duration = Math.min(120, Math.max(30, Number(body.duration) || 90));
  const tone = String(body.tone ?? "premium");
  const language = String(body.language ?? "Français");
  const objective = String(body.objective ?? "demo-commerciale");
  const brief = String(body.brief ?? "").trim();
  const problem = String(body.problem ?? "").trim();
  const promise = String(body.promise ?? "").trim();
  const audience = String(body.audience ?? "").trim();
  const cta = String(body.cta ?? "").trim();
  const sector = String(body.sector ?? "").trim();

  const client = new Anthropic({ apiKey });

  const system =
    "Tu es un directeur créatif spécialisé en vidéos de démonstration SaaS " +
    "vendeuses (style pub). Tu écris des storyboards courts, rythmés, à fort " +
    "impact, avec une voix off percutante. Tu réponds uniquement via le format " +
    "structuré demandé.";

  const prompt = [
    `Crée le storyboard d'une vidéo de démonstration de ${duration} secondes pour le produit « ${productName} ».`,
    `Langue de la voix off et des textes : ${language}.`,
    `Ton : ${tone}. Objectif : ${objective}.`,
    sector && `Secteur : ${sector}.`,
    audience && `Audience : ${audience}.`,
    problem && `Problème résolu : ${problem}.`,
    promise && `Promesse principale : ${promise}.`,
    cta && `Appel à l'action souhaité : ${cta}.`,
    brief && `Brief de l'utilisateur (à respecter en priorité) : ${brief}`,
    "",
    "Contraintes :",
    `- 6 à 8 scènes, dont l'ouverture (role "intro") et l'appel à l'action (role "cta").`,
    `- La somme des durationSeconds doit faire ${duration} (±1).`,
    `- Rôles autorisés : ${ROLES.join(", ")}.`,
    `- title : 2 à 4 mots, percutant. description : la mise en scène visuelle.`,
    `- voiceOver : une à deux phrases courtes, orales, vendeuses, dans la langue demandée.`,
    `- Adapte le vocabulaire et les exemples au produit et à son univers.`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4000,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: SCENES_SCHEMA },
      },
      system,
      messages: [{ role: "user", content: prompt }],
    });

    if (message.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "La génération a été refusée. Reformule le brief." },
        { status: 422 }
      );
    }

    const textBlock = message.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "";
    const parsed = JSON.parse(raw) as {
      scenes: Array<{
        role: string;
        title: string;
        description: string;
        durationSeconds: number;
        voiceOver: string;
      }>;
    };

    const scenes = (parsed.scenes ?? []).filter((s) =>
      (ROLES as readonly string[]).includes(s.role)
    );
    if (scenes.length < 3) {
      return NextResponse.json(
        { error: "Réponse IA inexploitable." },
        { status: 502 }
      );
    }

    return NextResponse.json({ scenes });
  } catch (e) {
    return NextResponse.json(
      { error: "Appel à Claude impossible.", detail: String(e).slice(0, 300) },
      { status: 502 }
    );
  }
}
