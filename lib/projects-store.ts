import type {
  ExportFormat,
  StoryboardScene,
  VideoDuration,
  VideoObjective,
  VideoProject,
  VideoTone,
} from "@/types/video";
import { mockProjects } from "./mock-data";
import { ADMIN_EMAIL, DEMO_EMAIL } from "./auth";
import { RENDER_DURATION_MS } from "./render";

/**
 * Store de projets en mémoire, par utilisateur. Le rendu vidéo est simulé :
 * la progression est recalculée à chaque lecture à partir de renderStartedAt,
 * puis le projet bascule en "export_ready".
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

const globalStore = globalThis as unknown as {
  __studioProjects?: Map<string, VideoProject[]>;
};

function getStore(): Map<string, VideoProject[]> {
  if (!globalStore.__studioProjects) {
    globalStore.__studioProjects = new Map();
  }
  return globalStore.__studioProjects;
}

function cloneMockProjects(): VideoProject[] {
  const projects = JSON.parse(JSON.stringify(mockProjects)) as VideoProject[];
  // Le projet mock "rendering" reprend vie : on cale son point de départ
  // pour que la progression continue depuis sa valeur d'origine.
  for (const project of projects) {
    if (project.status === "rendering") {
      project.renderStartedAt = new Date(
        Date.now() - (project.renderProgress / 100) * RENDER_DURATION_MS
      ).toISOString();
    }
  }
  return projects;
}

function ensureUserProjects(email: string): VideoProject[] {
  const store = getStore();
  let projects = store.get(email);
  if (!projects) {
    const seeded = email === ADMIN_EMAIL || email === DEMO_EMAIL;
    projects = seeded ? cloneMockProjects() : [];
    store.set(email, projects);
  }
  return projects;
}

function advanceRender(project: VideoProject): VideoProject {
  if (project.status !== "rendering" || !project.renderStartedAt) {
    return project;
  }
  const startedAt = new Date(project.renderStartedAt).getTime();
  const elapsed = Date.now() - startedAt;
  const progress = Math.min(100, Math.floor((elapsed / RENDER_DURATION_MS) * 100));
  project.renderProgress = Math.max(project.renderProgress, progress);
  if (project.renderProgress >= 100) {
    project.status = "export_ready";
    project.renderProgress = 100;
    // Fin réelle du rendu simulé, pas la date de première lecture.
    project.lastExportAt = new Date(startedAt + RENDER_DURATION_MS).toISOString();
    project.updatedAt = project.lastExportAt;
  }
  return project;
}

export function listProjects(email: string): VideoProject[] {
  return ensureUserProjects(email).map(advanceRender);
}

export function getProject(email: string, id: string): VideoProject | undefined {
  const project = ensureUserProjects(email).find((p) => p.id === id);
  return project ? advanceRender(project) : undefined;
}

/* ── Génération du storyboard côté serveur ─────────────────────── */

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
    title: `La solution`,
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

export function createProject(
  email: string,
  input: CreateProjectInput
): VideoProject {
  const now = new Date().toISOString();
  // Mode test : tous les formats d'export sont inclus, quelle que soit la durée.
  const formats: ExportFormat[] = ["16:9", "9:16", "1:1"];

  const project: VideoProject = {
    id: `prj-${crypto.randomUUID().slice(0, 8)}`,
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

  ensureUserProjects(email).unshift(project);
  return project;
}
