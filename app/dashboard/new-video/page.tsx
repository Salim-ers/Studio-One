import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { NewVideoWizard } from "@/components/dashboard/NewVideoWizard";

export const metadata: Metadata = {
  title: "Nouvelle vidéo — Studio One",
};

export default function NewVideoPage() {
  return (
    <DashboardShell
      title="Nouvelle vidéo"
      subtitle="Huit étapes guidées, de l'objectif à l'export 4K. Tout est enregistré automatiquement."
    >
      <NewVideoWizard />
    </DashboardShell>
  );
}
