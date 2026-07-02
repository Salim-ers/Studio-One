import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSessionUser } from "@/lib/auth";

export default async function ProjectNotFound() {
  const user = await getSessionUser();

  return (
    <DashboardShell
      title="Projet introuvable"
      user={user ? { name: user.name, email: user.email } : undefined}
      subscription={user?.subscription}
    >
      <EmptyState
        title="Ce projet n'existe pas ou a été supprimé"
        description="Vérifiez le lien, ou retrouvez tous vos projets depuis la vue d'ensemble du tableau de bord."
        actionLabel="Retour à la vue d'ensemble"
        actionHref="/dashboard"
      />
    </DashboardShell>
  );
}
