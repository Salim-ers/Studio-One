import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { EditorMockup } from "@/components/marketing/EditorMockup";
import { HeroReveal } from "@/components/motion/HeroReveal";
import { AnimatedSection } from "@/components/motion/AnimatedSection";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FilmRule } from "@/components/ui/FilmRule";
import { VideoDurationCard } from "@/components/marketing/VideoDurationCard";
import { WorkflowStep } from "@/components/marketing/WorkflowStep";
import { FeatureCard } from "@/components/marketing/FeatureCard";
import { TestimonialCard } from "@/components/marketing/TestimonialCard";
import { PricingSection } from "@/components/marketing/PricingSection";
import { Faq } from "@/components/marketing/Faq";

const workflowSteps = [
  {
    title: "Décrivez votre produit",
    description:
      "Nom, promesse, audience, ton : cinq minutes suffisent pour poser le brief. Studio One recommande ensuite un type de vidéo et une durée adaptés.",
  },
  {
    title: "Ajoutez vos assets",
    description:
      "Logo, couleurs de marque, captures d'écran, courtes vidéos. Tout reste privé, et l'outil vous signale les données sensibles à masquer.",
  },
  {
    title: "Validez le storyboard",
    description:
      "Intro, problème, solution, fonctionnalités, bénéfices, preuve, CTA : chaque scène est proposée, chronométrée, et modifiable.",
  },
  {
    title: "Affinez le script voix off",
    description:
      "Relisez, éditez, régénérez avec un autre ton. Le score de clarté vous indique si vos prospects comprendront du premier coup.",
  },
  {
    title: "Exportez en 4K",
    description:
      "Une checklist finale valide votre projet, puis le rendu se lance. Vous récupérez la vidéo, les sous-titres SRT, le script et le storyboard PDF.",
  },
];

const audiences = [
  {
    title: "Fondateurs SaaS",
    description:
      "Une démo claire pour la landing page, les emails d'onboarding et les rendez-vous investisseurs — sans mobiliser une équipe vidéo.",
  },
  {
    title: "Équipes sales",
    description:
      "Ne refaites plus la même démo en visio. Envoyez une vidéo structurée avant le rendez-vous et concentrez le call sur les questions.",
  },
  {
    title: "Agences",
    description:
      "Livrez des démos premium à plusieurs clients depuis un seul espace, avec la gestion multi-marques et un volume mensuel de vidéos.",
  },
  {
    title: "Product marketers",
    description:
      "Chaque lancement de fonctionnalité mérite sa vidéo : formats 16:9, 9:16 et 1:1 pour la landing, LinkedIn et le changelog.",
  },
];

function IconFrame() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="1.5" y="3" width="15" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1.5 6.5h15M4.5 3v12M13.5 3v12" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}
function IconScript() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M4 2.5h10v13H4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6.5 6h5M6.5 9h5M6.5 12h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function IconWave() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M2 9h1.5M5.5 5.5v7M9 3v12M12.5 6v6M16 8v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="10" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="10" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M9 1.5l6 2.5v4.5c0 3.6-2.4 6.3-6 8-3.6-1.7-6-4.4-6-8V4l6-2.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M6.5 9l1.8 1.8L12 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconSpark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M9 2v4M9 12v4M2 9h4M12 9h4M4.5 4.5l2 2M11.5 11.5l2 2M13.5 4.5l-2 2M6.5 11.5l-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <>
      <Header />

      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <HeroReveal>
          <section className="relative overflow-hidden pb-24 pt-36 md:pt-44">
            <div
              aria-hidden
              className="bronze-halo absolute -top-40 left-1/2 h-[560px] w-[860px] -translate-x-1/2"
            />
            <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-[1.05fr_1fr]">
              <div>
                <div data-hero="fade">
                  <Badge tone="bronze">Export 4K · 60 / 90 / 120 secondes</Badge>
                </div>
                <h1
                  data-hero="fade"
                  className="mt-6 font-display text-4xl leading-[1.08] tracking-tight text-coffee md:text-[56px]"
                >
                  Des vidéos de démonstration 4K pour vendre votre SaaS{" "}
                  <em className="text-bronze">sans refaire la même démo.</em>
                </h1>
                <p
                  data-hero="fade"
                  className="mt-6 max-w-xl text-lg leading-relaxed text-warm-gray"
                >
                  Studio One transforme votre produit, vos captures et votre
                  message en une vidéo de démonstration professionnelle de 60,
                  90 ou 120 secondes, prête pour vos prospects, votre landing
                  page et vos équipes commerciales.
                </p>
                <div data-hero="fade" className="mt-9 flex flex-wrap items-center gap-4">
                  <Button href="/register" size="lg">
                    Créer ma première vidéo
                  </Button>
                  <Button href="#workflow" variant="secondary" size="lg">
                    Voir le workflow
                  </Button>
                </div>
                <p data-hero="fade" className="mt-6 text-xs text-warm-gray">
                  Storyboard et script inclus · Aucune compétence de montage
                  requise
                </p>
              </div>

              <EditorMockup />
            </div>
          </section>
        </HeroReveal>

        <FilmRule />

        {/* ── Thèse ────────────────────────────────────────────── */}
        <AnimatedSection className="mx-auto max-w-4xl px-6 py-24 text-center">
          <p className="eyebrow">Pourquoi Studio One</p>
          <h2 className="mt-4 font-display text-3xl leading-snug text-coffee md:text-[40px]">
            Transformez votre SaaS en vidéo de démonstration 4K.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-warm-gray">
            Votre SaaS mérite une démo aussi claire que votre produit. Studio
            One structure votre démonstration — un storyboard clair, un script
            précis, un export impeccable — pour que vos prospects comprennent
            plus vite.
          </p>
        </AnimatedSection>

        {/* ── Workflow ─────────────────────────────────────────── */}
        <section id="workflow" className="bg-cream/60 py-24">
          <div className="mx-auto grid max-w-6xl gap-14 px-6 lg:grid-cols-[1fr_1.2fr]">
            <AnimatedSection as="div">
              <p className="eyebrow">Le workflow</p>
              <h2 className="mt-4 font-display text-3xl leading-snug text-coffee md:text-4xl">
                De vos captures à une vidéo 4K prête à vendre.
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-warm-gray">
                Cinq étapes guidées, chacune validée par vous. Rien ne part au
                rendu sans votre accord — vous gardez le contrôle total du
                storyboard, du script et du montage.
              </p>
              <div className="mt-8">
                <Button href="/register" variant="secondary">
                  Commencer un projet
                </Button>
              </div>
            </AnimatedSection>
            <AnimatedSection as="div" stagger="li">
              <ol>
                {workflowSteps.map((step, i) => (
                  <WorkflowStep
                    key={step.title}
                    index={i + 1}
                    title={step.title}
                    description={step.description}
                  />
                ))}
              </ol>
            </AnimatedSection>
          </div>
        </section>

        {/* ── Exemples ─────────────────────────────────────────── */}
        <AnimatedSection className="mx-auto max-w-6xl px-6 py-24" stagger="article">
          <div id="exemples" className="mb-12 text-center">
            <p className="eyebrow">Exemples de rendus</p>
            <h2 className="mt-4 font-display text-3xl text-coffee md:text-4xl">
              Chaque démo suit une structure qui vend.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Nova CRM",
                type: "Démo commerciale · 90 s",
                scenes: "Problème → Pipeline → Relances → Preuve → Essai gratuit",
              },
              {
                name: "Atlas Analytics",
                type: "Onboarding · 120 s",
                scenes: "Bienvenue → Connexion des données → Premier rapport → Partage",
              },
              {
                name: "Flowdesk",
                type: "Teaser réseaux sociaux · 60 s",
                scenes: "Accroche → Fonctionnalité phare → Bénéfice → CTA",
              },
            ].map((example) => (
              <article
                key={example.name}
                className="group overflow-hidden rounded-2xl border border-hairline bg-ivory shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted"
              >
                <div className="relative aspect-video bg-gradient-to-br from-cream to-[#F0E4D3]">
                  <span className="absolute left-4 top-4">
                    <Badge tone="bronze">4K</Badge>
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-hairline-strong bg-ivory/85 shadow-soft transition-transform duration-300 group-hover:scale-110">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path d="M5 3.5v9l7.5-4.5L5 3.5z" fill="#9A6A3A" />
                      </svg>
                    </span>
                  </span>
                  <div className="film-rule absolute inset-x-0 bottom-0" aria-hidden />
                </div>
                <div className="p-6">
                  <p className="text-xs uppercase tracking-caps text-bronze">
                    {example.type}
                  </p>
                  <h3 className="mt-2 font-display text-xl text-coffee">
                    {example.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-warm-gray">
                    {example.scenes}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </AnimatedSection>

        {/* ── Durées ───────────────────────────────────────────── */}
        <section id="durees" className="bg-cream/60 py-24">
          <AnimatedSection as="div" className="mx-auto max-w-6xl px-6" stagger="article">
            <div className="mb-12 text-center">
              <p className="eyebrow">Trois formats, un standard</p>
              <h2 className="mt-4 font-display text-3xl text-coffee md:text-4xl">
                60, 90 ou 120 secondes pour transformer un produit complexe en
                message simple.
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <VideoDurationCard
                seconds={60}
                title="Impact commercial rapide"
                description="Une accroche, une fonctionnalité phare, un bénéfice, un appel à l'action. Le format qui retient l'attention sur les réseaux et dans les emails de prospection."
                bestFor="réseaux sociaux, séquences d'emailing, publicité."
              />
              <VideoDurationCard
                seconds={90}
                title="Démonstration standard premium"
                description="Le format équilibré : le problème, votre solution, trois fonctionnalités clés et une preuve. Assez court pour être regardé, assez long pour convaincre."
                bestFor="landing pages, rendez-vous sales, onboarding."
                highlighted
              />
              <VideoDurationCard
                seconds={120}
                title="Démonstration complète"
                description="Le storytelling poussé : contexte, cas d'usage, bénéfices chiffrés et preuve client. La démo de référence pour un cycle de vente exigeant."
                bestFor="investisseurs, comités d'achat, verticales métier."
              />
            </div>
          </AnimatedSection>
        </section>

        {/* ── Bénéfices / qualité 4K ───────────────────────────── */}
        <AnimatedSection className="mx-auto max-w-6xl px-6 py-24" stagger="article">
          <div className="mb-12 max-w-2xl">
            <p className="eyebrow">Ce que vous obtenez</p>
            <h2 className="mt-4 font-display text-3xl text-coffee md:text-4xl">
              Un storyboard clair. Un script précis. Un export impeccable.
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<IconFrame />}
              title="Qualité 4K native"
              description="Chaque vidéo est rendue en 4K, avec des déclinaisons 1080p, verticale 9:16 et carrée 1:1 selon votre offre. Nette sur un écran de salon comme sur un téléphone."
            />
            <FeatureCard
              icon={<IconGrid />}
              title="Storyboard scène par scène"
              description="Intro, problème, solution, fonctionnalités, bénéfices, preuve, CTA : la structure éprouvée des démos qui convertissent, chronométrée à la seconde."
            />
            <FeatureCard
              icon={<IconScript />}
              title="Script voix off éditable"
              description="Un script généré à partir de votre brief, avec score de clarté, choix du ton et historique des versions. Vous validez chaque mot."
            />
            <FeatureCard
              icon={<IconWave />}
              title="Sous-titres inclus"
              description="Fichier SRT exporté avec chaque vidéo, pour les lectures en sourdine sur LinkedIn et les exigences d'accessibilité de vos clients."
            />
            <FeatureCard
              icon={<IconSpark />}
              title="Recommandations intelligentes"
              description="Suggestions de scènes selon votre secteur, générateur de CTA final, modèles SaaS B2B, CRM, marketplace, outil IA ou dashboard analytics."
            />
            <FeatureCard
              icon={<IconShield />}
              title="Assets privés, données protégées"
              description="Vos captures restent confidentielles. L'outil signale les données sensibles et vous aide à les flouter avant le rendu."
            />
          </div>
        </AnimatedSection>

        {/* ── Pour qui ─────────────────────────────────────────── */}
        <section id="pour-qui" className="bg-coffee py-24 text-cream">
          <AnimatedSection as="div" className="mx-auto max-w-6xl px-6" stagger="article">
            <div className="mb-12 max-w-2xl">
              <p className="eyebrow text-bronze-light">Pour qui</p>
              <h2 className="mt-4 font-display text-3xl text-ivory md:text-4xl">
                Pensé pour ceux qui vendent un produit chaque jour.
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {audiences.map((audience) => (
                <article
                  key={audience.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-colors duration-300 hover:border-bronze-light/40 hover:bg-white/[0.06]"
                >
                  <h3 className="font-display text-lg text-ivory">{audience.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-cream/65">
                    {audience.description}
                  </p>
                </article>
              ))}
            </div>
          </AnimatedSection>
        </section>

        {/* ── Témoignages ──────────────────────────────────────── */}
        <AnimatedSection className="mx-auto max-w-6xl px-6 py-24" stagger="figure">
          <div className="mb-12 text-center">
            <p className="eyebrow">Ils l&apos;utilisent déjà</p>
            <h2 className="mt-4 font-display text-3xl text-coffee md:text-4xl">
              Des démos qui raccourcissent les cycles de vente.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <TestimonialCard
              quote="Nous envoyons la vidéo 90 secondes avant chaque premier rendez-vous. Les prospects arrivent en ayant déjà compris le produit — le call sert enfin à vendre."
              name="Claire Fontanel"
              role="Head of Sales, Nova CRM"
            />
            <TestimonialCard
              quote="Le storyboard généré m'a évité trois allers-retours avec un freelance vidéo. J'ai validé les scènes, ajusté deux phrases du script, exporté. Une matinée."
              name="Julien Maret"
              role="Fondateur, Atlas Analytics"
            />
            <TestimonialCard
              quote="Le mode agence change tout : dix vidéos par mois, plusieurs marques, un seul espace. Nos clients pensent qu'on a recruté une équipe motion."
              name="Sofia Andrade"
              role="Directrice, Studio Braise"
            />
          </div>
        </AnimatedSection>

        {/* ── Sécurité ─────────────────────────────────────────── */}
        <section id="securite" className="bg-cream/60 py-24">
          <AnimatedSection as="div" className="mx-auto max-w-6xl px-6">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <p className="eyebrow">Sécurité et confiance</p>
                <h2 className="mt-4 font-display text-3xl text-coffee md:text-4xl">
                  Vos données produit ne quittent jamais votre contrôle.
                </h2>
                <p className="mt-5 max-w-md text-base leading-relaxed text-warm-gray">
                  Une démo publique ne doit jamais exposer une donnée client.
                  Studio One est conçu pour que rien ne parte au rendu sans
                  votre validation explicite.
                </p>
              </div>
              <ul className="space-y-4">
                {[
                  "Utilisez des comptes de démonstration — jamais vos données clients réelles.",
                  "Détection et floutage des informations sensibles avant l'export.",
                  "Assets privés, accessibles uniquement à votre équipe.",
                  "Contrôle total du storyboard : chaque scène est validée par vous.",
                  "Checklist de vérification avant tout rendu final.",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-xl border border-hairline bg-ivory px-5 py-4 text-sm text-coffee/85 shadow-soft"
                  >
                    <svg className="mt-0.5 shrink-0 text-bronze" width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden>
                      <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>
        </section>

        {/* ── Pricing ──────────────────────────────────────────── */}
        <AnimatedSection className="mx-auto max-w-6xl px-6 py-24">
          <div id="pricing" className="mb-12 text-center">
            <p className="eyebrow">Tarifs</p>
            <h2 className="mt-4 font-display text-3xl text-coffee md:text-4xl">
              Un prix par vidéo. Ou un rythme mensuel.
            </h2>
          </div>
          <PricingSection compact />
        </AnimatedSection>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <AnimatedSection className="bg-cream/60 py-24">
          <div id="faq" className="mx-auto max-w-6xl px-6">
            <div className="mb-12 text-center">
              <p className="eyebrow">Questions fréquentes</p>
              <h2 className="mt-4 font-display text-3xl text-coffee md:text-4xl">
                Tout ce qu&apos;il faut savoir avant votre première vidéo.
              </h2>
            </div>
            <Faq />
          </div>
        </AnimatedSection>

        {/* ── CTA final ────────────────────────────────────────── */}
        <AnimatedSection className="relative overflow-hidden py-28">
          <div
            aria-hidden
            className="bronze-halo absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2"
          />
          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-display text-4xl leading-tight text-coffee md:text-5xl">
              Votre prochaine démo est à cinq étapes d&apos;ici.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-warm-gray">
              Créez votre espace, décrivez votre produit, et repartez avec une
              vidéo de démonstration 4K prête à vendre.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Button href="/register" size="lg">
                Créer ma première vidéo
              </Button>
              <Button href="/pricing" variant="secondary" size="lg">
                Comparer les offres
              </Button>
            </div>
          </div>
        </AnimatedSection>
      </main>

      <Footer />
    </>
  );
}
