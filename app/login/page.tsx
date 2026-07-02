"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell, GoogleButton, OrDivider } from "@/components/marketing/AuthShell";
import { Field, TextInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    if (!email.includes("@")) {
      setError("Entrez une adresse email valide.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Connexion impossible. Réessayez.");
        setLoading(false);
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next");
      // "/chemin" interne uniquement — "//evil.com" serait une URL externe.
      const safeNext =
        next && next.startsWith("/") && !next.startsWith("//")
          ? next
          : "/dashboard";
      router.push(safeNext);
      router.refresh();
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau puis réessayez.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Content de vous revoir"
      subtitle="Connectez-vous pour retrouver vos projets vidéo."
      footer={
        <>
          Nouveau sur Studio One ?{" "}
          <Link href="/register" className="font-medium text-bronze-deep underline-offset-4 hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <GoogleButton label="Continuer avec Google" />
      <OrDivider />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field label="Email" htmlFor="email">
          <TextInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="vous@entreprise.com"
            required
          />
        </Field>
        <Field label="Mot de passe" htmlFor="password">
          <TextInput
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
        </Field>

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Connexion…" : "Se connecter"}
        </Button>

        <p className="text-center">
          <Link href="/login" className="text-xs text-warm-gray underline-offset-4 hover:text-bronze-deep hover:underline">
            Mot de passe oublié ?
          </Link>
        </p>
      </form>

      {process.env.NODE_ENV === "development" && (
        <div className="mt-6 rounded-xl border border-hairline bg-cream/50 p-4 text-xs leading-relaxed text-warm-gray">
          <p className="font-medium text-coffee">Comptes de démonstration (dev)</p>
          <p className="mt-1.5">
            Accès illimité : <span className="font-medium text-bronze-deep">salim.elrs@gmail.com</span> · StudioOne2026!
          </p>
          <p>
            Compte Growth : <span className="font-medium text-bronze-deep">demo@studio-one.test</span> · DemoStudio2026!
          </p>
        </div>
      )}
    </AuthShell>
  );
}
