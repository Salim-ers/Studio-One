import type { Metadata } from "next";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { AnimatedSection } from "@/components/motion/AnimatedSection";
import { PricingSection } from "@/components/marketing/PricingSection";
import { FilmRule } from "@/components/ui/FilmRule";

export const metadata: Metadata = {
  title: "Tarifs — Studio One",
  description:
    "À la vidéo (149 €, 249 €, 399 €) ou en abonnement mensuel : choisissez le rythme qui correspond à votre production de démos 4K.",
};

const guarantees = [
  {
    title: "Validation avant rendu",
    description:
      "Le rendu final ne se lance qu'après votre validation du storyboard et du script. Pas de mauvaise surprise à l'export.",
  },
  {
    title: "Révisions incluses",
    description:
      "Les offres Pro et Studio incluent des révisions. En abonnement Growth et Agency, elles sont illimitées.",
  },
  {
    title: "Résiliation en un clic",
    description:
      "Les abonnements se gèrent depuis votre espace facturation via le portail Stripe : changement d'offre, factures, résiliation.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="pt-36 md:pt-44">
        <AnimatedSection className="mx-auto max-w-6xl px-6 pb-20">
          <div className="mb-12 text-center">
            <p className="eyebrow">Tarifs</p>
            <h1 className="mt-4 font-display text-4xl leading-tight text-coffee md:text-5xl">
              Payez à la vidéo, ou installez un rythme.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-warm-gray">
              Trois formats — 60, 90 et 120 secondes — et deux façons de les
              produire. Toutes les offres incluent l&apos;export 4K, le script
              voix off et les sous-titres.
            </p>
          </div>
          <PricingSection />
        </AnimatedSection>

        <FilmRule />

        <AnimatedSection className="bg-cream/60 py-20" stagger="article">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3">
            {guarantees.map((g) => (
              <article
                key={g.title}
                className="rounded-2xl border border-hairline bg-ivory p-7 shadow-soft"
              >
                <h2 className="font-display text-lg text-coffee">{g.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                  {g.description}
                </p>
              </article>
            ))}
          </div>
        </AnimatedSection>
      </main>
      <Footer />
    </>
  );
}
