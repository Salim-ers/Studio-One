import type {
  ExportFormat,
  StoryboardScene,
  VideoDuration,
  VideoObjective,
  VideoProject,
  VideoTone,
} from "@/types/video";

/**
 * Fabrique de projet : construit un VideoProject complet (storyboard
 * chronométré, voix off répartie, score de clarté) à partir des paramètres
 * du tunnel de création. Module pur, sans stockage ni dépendance serveur —
 * exécutable dans le navigateur comme sur le serveur.
 */

export interface CreateProjectInput {
  objective: VideoObjective;
  duration: VideoDuration;
  productName: string;
  productUrl?: string;
  sector?: string;
  audience?: string;
  problem?: string;
  promise?: string;
  tone: VideoTone;
  language: string;
  cta?: string;
  scriptText: string;
  subtitles?: boolean;
}

const sceneTemplates: Array<{
  role: StoryboardScene["role"];
  title: string;
  share: number;
  description: (input: CreateProjectInput) => string;
}> = [
  {
    role: "intro",
    title: "Ouverture produit",
    share: 0.08,
    description: (i) => `Logo ${i.productName}, interface qui apparaît en fondu.`,
  },
  {
    role: "probleme",
    title: "Le problème",
    share: 0.14,
    description: (i) =>
      i.problem || "Mise en scène de la friction que vit votre audience aujourd'hui.",
  },
  {
    role: "solution",
    title: "La solution",
    share: 0.18,
    description: (i) =>
      `${i.productName} entre en scène : ${i.promise || "le résultat, sans la friction"}.`,
  },
  {
    role: "fonctionnalites",
    title: "Fonctionnalités clés",
    share: 0.22,
    description: () => "Trois plans rapides sur les fonctionnalités décisives.",
  },
  {
    role: "benefices",
    title: "Bénéfices concrets",
    share: 0.13,
    description: () => "Chiffres animés : temps gagné, résultats mesurables.",
  },
  {
    role: "preuve",
    title: "Preuve client",
    share: 0.1,
    description: () => "Citation d'un client avec logo, sur carte crème.",
  },
  {
    role: "conclusion",
    title: "Conclusion",
    share: 0.07,
    description: (i) => `Retour sur l'interface de ${i.productName}, mouvement lent.`,
  },
  {
    role: "cta",
    title: "Appel à l'action",
    share: 0.08,
    description: (i) => i.cta || `Écran final : logo ${i.productName} et essai gratuit.`,
  },
];

function buildScenes(input: CreateProjectInput): StoryboardScene[] {
  const paragraphs = input.scriptText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  // La dernière scène absorbe le reste d'arrondi pour que la somme des
  // durées de scènes soit exactement la durée de la vidéo.
  let allocated = 0;

  return sceneTemplates.map((template, index) => {
    const isLast = index === sceneTemplates.length - 1;
    const durationSeconds = isLast
      ? input.duration - allocated
      : Math.round(template.share * input.duration);
    allocated += durationSeconds;

    // Répartition proportionnelle des paragraphes du script sur les scènes,
    // pour ne pas dupliquer le dernier paragraphe sur toute la fin.
    const paragraphIndex =
      paragraphs.length > 0
        ? Math.min(
            Math.floor((index * paragraphs.length) / sceneTemplates.length),
            paragraphs.length - 1
          )
        : -1;

    return {
      id: `sc-${index + 1}`,
      order: index + 1,
      role: template.role,
      title: template.title,
      description: template.description(input),
      durationSeconds,
      voiceOver: paragraphIndex >= 0 ? paragraphs[paragraphIndex] : "",
    };
  });
}

function computeClarityScore(input: CreateProjectInput): number {
  const optionalFields = [
    input.productUrl,
    input.sector,
    input.audience,
    input.problem,
    input.cta,
  ];
  const filled = optionalFields.filter((f) => f && f.trim().length > 2).length;
  return 78 + filled * 4;
}

function generateProjectId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `prj-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `prj-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildProject(input: CreateProjectInput): VideoProject {
  const now = new Date().toISOString();
  // Mode test : tous les formats d'export sont inclus, quelle que soit la durée.
  const formats: ExportFormat[] = ["16:9", "9:16", "1:1"];

  return {
    id: generateProjectId(),
    name: `${input.productName} — Nouvelle démo`,
    productName: input.productName,
    status: "rendering",
    objective: input.objective,
    duration: input.duration,
    tone: input.tone,
    language: input.language,
    formats,
    scenes: buildScenes(input),
    scriptVersion: 1,
    clarityScore: computeClarityScore(input),
    renderProgress: 0,
    createdAt: now,
    updatedAt: now,
    renderStartedAt: now,
  };
}
