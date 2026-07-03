"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { statusLabels } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { withRenderProgress } from "@/lib/render";
import { syncLocalProjects } from "@/lib/local-projects";
import type { VideoProject } from "@/types/video";
import type { SubscriptionState } from "@/types/billing";

const templates = [
  { name: "SaaS B2B", detail: "Structure classique problème → solution → preuve." },
  { name: "CRM", detail: "Pipeline, relances, reporting : la démo qui rassure les équipes sales." },
  { name: "Marketplace", detail: "Deux audiences, un seul récit : offre et demande." },
  { name: "Outil IA", detail: "Montrer le résultat d'abord, expliquer le modèle ensuite." },
];

const tips = [
  "Ouvrez sur le résultat, pas sur le menu : montrez l'écran qui fait dire « je veux ça ».",
  "Une scène = une idée. Si une phrase du script couvre deux écrans, coupez-la en deux.",
  "Terminez toujours par un CTA unique : un lien, une action, pas trois options.",
];

/**
 * Contenu du dashboard, côté client : fusionne les projets seedés (serveur)
 * avec les projets créés dans ce navigateur (localStorage), et fait avancer
 * les rendus simulés en temps réel.
 */
export function DashboardContent({
  serverProjects,
  subscription,
}: {
  serverProjects: VideoProject[];
  subscription: SubscriptionState;
}) {
  const [localProjects, setLocalProjects] = useState<VideoProject[]>([]);
  // null avant montage : le premier rendu client doit être identique au HTML
  // serveur (pas de localStorage ni d'horloge côté SSR).
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const refresh = () => {
      setLocalProjects(syncLocalProjects());
      setNow(Date.now());
    };
    refresh();
    const timer = setInterval(refresh, 1500);
    return () => clearInterval(timer);
  }, []);

  const projects = useMemo(() => {
    const merged = [
      ...localProjects,
      ...serverProjects.filter(
        (sp) => !localProjects.some((lp) => lp.id === sp.id)
      ),
    ];
    if (now === null) return merged;
    return merged.map((p) => withRenderProgress(p, now));
  }, [localProjects, serverProjects, now]);

  const inProgress = projects.filter((p) => p.status !== "export_ready");
  const exported = projects.filter((p) => p.status === "export_ready");
  const rendering = projects.find((p) => p.status === "rendering");
  const creditsLeft = subscription.creditsTotal - subscription.creditsUsed;
  const lastExport = exported[0];

  const stats = [
    { label: "Vidéos créées", value: String(projects.length) },
    { label: "En cours", value: String(inProgress.length) },
    {
      label: "Crédits restants",
      value: subscription.unlimited
        ? "Illimité"
        : `${creditsLeft} / ${subscription.creditsTotal}`,
    },
    { label: "Abonnement", value: subscription.planName, badge: "Actif" },
  ];

  return (
    <>
      {/* Statistiques */}
      <section aria-label="Statistiques" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card-surface p-5">
            <p className="text-xs text-warm-gray">{stat.label}</p>
            <p className="mt-2 flex items-center gap-2">
              <span className="font-display text-2xl text-coffee">{stat.value}</span>
              {stat.badge && <Badge tone="success">{stat.badge}</Badge>}
            </p>
          </div>
        ))}
      </section>

      {/* Rendu en cours — mis en avant */}
      {rendering && (
        <section className="mt-6" aria-label="Rendu en cours">
          <div className="card-surface flex flex-col gap-5 border-bronze/25 p-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <Badge tone="progress" pulse>
                Rendu en cours
              </Badge>
              <h2 className="mt-2 truncate font-display text-xl text-coffee">
                {rendering.name}
              </h2>
              <p className="mt-1 text-sm text-warm-gray">
                Rendu 4K · {rendering.duration} secondes ·{" "}
                {rendering.formats.join(", ")} — suivez la progression en
                temps réel depuis la page projet.
              </p>
            </div>
            <div className="w-full md:w-72">
              <div className="flex justify-between text-xs text-warm-gray">
                <span>Progression</span>
                <span className="font-medium text-bronze-deep">
                  {rendering.renderProgress} %
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream" aria-hidden>
                <div
                  className="h-full rounded-full bg-bronze transition-all duration-700"
                  style={{ width: `${rendering.renderProgress}%` }}
                />
              </div>
              <Link
                href={`/dashboard/projects/${rendering.id}`}
                className="mt-3 inline-block text-xs font-medium text-bronze-deep underline-offset-4 hover:underline"
              >
                Suivre le rendu
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-8 xl:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0">
          {/* Projets */}
          <section aria-label="Projets vidéo">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg text-coffee">Projets vidéo</h2>
              <span className="text-xs text-warm-gray">
                {projects.length} projet{projects.length > 1 ? "s" : ""}
              </span>
            </div>

            {projects.length === 0 ? (
              <EmptyState
                title="Aucun projet pour l'instant"
                description="Votre première vidéo de démonstration est à cinq étapes d'ici. Décrivez votre produit, ajoutez vos captures, validez le storyboard."
                actionLabel="Créer ma première vidéo"
                actionHref="/dashboard/new-video"
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </section>

          {/* Derniers exports */}
          <section className="mt-10" aria-label="Derniers exports">
            <h2 className="mb-4 font-display text-lg text-coffee">Derniers exports</h2>
            {exported.length === 0 ? (
              <p className="card-surface p-6 text-sm text-warm-gray">
                Aucun export pour l&apos;instant. Vos vidéos terminées
                apparaîtront ici avec leurs fichiers 4K, SRT et PDF.
              </p>
            ) : (
              <ul className="card-surface divide-y divide-[rgba(154,106,58,0.18)]">
                {exported.map((project) => (
                  <li
                    key={project.id}
                    className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-coffee">
                        {project.name}
                      </p>
                      <p className="mt-0.5 text-xs text-warm-gray">
                        Exporté le{" "}
                        {formatDate(project.lastExportAt ?? project.updatedAt)} ·{" "}
                        {project.duration} s · {project.formats.join(", ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone="success">{statusLabels[project.status].label}</Badge>
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="text-xs font-medium text-bronze-deep underline-offset-4 hover:underline"
                      >
                        Ouvrir
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="min-w-0 space-y-8">
          {/* Modèles recommandés */}
          <section aria-label="Modèles recommandés">
            <h2 className="mb-4 font-display text-lg text-coffee">
              Modèles recommandés
            </h2>
            <ul className="card-surface divide-y divide-[rgba(154,106,58,0.18)]">
              {templates.map((template) => (
                <li key={template.name}>
                  <Link
                    href="/dashboard/new-video"
                    className="group flex items-start justify-between gap-3 p-4 transition-colors hover:bg-cream/50"
                  >
                    <span>
                      <span className="block text-sm font-medium text-coffee group-hover:text-bronze-deep">
                        {template.name}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-warm-gray">
                        {template.detail}
                      </span>
                    </span>
                    <svg className="mt-1 shrink-0 text-bronze opacity-0 transition-opacity group-hover:opacity-100" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M3 7h8m0 0L8 4m3 3l-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Conseils */}
          <section aria-label="Conseils">
            <h2 className="mb-4 font-display text-lg text-coffee">
              Améliorer vos vidéos
            </h2>
            <ul className="space-y-3">
              {tips.map((tip, i) => (
                <li
                  key={tip}
                  className="card-surface flex gap-3 p-4 text-sm leading-relaxed text-coffee/85"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cream font-display text-xs text-bronze-deep">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </section>

          {/* Dernier export mis en avant */}
          {lastExport && (
            <section aria-label="Dernier export">
              <div className="rounded-2xl border border-bronze/25 bg-[#F3E9DC]/60 p-5">
                <p className="eyebrow">Dernier export</p>
                <p className="mt-2 text-sm font-medium text-coffee">
                  {lastExport.name}
                </p>
                <p className="mt-1 text-xs text-warm-gray">
                  4K · SRT · Storyboard PDF · Script voix off
                </p>
                <Button
                  href={`/dashboard/projects/${lastExport.id}`}
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                >
                  Ouvrir le projet
                </Button>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
