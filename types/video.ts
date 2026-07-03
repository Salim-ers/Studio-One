export type VideoDuration = 60 | 90 | 120;

export type VideoObjective =
  | "demo-commerciale"
  | "onboarding"
  | "fonctionnalite"
  | "landing-page"
  | "verticale-metier"
  | "avant-apres"
  | "investisseurs"
  | "reseaux-sociaux";

export type VideoTone =
  | "premium"
  | "pedagogique"
  | "dynamique"
  | "corporate"
  | "chaleureux"
  | "direct";

export type ProjectStatus =
  | "draft"
  | "storyboard_ready"
  | "script_ready"
  | "rendering"
  | "export_ready";

export type ExportFormat = "16:9" | "9:16" | "1:1";

export interface StoryboardScene {
  id: string;
  order: number;
  title: string;
  role:
    | "intro"
    | "probleme"
    | "solution"
    | "fonctionnalites"
    | "benefices"
    | "preuve"
    | "conclusion"
    | "cta";
  description: string;
  durationSeconds: number;
  asset?: string;
  voiceOver: string;
}

export interface VideoProject {
  id: string;
  name: string;
  productName: string;
  status: ProjectStatus;
  objective: VideoObjective;
  duration: VideoDuration;
  tone: VideoTone;
  language: string;
  formats: ExportFormat[];
  scenes: StoryboardScene[];
  scriptVersion: number;
  clarityScore: number;
  renderProgress: number;
  createdAt: string;
  updatedAt: string;
  lastExportAt?: string;
  /** Début du rendu simulé — la progression est calculée à la lecture. */
  renderStartedAt?: string;
  /** Captures produit (data URLs réduites) animées dans la vidéo. */
  images?: string[];
}

export interface ProjectBrief {
  productName: string;
  productUrl: string;
  sector: string;
  audience: string;
  problem: string;
  promise: string;
  tone: VideoTone | "";
  language: string;
  cta: string;
}
