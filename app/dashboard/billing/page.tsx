import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { BillingCard } from "@/components/billing/BillingCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { mockInvoices } from "@/lib/mock-data";
import { formatDate, formatEuros } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Facturation — Studio One",
};

export default function BillingPage() {
  return (
    <DashboardShell
      title="Facturation"
      subtitle="Votre abonnement, vos crédits vidéo et votre historique."
    >
      <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0 space-y-8">
          <BillingCard />

          <section aria-label="Historique de facturation">
            <h2 className="mb-4 font-display text-lg text-coffee">
              Historique de facturation
            </h2>
            {mockInvoices.length === 0 ? (
              <p className="card-surface p-6 text-sm text-warm-gray">
                Aucune facture pour l&apos;instant. Elles apparaîtront ici
                après votre premier paiement.
              </p>
            ) : (
              <ul className="card-surface divide-y divide-[rgba(154,106,58,0.18)]">
                {mockInvoices.map((invoice) => (
                  <li
                    key={invoice.id}
                    className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-coffee">
                        {invoice.label}
                      </p>
                      <p className="text-xs text-warm-gray">
                        {formatDate(invoice.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={invoice.status === "paid" ? "success" : "neutral"}>
                        {invoice.status === "paid" ? "Payée" : "En attente"}
                      </Badge>
                      <span className="font-display text-base text-coffee">
                        {formatEuros(invoice.amount)}
                      </span>
                      <button className="text-xs font-medium text-bronze-deep underline-offset-4 hover:underline">
                        Reçu PDF
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="min-w-0 space-y-8">
          <section aria-label="Passer à l'offre supérieure">
            <div className="rounded-2xl border border-bronze/25 bg-[#F3E9DC]/60 p-6">
              <p className="eyebrow">Besoin de plus de volume ?</p>
              <h2 className="mt-2 font-display text-xl text-coffee">
                Passez en Agency : 10 vidéos par mois.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                Marques illimitées, mode multi-clients, révisions illimitées et
                support prioritaire dédié. Le changement d&apos;offre est
                proratisé automatiquement par Stripe.
              </p>
              <Button href="/pricing" className="mt-5">
                Comparer les offres
              </Button>
            </div>
          </section>

          <section aria-label="Aide facturation">
            <div className="card-surface p-6 text-sm leading-relaxed text-warm-gray">
              <h2 className="font-display text-lg text-coffee">Bon à savoir</h2>
              <ul className="mt-3 space-y-2.5">
                <li>Les crédits non utilisés ne sont pas reportés au mois suivant.</li>
                <li>Vous pouvez résilier à tout moment : l&apos;accès reste actif jusqu&apos;à la fin de la période payée.</li>
                <li>Les factures sont émises par Stripe et disponibles au format PDF.</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
