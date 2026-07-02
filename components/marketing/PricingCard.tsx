"use client";

import { useState } from "react";
import type { Plan } from "@/types/billing";
import { formatEuros, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export function PricingCard({ plan }: { plan: Plan }) {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setNotice(
        data.message ??
          data.error ??
          "Le paiement est momentanément indisponible. Réessayez dans un instant."
      );
    } catch {
      setNotice("Connexion impossible. Vérifiez votre réseau puis réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-ivory p-8 transition-all duration-300",
        plan.highlighted
          ? "border-bronze/40 shadow-glow"
          : "border-hairline shadow-soft hover:-translate-y-1 hover:border-bronze/30 hover:shadow-lifted"
      )}
    >
      {plan.highlighted && (
        <Badge tone="bronze" className="absolute -top-3 left-8">
          Recommandée
        </Badge>
      )}

      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-2xl text-coffee">{plan.name}</h3>
        {plan.duration && (
          <span className="text-xs font-medium uppercase tracking-caps text-bronze">
            {plan.duration} secondes
          </span>
        )}
        {plan.videosPerMonth && (
          <span className="text-xs font-medium uppercase tracking-caps text-bronze">
            {plan.videosPerMonth} vidéos / mois
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-warm-gray">{plan.tagline}</p>

      <p className="mt-6 flex items-baseline gap-1.5">
        <span className="font-display text-4xl text-coffee">
          {formatEuros(plan.price)}
        </span>
        <span className="text-sm text-warm-gray">
          {plan.mode === "per_video" ? "/ vidéo" : "/ mois"}
        </span>
      </p>

      <ul className="mt-6 flex-1 space-y-3 border-t border-hairline pt-6">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm text-coffee/85">
            <svg
              className="mt-0.5 shrink-0 text-bronze"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden
            >
              <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      <button
        onClick={startCheckout}
        disabled={loading}
        className={cn(
          "mt-8 inline-flex h-11 items-center justify-center rounded-full text-sm font-medium transition-all duration-300",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze",
          "disabled:pointer-events-none disabled:opacity-60",
          plan.highlighted
            ? "bg-bronze text-ivory shadow-soft hover:bg-bronze-deep hover:shadow-lifted"
            : "border border-hairline-strong text-coffee hover:border-bronze hover:text-bronze-deep"
        )}
      >
        {loading ? "Redirection vers Stripe…" : `Choisir ${plan.name}`}
      </button>

      {notice && (
        <p role="status" className="mt-3 text-xs leading-relaxed text-bronze-deep">
          {notice}
        </p>
      )}
    </article>
  );
}
