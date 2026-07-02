# Studio One

Application SaaS premium de génération de vidéos de démonstration 4K
(60 / 90 / 120 secondes), construite avec Next.js App Router, TypeScript,
Tailwind CSS et GSAP.

## Démarrage

```bash
npm install
cp .env.example .env   # puis renseignez vos clés Stripe
npm run dev
```

L'application fonctionne sans clés Stripe : les boutons de paiement
affichent alors un message de mode démonstration au lieu de rediriger
vers Checkout.

## Pages

| Route | Description |
|---|---|
| `/` | Landing page (hero cinématique, workflow, formats, pricing, FAQ) |
| `/pricing` | Tarifs — à la vidéo ou abonnement, bascule intégrée |
| `/login`, `/register` | Authentification (prête à connecter : NextAuth, Clerk, Supabase…) |
| `/dashboard` | Vue d'ensemble : stats, projets, rendu en cours, exports, modèles |
| `/dashboard/new-video` | Tunnel de création en 8 étapes avec preview latérale |
| `/dashboard/projects/[id]` | Page projet : storyboard, script éditable, exports |
| `/dashboard/billing` | Plan actuel, crédits, historique, Customer Portal |

## Stripe

Routes API : `POST /api/stripe/checkout`, `POST /api/stripe/portal`,
`POST /api/stripe/webhook`.

Variables d'environnement attendues (voir `.env.example`) :
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`,
`STRIPE_PRICE_60`, `STRIPE_PRICE_90`, `STRIPE_PRICE_120`,
`STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_AGENCY`.

Le webhook gère `checkout.session.completed`, la création / mise à jour /
suppression d'abonnement et `invoice.payment_failed` — chaque branche
contient un TODO à relier à votre base de données.

## Direction artistique

- Palette : bronze `#9A6A3A`, bronze profond `#6F4726`, caramel `#B9854D`,
  blanc cassé `#F8F3EC`, ivoire `#FFFDF8`, noir café `#18110C`,
  gris chaud `#8C8178`, hairline `rgba(154,106,58,.18)`.
- Typographies : **Fraunces** (display serif, chargée via `next/font`) et
  **Instrument Sans** (texte). Le script est réservé au logo.
- Signature : la « règle pellicule » (`.film-rule`), motif de timeline
  gradué repris du logo, utilisée en séparateur et dans les mockups.
- Animations GSAP : reveal orchestré du hero, apparitions au scroll
  (`AnimatedSection`), transitions d'étapes du tunnel, timeline animée.
  `prefers-reduced-motion` est respecté partout via `gsap.matchMedia`.

## Architecture

```
app/            pages App Router + routes API Stripe
components/
  marketing/    header, footer, hero, pricing, FAQ, auth
  dashboard/    shell, sidebar, wizard, projets, script, upload
  billing/      carte d'abonnement + Customer Portal
  motion/       AnimatedSection, HeroReveal, MagneticButton (GSAP)
  ui/           Button, Badge, Field, EmptyState, ProgressTimeline…
lib/            pricing, mock-data, stripe, utils
types/          video.ts, billing.ts
public/brand/   logos Studio One
```

Les données sont mockées dans `lib/mock-data.ts` (projets, scènes,
abonnement, factures) : remplacez-les par vos appels base de données
sans toucher aux composants.

## Déploiement

Compatible Vercel sans configuration : ajoutez simplement les variables
d'environnement, puis pointez le webhook Stripe vers
`https://votre-domaine.com/api/stripe/webhook`.
