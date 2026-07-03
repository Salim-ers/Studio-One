import type { VideoProject } from "@/types/video";
import { mockProjects } from "./mock-data";
import { ADMIN_EMAIL, DEMO_EMAIL } from "./auth";
import { RENDER_DURATION_MS, withRenderProgress } from "./render";

/**
 * Projets de démonstration seedés côté serveur, par utilisateur. Comme ils
 * dérivent de données statiques, ils sont reconstructibles sur n'importe
 * quelle instance serverless. Les projets créés par l'utilisateur vivent,
 * eux, dans le navigateur (voir lib/local-projects.ts).
 */

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

function advanceAt(projects: VideoProject[], index: number): VideoProject {
  const next = withRenderProgress(projects[index]);
  projects[index] = next;
  return next;
}

export function listProjects(email: string): VideoProject[] {
  const projects = ensureUserProjects(email);
  return projects.map((_, index) => advanceAt(projects, index));
}

export function getProject(email: string, id: string): VideoProject | undefined {
  const projects = ensureUserProjects(email);
  const index = projects.findIndex((p) => p.id === id);
  return index === -1 ? undefined : advanceAt(projects, index);
}
