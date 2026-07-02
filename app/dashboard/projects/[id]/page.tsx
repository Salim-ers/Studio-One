import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { VideoPreviewCard } from "@/components/dashboard/VideoPreviewCard";
import { StoryboardSceneCard } from "@/components/dashboard/StoryboardSceneCard";
import { ScriptEditor } from "@/components/dashboard/ScriptEditor";
import { ProgressTimeline } from "@/components/ui/ProgressTimeline";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { statusLabels, objectiveLabels } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { requireUser } from "@/lib/auth";
import { getProject } from "@/lib/projects-store";
import { RenderProgress } from "@/components/dashboard/RenderProgress";

interface PageProps {
  params: { id: string };
}

export const metadata: Metadata = {
  title: "Projet — Studio One",
};

const exportFiles = [
  { label: "Vidéo 4K · 16:9", detail: "MP4 · 3840 × 2160" },
  { label: "Format vertical · 9:16", detail: "MP4 · 2160 × 3840" },
  { label: "Format carré · 1:1", detail: "MP4 · 2160 × 2160" },
  { label: "Sous-titres", detail: "Fichier SRT" },
  { label: "Script voix off", detail: "PDF" },
  { label: "Storyboard", detail: "PDF" },
];

export default async function ProjectPage({ params }: PageProps) {
  const user = await requireUser();
  const project = getProject(user.email, params.id);
  if (!project) notFound();

  const status = statusLabels[project.status];
  const isDraft = project.status === "draft";
  const isExportReady = project.status === "export_ready";
  const isRendering = project.status === "rendering";
  const canRender = project.status === "script_ready";

  return (
    <DashboardShell
      title={project.name}
      subtitle={`${objectiveLabels[project.objective]} · ${project.duration} secondes · ${project.language}`}
      user={{ name: user.name, email: user.email }}
      subscription={user.subscription}
      actions={
        <Badge tone={status.tone} pulse={isRendering}>
          {status.label}
        </Badge>
      }
    >
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-xs text-warm-gray transition-colors hover:text-bronze-deep"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Retour à la vue d&apos;ensemble
      </Link>

      {/* Progression globale */}
      <section className="card-surface p-6" aria-label="Progression du projet">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ProgressTimeline status={project.status} className="max-w-xl flex-1" />
          <div className="flex flex-wrap gap-2">
            <Button href="/dashboard/new-video" variant="secondary" size="sm">
              Modifier le storyboard
            </Button>
            {canRender && <Button size="sm">Lancer le rendu 4K</Button>}
            {isExportReady && <Button size="sm">Télécharger les exports</Button>}
            {isRendering && (
              <Button size="sm" disabled>
                Rendu en cours…
              </Button>
            )}
            {isDraft && (
              <Button href="/dashboard/new-video" size="sm">
                Reprendre le brief
              </Button>
            )}
          </div>
        </div>

        {isRendering && (
          <RenderProgress
            projectId={project.id}
            initialProgress={project.renderProgress}
          />
        )}
      </section>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0 space-y-8">
          {/* Storyboard */}
          <section aria-label="Storyboard">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg text-coffee">Storyboard</h2>
              {project.scenes.length > 0 && (
                <span className="text-xs text-warm-gray">
                  {project.scenes.length} scènes ·{" "}
                  {project.scenes.reduce((acc, s) => acc + s.durationSeconds, 0)} s
                </span>
              )}
            </div>

            {project.scenes.length === 0 ? (
              <EmptyState
                title="Le storyboard n'est pas encore généré"
                description="Complétez le brief produit et les assets dans le tunnel de création : Studio One proposera alors une structure scène par scène, chronométrée."
                actionLabel="Reprendre le brief"
                actionHref="/dashboard/new-video"
              />
            ) : (
              <div className="space-y-3">
                {project.scenes.map((scene) => (
                  <StoryboardSceneCard key={scene.id} scene={scene} />
                ))}
              </div>
            )}
          </section>

          {/* Script */}
          {project.scenes.length > 0 && (
            <section aria-label="Script voix off">
              <ScriptEditor
                scenes={project.scenes}
                initialTone={project.tone}
                initialVersion={Math.max(project.scriptVersion, 1)}
                clarityScore={project.clarityScore}
              />
            </section>
          )}
        </div>

        <div className="min-w-0 space-y-8">
          {/* Preview */}
          <section aria-label="Aperçu vidéo">
            <h2 className="mb-4 font-display text-lg text-coffee">Aperçu</h2>
            <VideoPreviewCard project={project} />
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(["16:9", "9:16", "1:1"] as const).map((format) => {
                const included = project.formats.includes(format);
                return (
                  <div
                    key={format}
                    className={
                      included
                        ? "rounded-lg border border-bronze/30 bg-[#F3E9DC]/60 px-3 py-2 text-center text-xs font-medium text-bronze-deep"
                        : "rounded-lg border border-hairline bg-cream/40 px-3 py-2 text-center text-xs text-warm-gray/70"
                    }
                  >
                    {format}
                    <span className="block text-[10px] font-normal">
                      {included ? "Inclus" : "Non inclus"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Exports */}
          <section aria-label="Fichiers d'export">
            <h2 className="mb-4 font-display text-lg text-coffee">Exports</h2>
            {isExportReady ? (
              <ul className="card-surface divide-y divide-[rgba(154,106,58,0.18)]">
                {exportFiles
                  .filter(
                    (f) =>
                      !f.label.includes(":") ||
                      project.formats.some((fmt) => f.label.includes(fmt))
                  )
                  .map((file) => (
                    <li
                      key={file.label}
                      className="flex items-center justify-between gap-3 p-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-coffee">{file.label}</p>
                        <p className="text-xs text-warm-gray">{file.detail}</p>
                      </div>
                      <button className="inline-flex items-center gap-1.5 rounded-full border border-hairline-strong px-3.5 py-1.5 text-xs font-medium text-coffee transition-all hover:border-bronze hover:text-bronze-deep">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                          <path d="M6 1.5V8m0 0L3.5 5.5M6 8l2.5-2.5M2 10.5h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Télécharger
                      </button>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="card-surface p-5 text-sm leading-relaxed text-warm-gray">
                Les fichiers d&apos;export — vidéo 4K, sous-titres SRT, script
                et storyboard PDF — apparaîtront ici une fois le rendu terminé
                et validé.
              </p>
            )}
          </section>

          {/* Détails */}
          <section aria-label="Détails du projet">
            <h2 className="mb-4 font-display text-lg text-coffee">Détails</h2>
            <dl className="card-surface divide-y divide-[rgba(154,106,58,0.18)] text-sm">
              {[
                ["Produit", project.productName],
                ["Objectif", objectiveLabels[project.objective]],
                ["Durée", `${project.duration} secondes`],
                ["Ton", project.tone],
                ["Langue", project.language],
                ["Créé le", formatDate(project.createdAt)],
                ["Mis à jour le", formatDate(project.updatedAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 px-5 py-3">
                  <dt className="text-warm-gray">{label}</dt>
                  <dd className="font-medium capitalize text-coffee">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
