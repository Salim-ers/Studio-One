"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell, GoogleButton, OrDivider } from "@/components/marketing/AuthShell";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    if (name.trim().length < 2) {
      setError("Entrez votre nom complet.");
      return;
    }
    if (!email.includes("@")) {
      setError("Entrez une adresse email valide.");
      return;
    }
    if (password.length < 8) {
      setError("Choisissez un mot de passe d'au moins 8 caractères.");
      return;
    }

    // Inscription prête à connecter à votre fournisseur d'authentification.
    setLoading(true);
    setTimeout(() => router.push("/dashboard"), 600);
  }

  return (
    <AuthShell
      title="Créez votre espace Studio One"
      subtitle="Votre première vidéo de démonstration 4K commence ici."
      footer={
        <>
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-bronze-deep underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <GoogleButton label="S'inscrire avec Google" />
      <OrDivider />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field label="Nom complet" htmlFor="name">
          <TextInput id="name" name="name" autoComplete="name" placeholder="Claire Fontanel" required />
        </Field>
        <Field label="Email professionnel" htmlFor="email">
          <TextInput id="email" name="email" type="email" autoComplete="email" placeholder="vous@entreprise.com" required />
        </Field>
        <Field label="Mot de passe" htmlFor="password" hint="8 caractères minimum.">
          <TextInput id="password" name="password" type="password" autoComplete="new-password" placeholder="••••••••" required />
        </Field>
        <Field label="Société" htmlFor="company">
          <TextInput id="company" name="company" autoComplete="organization" placeholder="Nova CRM" />
        </Field>
        <Field label="Votre objectif vidéo" htmlFor="goal">
          <Select id="goal" name="goal" defaultValue="demo-commerciale">
            <option value="demo-commerciale">Démo commerciale pour mes prospects</option>
            <option value="landing-page">Vidéo pour ma landing page</option>
            <option value="onboarding">Onboarding de mes utilisateurs</option>
            <option value="investisseurs">Présentation investisseurs</option>
            <option value="reseaux-sociaux">Contenu réseaux sociaux</option>
            <option value="agence">Production pour mes clients (agence)</option>
          </Select>
        </Field>

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Création de votre espace…" : "Créer mon espace Studio One"}
        </Button>
      </form>
    </AuthShell>
  );
}
