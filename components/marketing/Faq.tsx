"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const items = [
  {
    q: "Dois-je savoir monter une vidéo ?",
    a: "Non. Studio One structure votre démonstration à votre place : vous décrivez votre produit, vous ajoutez vos captures, et l'outil génère le storyboard, le script voix off et la timeline. Vous validez chaque étape avant le rendu final.",
  },
  {
    q: "Que fournissez-vous exactement à l'export ?",
    a: "Selon votre offre : la vidéo en 4K (16:9, et selon le plan 9:16 et 1:1), le fichier de sous-titres SRT, le script voix off, le storyboard en PDF et un package d'assets réutilisable pour vos équipes.",
  },
  {
    q: "Puis-je modifier le script généré ?",
    a: "Oui, entièrement. Vous pouvez relire, éditer chaque phrase, régénérer une version avec un autre ton, ou ajuster la longueur. Un historique conserve chaque version du script.",
  },
  {
    q: "Quelle durée choisir : 60, 90 ou 120 secondes ?",
    a: "60 secondes pour un message commercial rapide, 90 secondes pour une démonstration standard équilibrée, 120 secondes pour un storytelling complet avec preuve et cas d'usage. Vous pouvez changer de durée tant que le rendu n'est pas lancé.",
  },
  {
    q: "Mes données produit sont-elles en sécurité ?",
    a: "Vos assets restent privés et ne servent qu'à votre projet. Nous recommandons d'utiliser des comptes de démonstration plutôt que des données clients réelles, et l'outil vous aide à identifier puis flouter les informations sensibles avant l'export.",
  },
  {
    q: "Comment fonctionne la facturation ?",
    a: "Deux modes : à la vidéo (149 €, 249 € ou 399 € selon la durée) ou en abonnement mensuel avec un crédit de vidéos. Le paiement passe par Stripe et vous gérez tout depuis votre espace facturation, y compris la résiliation.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-[rgba(154,106,58,0.18)] rounded-2xl border border-hairline bg-ivory shadow-soft">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.q}>
            <button
              className="flex w-full items-center justify-between gap-6 px-7 py-5 text-left"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
            >
              <span className="font-display text-[17px] text-coffee">{item.q}</span>
              <span
                aria-hidden
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-hairline text-bronze transition-transform duration-300",
                  open && "rotate-45"
                )}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </span>
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p className="px-7 pb-6 text-sm leading-relaxed text-warm-gray">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
