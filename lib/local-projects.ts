import type { VideoProject } from "@/types/video";
import { withRenderProgress } from "./render";

/**
 * Persistance des projets créés par l'utilisateur dans le navigateur
 * (localStorage). Aucune dépendance serveur : les projets survivent aux
 * instances serverless (Vercel) puisqu'ils vivent côté client, et la
 * progression du rendu se recalcule depuis l'horloge.
 */

const STORAGE_KEY = "studio-one-projects";

export function loadLocalProjects(): VideoProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as VideoProject[]) : [];
  } catch {
    return [];
  }
}

function persist(projects: VideoProject[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return true;
  } catch {
    return false;
  }
}

export function saveLocalProject(project: VideoProject): boolean {
  const others = loadLocalProjects().filter((p) => p.id !== project.id);
  return persist([project, ...others]);
}

export function getLocalProject(id: string): VideoProject | undefined {
  return loadLocalProjects().find((p) => p.id === id);
}

/**
 * Recharge les projets locaux en recalculant la progression du rendu,
 * et persiste les transitions d'état (rendering → export_ready).
 */
export function syncLocalProjects(now: number = Date.now()): VideoProject[] {
  const stored = loadLocalProjects();
  const advanced = stored.map((p) => withRenderProgress(p, now));
  const changed = advanced.some((p, i) => p.status !== stored[i].status);
  if (changed) persist(advanced);
  return advanced;
}
