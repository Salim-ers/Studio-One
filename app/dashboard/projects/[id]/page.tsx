import type { Metadata } from "next";
import { ProjectView } from "@/components/dashboard/ProjectView";
import { LocalProjectPage } from "@/components/dashboard/LocalProjectPage";
import { requireUser } from "@/lib/auth";
import { getProject } from "@/lib/projects-store";

interface PageProps {
  params: { id: string };
}

export const metadata: Metadata = {
  title: "Projet — Studio One",
};

export default async function ProjectPage({ params }: PageProps) {
  const user = await requireUser();
  const shellUser = { name: user.name, email: user.email };

  // Projets de démonstration seedés : connus du serveur.
  const seeded = getProject(user.email, params.id);
  if (seeded) {
    return (
      <ProjectView
        project={seeded}
        user={shellUser}
        subscription={user.subscription}
      />
    );
  }

  // Projets créés par l'utilisateur : stockés dans le navigateur,
  // résolus côté client (compatible serverless).
  return (
    <LocalProjectPage
      id={params.id}
      user={shellUser}
      subscription={user.subscription}
    />
  );
}
