import { NextResponse } from "next/server";
import { authenticate, toPublicUser } from "@/lib/auth";
import { SESSION_COOKIE, createSessionToken } from "@/lib/session";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const email = String(body.email ?? "");
  const password = String(body.password ?? "");
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email et mot de passe requis." },
      { status: 400 }
    );
  }

  const user = await authenticate(email, password);
  if (!user) {
    return NextResponse.json(
      { error: "Identifiants incorrects. Vérifiez votre email et votre mot de passe." },
      { status: 401 }
    );
  }

  const token = await createSessionToken(user.email);
  const response = NextResponse.json({ ok: true, user: toPublicUser(user) });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}
