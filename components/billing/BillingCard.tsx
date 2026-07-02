"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { mockSubscription } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

/**
 * Carte "Plan actuel" : statut, crédits, renouvellement,
 * et ouverture du Stripe Customer Portal.
 */
export function BillingCard() {
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const creditsLeft =
    mockSubscription.creditsTotal - mockSubscription.creditsUsed;

  async function openPortal() {
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setNotice(
        data.message ??
          data.error ??
          "Le portail de facturation est momentanément indisponible."
      );
    } catch {
      setNotice("Connexion impossible. Vérifiez votre réseau puis réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-surface border-bronze/25 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Plan actuel</p>
          <div className="mt-2 flex items-center gap-3">
            <h2 className="font-display text-2xl text-coffee">
              {mockSubscription.planName}
            </h2>
            <Badge tone="success">Actif</Badge>
          </div>
          <p className="mt-1.5 text-sm text-warm-gray">
            Renouvellement le {formatDate(mockSubscription.renewsAt)} ·{" "}
            {mockSubscription.creditsTotal} vidéos par mois
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={openPortal} disabled={loading}>
            {loading ? "Ouverture…" : "Gérer mon abonnement"}
          </Button>
          <Button href="/pricing" size="sm">
            Changer d&apos;offre
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-xs text-warm-gray">
          <span>Crédits vidéo utilisés ce mois</span>
          <span className="font-medium text-bronze-deep">
            {mockSubscription.creditsUsed} / {mockSubscription.creditsTotal}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream" aria-hidden>
          <div
            className="h-full rounded-full bg-bronze"
            style={{
              width: `${(mockSubscription.creditsUsed / mockSubscription.creditsTotal) * 100}%`,
            }}
          />
        </div>
        <p className="mt-2 text-xs text-warm-gray">
          {creditsLeft} vidéo{creditsLeft > 1 ? "s" : ""} restante
          {creditsLeft > 1 ? "s" : ""} — les crédits se renouvellent à chaque
          période de facturation.
        </p>
      </div>

      {notice && (
        <p role="status" className="mt-4 rounded-lg border border-hairline bg-cream/60 px-4 py-2.5 text-xs leading-relaxed text-bronze-deep">
          {notice}
        </p>
      )}
    </div>
  );
}
