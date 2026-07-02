import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { NewVideoWizard } from "@/components/dashboard/NewVideoWizard";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Nouvelle vidéo — Studio One",
};

export default async function NewVideoPage() {
  const user = await requireUser();

  return (
    <DashboardShell
      title="Nouvelle vidéo"
      subtitle="Huit étapes guidées, de l'objectif à l'export 4K. Tout est enregistré automatiquement."
      user={{ name: user.name, email: user.email }}
      subscription={user.subscription}
    >
      <NewVideoWizard />
    </DashboardShell>
  );
}
