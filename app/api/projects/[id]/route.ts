import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getProject } from "@/lib/projects-store";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const project = getProject(user.email, params.id);
  if (!project) {
    return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
  }

  return NextResponse.json({ project });
}
