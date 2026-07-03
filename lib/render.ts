import type { VideoProject } from "@/types/video";

/** Durée du rendu simulé — partagée entre serveur et navigateur. */
export const RENDER_DURATION_MS = 90_000;

/**
 * Progression du rendu simulé, dérivée de l'horloge et de renderStartedAt.
 * Fonction pure (retourne un nouvel objet) : utilisable côté serveur comme
 * côté navigateur, ce qui rend la simulation indépendante de tout stockage —
 * indispensable en environnement serverless (Vercel).
 */
export function withRenderProgress(
  project: VideoProject,
  now: number = Date.now()
): VideoProject {
  if (project.status !== "rendering" || !project.renderStartedAt) {
    return project;
  }

  const startedAt = new Date(project.renderStartedAt).getTime();
  const computed = Math.min(
    100,
    Math.floor(((now - startedAt) / RENDER_DURATION_MS) * 100)
  );
  const renderProgress = Math.max(project.renderProgress, computed);

  if (renderProgress >= 100) {
    // Fin réelle du rendu simulé, pas la date de lecture.
    const finishedAt = new Date(startedAt + RENDER_DURATION_MS).toISOString();
    return {
      ...project,
      status: "export_ready",
      renderProgress: 100,
      lastExportAt: finishedAt,
      updatedAt: finishedAt,
    };
  }

  if (renderProgress === project.renderProgress) return project;
  return { ...project, renderProgress };
}
