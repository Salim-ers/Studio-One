import { NextResponse } from "next/server";
import { registerUser, toPublicUser } from "@/lib/auth";
import { SESSION_COOKIE, createSessionToken } from "@/lib/session";

export async function POST(request: Request) {
  let body: {
    name?: string;
    email?: string;
    password?: string;
    company?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");

  if (name.length < 2) {
    return NextResponse.json({ error: "Entrez votre nom complet." }, { status: 400 });
  }
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Entrez une adresse email valide." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Choisissez un mot de passe d'au moins 8 caractères." },
      { status: 400 }
    );
  }

  const result = await registerUser({
    name,
    email,
    password,
    company: body.company ? String(body.company) : undefined,
  });
  if (result === "exists") {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email. Connectez-vous." },
      { status: 409 }
    );
  }

  const token = await createSessionToken(result.email);
  const response = NextResponse.json(
    { ok: true, user: toPublicUser(result) },
    { status: 201 }
  );
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}
