"use client";

import { useEffect, useState } from "react";
import { DashboardShell, type ShellUser } from "@/components/dashboard/DashboardShell";
import { ProjectView } from "@/components/dashboard/ProjectView";
import { EmptyState } from "@/components/ui/EmptyState";
import { getLocalProject, saveLocalProject } from "@/lib/local-projects";
import { withRenderProgress } from "@/lib/render";
import type { VideoProject } from "@/types/video";
import type { SubscriptionState } from "@/types/billing";

/**
 * Charge un projet créé par l'utilisateur depuis le navigateur
 * (localStorage). undefined = chargement, null = introuvable.
 */
export function LocalProjectPage({
  id,
  user,
  subscription,
}: {
  id: string;
  user?: ShellUser;
  subscription?: SubscriptionState;
}) {
  const [project, setProject] = useState<VideoProject | null | undefined>(
    undefined
  );

  useEffect(() => {
    const found = getLocalProject(id);
    if (!found) {
      setProject(null);
      return;
    }
    const advanced = withRenderProgress(found);
    if (advanced.status !== found.status) {
      saveLocalProject(advanced);
    }
    setProject(advanced);
  }, [id]);

  if (project === undefined) {
    return (
      <DashboardShell title="Projet" user={user} subscription={subscription}>
        <div className="space-y-4" aria-busy="true" aria-label="Chargement du projet">
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-64 w-full" />
        </div>
      </DashboardShell>
    );
  }

  if (project === null) {
    return (
      <DashboardShell
        title="Projet introuvable"
        user={user}
        subscription={subscription}
      >
        <EmptyState
          title="Ce projet n'existe pas ou a été supprimé"
          description="Les projets créés sont conservés dans ce navigateur. Vérifiez le lien, ou retrouvez tous vos projets depuis la vue d'ensemble."
          actionLabel="Retour à la vue d'ensemble"
          actionHref="/dashboard"
        />
      </DashboardShell>
    );
  }

  return (
    <ProjectView
      project={project}
      user={user}
      subscription={subscription}
      persistLocal
    />
  );
}
