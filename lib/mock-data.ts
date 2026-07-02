import type { VideoProject, StoryboardScene } from "@/types/video";
import type { Invoice, SubscriptionState } from "@/types/billing";

const novaCrmScenes: StoryboardScene[] = [
  {
    id: "sc-1",
    order: 1,
    role: "intro",
    title: "Ouverture produit",
    description: "Logo Nova CRM sur fond ivoire, interface qui apparaît en fondu.",
    durationSeconds: 6,
    asset: "capture-dashboard.png",
    voiceOver: "Votre pipeline commercial mérite mieux qu'un tableur partagé.",
  },
  {
    id: "sc-2",
    order: 2,
    role: "probleme",
    title: "Le problème",
    description: "Split-screen : notes éparpillées, relances oubliées, deals perdus.",
    durationSeconds: 12,
    asset: "capture-avant.png",
    voiceOver:
      "Chaque semaine, des opportunités se perdent entre les emails, les notes et les rappels manqués.",
  },
  {
    id: "sc-3",
    order: 3,
    role: "solution",
    title: "La solution Nova",
    description: "Zoom sur le pipeline Kanban, cartes qui se déplacent.",
    durationSeconds: 14,
    asset: "capture-pipeline.png",
    voiceOver:
      "Nova CRM centralise chaque contact, chaque relance et chaque deal dans un pipeline clair.",
  },
  {
    id: "sc-4",
    order: 4,
    role: "fonctionnalites",
    title: "Fonctionnalités clés",
    description: "Trois plans rapides : relances automatiques, scoring, rapports.",
    durationSeconds: 20,
    asset: "capture-features.png",
    voiceOver:
      "Relances automatiques, scoring des prospects, rapports en un clic : votre équipe vend, Nova s'occupe du reste.",
  },
  {
    id: "sc-5",
    order: 5,
    role: "benefices",
    title: "Bénéfices concrets",
    description: "Chiffres animés : +32 % de deals conclus, 5 h gagnées par semaine.",
    durationSeconds: 12,
    voiceOver:
      "Résultat : plus de deals conclus, moins de temps perdu en saisie.",
  },
  {
    id: "sc-6",
    order: 6,
    role: "preuve",
    title: "Preuve client",
    description: "Citation d'un client avec logo, sur carte crème.",
    durationSeconds: 10,
    voiceOver:
      "Comme l'équipe d'Atelier Lumière, qui a doublé son taux de réponse en deux mois.",
  },
  {
    id: "sc-7",
    order: 7,
    role: "conclusion",
    title: "Conclusion",
    description: "Retour sur l'interface, mouvement de caméra lent.",
    durationSeconds: 8,
    voiceOver: "Nova CRM. Un pipeline propre, une équipe concentrée.",
  },
  {
    id: "sc-8",
    order: 8,
    role: "cta",
    title: "Appel à l'action",
    description: "Écran final : logo, URL, bouton d'essai gratuit.",
    durationSeconds: 8,
    voiceOver: "Essayez Nova CRM gratuitement pendant 14 jours sur novacrm.fr.",
  },
];

export const mockProjects: VideoProject[] = [
  {
    id: "prj-nova-crm",
    name: "Nova CRM — Démo commerciale",
    productName: "Nova CRM",
    status: "rendering",
    objective: "demo-commerciale",
    duration: 90,
    tone: "premium",
    language: "Français",
    formats: ["16:9", "9:16", "1:1"],
    scenes: novaCrmScenes,
    scriptVersion: 3,
    clarityScore: 92,
    renderProgress: 64,
    createdAt: "2026-06-24T09:12:00.000Z",
    updatedAt: "2026-07-01T16:40:00.000Z",
  },
  {
    id: "prj-atlas-onboarding",
    name: "Atlas Analytics — Onboarding",
    productName: "Atlas Analytics",
    status: "export_ready",
    objective: "onboarding",
    duration: 120,
    tone: "pedagogique",
    language: "Français",
    formats: ["16:9"],
    scenes: novaCrmScenes.slice(0, 6),
    scriptVersion: 2,
    clarityScore: 88,
    renderProgress: 100,
    createdAt: "2026-06-10T10:00:00.000Z",
    updatedAt: "2026-06-28T11:05:00.000Z",
    lastExportAt: "2026-06-28T11:05:00.000Z",
  },
  {
    id: "prj-flowdesk-social",
    name: "Flowdesk — Teaser réseaux sociaux",
    productName: "Flowdesk",
    status: "script_ready",
    objective: "reseaux-sociaux",
    duration: 60,
    tone: "dynamique",
    language: "Anglais",
    formats: ["9:16", "1:1"],
    scenes: novaCrmScenes.slice(0, 5),
    scriptVersion: 1,
    clarityScore: 78,
    renderProgress: 0,
    createdAt: "2026-06-29T14:30:00.000Z",
    updatedAt: "2026-06-30T09:15:00.000Z",
  },
  {
    id: "prj-kalio-investisseurs",
    name: "Kalio — Pitch investisseurs",
    productName: "Kalio",
    status: "draft",
    objective: "investisseurs",
    duration: 120,
    tone: "corporate",
    language: "Français",
    formats: ["16:9"],
    scenes: [],
    scriptVersion: 0,
    clarityScore: 0,
    renderProgress: 0,
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-01T08:00:00.000Z",
  },
];

export const mockSubscription: SubscriptionState = {
  planId: "growth",
  planName: "Growth",
  status: "active",
  renewsAt: "2026-07-18T00:00:00.000Z",
  creditsTotal: 5,
  creditsUsed: 3,
};

export const mockInvoices: Invoice[] = [
  {
    id: "inv-2026-06",
    date: "2026-06-18T00:00:00.000Z",
    label: "Abonnement Growth — juin 2026",
    amount: 549,
    status: "paid",
  },
  {
    id: "inv-2026-05",
    date: "2026-05-18T00:00:00.000Z",
    label: "Abonnement Growth — mai 2026",
    amount: 549,
    status: "paid",
  },
  {
    id: "inv-video-90",
    date: "2026-04-30T00:00:00.000Z",
    label: "Vidéo Pro 90 s — Atlas Analytics",
    amount: 249,
    status: "paid",
  },
];

export const statusLabels: Record<
  VideoProject["status"],
  { label: string; tone: "neutral" | "bronze" | "progress" | "success" }
> = {
  draft: { label: "Brouillon", tone: "neutral" },
  storyboard_ready: { label: "Storyboard prêt", tone: "bronze" },
  script_ready: { label: "Script prêt", tone: "bronze" },
  rendering: { label: "Rendu en cours", tone: "progress" },
  export_ready: { label: "Export prêt", tone: "success" },
};

export const objectiveLabels: Record<VideoProject["objective"], string> = {
  "demo-commerciale": "Démo SaaS commerciale",
  onboarding: "Démo onboarding",
  fonctionnalite: "Démo fonctionnalité",
  "landing-page": "Démo pour landing page",
  "verticale-metier": "Démo verticale métier",
  "avant-apres": "Démo avant / après",
  investisseurs: "Démo pour investisseurs",
  "reseaux-sociaux": "Vidéo courte réseaux sociaux",
};
