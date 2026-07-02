"use client";

import { useState } from "react";
import { perVideoPlans, subscriptionPlans } from "@/lib/pricing";
import { PricingCard } from "./PricingCard";
import { cn } from "@/lib/utils";
import type { BillingMode } from "@/types/billing";

export function PricingSection({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<BillingMode>("per_video");
  const plans = mode === "per_video" ? perVideoPlans : subscriptionPlans;

  return (
    <div>
      <div
        className="mx-auto flex w-fit items-center rounded-full border border-hairline bg-cream p-1"
        role="tablist"
        aria-label="Mode de facturation"
      >
        {(
          [
            { key: "per_video", label: "À la vidéo" },
            { key: "subscription", label: "Abonnement mensuel" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={mode === tab.key}
            onClick={() => setMode(tab.key)}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-medium transition-all duration-300",
              mode === tab.key
                ? "bg-ivory text-bronze-deep shadow-soft"
                : "text-warm-gray hover:text-coffee"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        className={cn(
          "mt-12 grid gap-6 md:grid-cols-3",
          compact ? "items-start" : "items-stretch"
        )}
      >
        {plans.map((plan) => (
          <PricingCard key={plan.id} plan={plan} />
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-warm-gray">
        Prix HT. Paiement sécurisé par Stripe. Les abonnements sont résiliables
        à tout moment depuis votre espace facturation.
      </p>
    </div>
  );
}
