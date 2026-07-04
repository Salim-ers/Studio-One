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

## Comptes de démonstration

L'authentification est fonctionnelle mais volontairement légère : comptes
en mémoire, sessions signées (cookie HMAC), sans base de données. Deux
comptes sont seedés au démarrage :

| Compte | Email | Mot de passe | Plan affiché |
|---|---|---|---|
| Illimité | `salim.elrs@gmail.com` | `StudioOne2026!` | Illimité (∞) |
| Growth | `demo@studio-one.test` | `DemoStudio2026!` | Growth — 5 crédits/mois |

**Mode test : le paiement est désactivé.** Tout compte connecté peut
générer une vidéo de bout en bout : tunnel en 8 étapes → « Lancer le
rendu 4K » (aucun paiement, aucun crédit décompté) → rendu simulé
~90 secondes → export prêt. Les plans et crédits affichés sont
informatifs ; les routes Stripe (`app/api/stripe/*`) restent en place,
prêtes à être rebranchées sur le tunnel. L'inscription via `/register`
crée un compte Starter qui vit le temps du processus serveur.

**Les projets créés sont stockés dans votre navigateur** (localStorage)
et la progression du rendu se calcule depuis l'horloge : le parcours
fonctionne donc aussi en déploiement serverless (Vercel), sans base de
données. Conséquence : vos projets sont propres à chaque navigateur.
Les quatre projets d'exemple, eux, sont seedés côté serveur.

**Les exports se téléchargent réellement**, générés dans le navigateur :
vidéo de démonstration encodée image par image via WebCodecs (MP4 H.264,
repli WebM VP8/VP9) aux formats 16:9, 9:16 et 1:1 avec sous-titres
incrustés (sans audio), sous-titres SRT calés sur les scènes, script et
storyboard en fichiers texte. Le rendu est un vrai montage animé (fond
animé, typographie cinétique, mock d'interface, effet Ken Burns sur les
captures produit, ouverture et CTA) — voir `lib/video-scenes.ts`.

## Voix off + musique (ElevenLabs)

Ajoute `ELEVENLABS_API_KEY` (et éventuellement `ELEVENLABS_VOICE_ID`) dans
`.env.local` pour activer l'audio. Une option « Voix off + musique (IA) »
apparaît alors dans les exports : la narration (TTS ElevenLabs, voix off du
script) et une musique de fond (Eleven Music, en sourdine sous la voix) sont
mixées dans la vidéo. Ce rendu utilise `MediaRecorder` + `captureStream`
(muxage audio/vidéo natif, fiable Chrome/Firefox) : il se fait **en temps
réel** (durée de la vidéo) et exporte un WebM. La clé reste côté serveur
(`app/api/audio/*`), jamais exposée au navigateur.

## Script piloté par IA (Claude)

Ajoute `ANTHROPIC_API_KEY` dans `.env.local` pour que le storyboard et la voix
off soient **écrits par Claude** (Opus 4.8, sortie structurée) à partir du
champ « Ce que tu veux » et des paramètres du tunnel — le rendu s'adapte alors
vraiment à ce que tu demandes. La clé reste côté serveur (`app/api/ai/*`).
Sans clé, le tunnel retombe sur la génération par gabarit.

## Captures produit

Dépose des captures de ton SaaS à l'étape « Assets » du tunnel : elles sont
réduites côté client et animées (zoom, panoramique) dans la vidéo. Pour les
récupérer automatiquement, un script Playwright se connecte à ton app et
capture les écrans clés (voir `references/README.md`) :

```bash
cp capture.config.example.json capture.config.json   # puis édite-le
npm run capture                 # login automatique (sélecteurs)
npm run capture -- --manual     # login à la main (2FA, Google…)
```

Variables : `AUTH_SECRET` (secret de session), `SEED_ADMIN_PASSWORD` et
`SEED_DEMO_PASSWORD` (surcharge des mots de passe seedés). Des valeurs
par défaut existent en développement — **définissez-les en production**.

## Tests E2E (Playwright)

```bash
npx playwright install chromium   # première fois uniquement
npm run test:e2e
```

Le serveur de dev est lancé automatiquement. Les tests couvrent la
protection du dashboard, la connexion/déconnexion et le parcours complet
de génération d'une vidéo avec le compte illimité (rendu simulé compris).
Un outil externe (agent, CI) peut piloter l'app de la même façon : il lui
suffit des identifiants ci-dessus — surchargeables via `E2E_ADMIN_EMAIL`
et `E2E_ADMIN_PASSWORD`.

## Pages

| Route | Description |
|---|---|
| `/` | Landing page (hero cinématique, workflow, formats, pricing, FAQ) |
| `/pricing` | Tarifs — à la vidéo ou abonnement, bascule intégrée |
| `/login`, `/register` | Authentification fonctionnelle (sessions cookie signées, comptes en mémoire) |
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
app/            pages App Router + routes API (auth, Stripe)
components/
  marketing/    header, footer, hero, pricing, FAQ, auth
  dashboard/    shell, sidebar, wizard, projets, script, upload
  billing/      carte d'abonnement + Customer Portal
  motion/       AnimatedSection, HeroReveal, MagneticButton (GSAP)
  ui/           Button, Badge, Field, EmptyState, ProgressTimeline…
lib/            auth, session, project-factory, local-projects,
                projects-store, render, pricing, mock-data, stripe
types/          video.ts, billing.ts
e2e/            tests Playwright (auth + génération vidéo)
public/brand/   logos Studio One
```

Les comptes vivent en mémoire (`lib/auth.ts`), les projets créés dans le
navigateur (`lib/local-projects.ts`), et le rendu vidéo est simulé
(~90 s, `lib/render.ts`) : remplacez ces modules par vos appels base de
données et votre pipeline de rendu sans toucher aux composants.

## Déploiement

Compatible Vercel sans configuration : ajoutez simplement les variables
d'environnement, puis pointez le webhook Stripe vers
`https://votre-domaine.com/api/stripe/webhook`.
