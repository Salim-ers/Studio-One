import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ProjectNotFound() {
  return (
    <DashboardShell title="Projet introuvable">
      <EmptyState
        title="Ce projet n'existe pas ou a été supprimé"
        description="Vérifiez le lien, ou retrouvez tous vos projets depuis la vue d'ensemble du tableau de bord."
        actionLabel="Retour à la vue d'ensemble"
        actionHref="/dashboard"
      />
    </DashboardShell>
  );
}
