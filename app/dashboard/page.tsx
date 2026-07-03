import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { Button } from "@/components/ui/Button";
import { requireUser } from "@/lib/auth";
import { listProjects } from "@/lib/projects-store";

export const metadata: Metadata = {
  title: "Tableau de bord — Studio One",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const serverProjects = listProjects(user.email);

  return (
    <DashboardShell
      title="Vue d'ensemble"
      subtitle="Vos projets vidéo, vos crédits et vos derniers exports."
      user={{ name: user.name, email: user.email }}
      subscription={user.subscription}
      actions={
        <Button href="/dashboard/new-video" size="md">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Nouvelle vidéo
        </Button>
      }
    >
      <DashboardContent
        serverProjects={serverProjects}
        subscription={user.subscription}
      />
    </DashboardShell>
  );
}
