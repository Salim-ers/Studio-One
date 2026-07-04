"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, TextInput, TextArea, Select } from "@/components/ui/Field";
import { UploadDropzone } from "@/components/dashboard/UploadDropzone";
import { buildProject } from "@/lib/project-factory";
import { saveLocalProject } from "@/lib/local-projects";
import { generateAiScenes, isAiConfigured, type AiScene } from "@/lib/ai-script";
import { cn } from "@/lib/utils";
import type { VideoDuration, VideoObjective, VideoTone } from "@/types/video";

/* ── Données du tunnel ─────────────────────────────────────────── */

const steps = [
  "Objectif",
  "Durée",
  "Produit",
  "Assets",
  "Storyboard",
  "Script",
  "Prévisualisation",
  "Export",
] as const;

const objectives: {
  key: VideoObjective;
  label: string;
  detail: string;
  suggestedDuration: VideoDuration;
}[] = [
  { key: "demo-commerciale", label: "Démo SaaS commerciale", detail: "Convaincre un prospect avant ou après un rendez-vous.", suggestedDuration: 90 },
  { key: "onboarding", label: "Démo onboarding", detail: "Guider un nouvel utilisateur vers son premier succès.", suggestedDuration: 120 },
  { key: "fonctionnalite", label: "Démo fonctionnalité", detail: "Mettre en avant un lancement ou une nouveauté.", suggestedDuration: 60 },
  { key: "landing-page", label: "Démo pour landing page", detail: "La vidéo qui remplace mille mots au-dessus du pli.", suggestedDuration: 90 },
  { key: "verticale-metier", label: "Démo verticale métier", detail: "Parler le langage d'un secteur précis.", suggestedDuration: 120 },
  { key: "avant-apres", label: "Démo avant / après", detail: "Montrer la transformation que permet votre produit.", suggestedDuration: 90 },
  { key: "investisseurs", label: "Démo pour investisseurs", detail: "Un produit clair en ouverture de pitch deck.", suggestedDuration: 120 },
  { key: "reseaux-sociaux", label: "Vidéo courte réseaux sociaux", detail: "Un teaser rythmé pour LinkedIn ou X.", suggestedDuration: 60 },
];

const durations: { value: VideoDuration; title: string; detail: string }[] = [
  { value: 40, title: "Pub / réseaux — full démo", detail: "40 secondes ultra-rythmées : accroche, produit, bénéfice, CTA. Le format publicité et social." },
  { value: 60, title: "Impact commercial rapide", detail: "Accroche, fonctionnalité phare, bénéfice, CTA. Le format des réseaux et de la prospection." },
  { value: 90, title: "Démonstration standard premium", detail: "Problème, solution, trois fonctionnalités, preuve. Le format recommandé pour la plupart des démos." },
  { value: 120, title: "Démonstration complète", detail: "Storytelling poussé : contexte, cas d'usage, bénéfices chiffrés, preuve client." },
];

const sceneStructure = [
  { role: "Intro", share: 0.08 },
  { role: "Problème", share: 0.14 },
  { role: "Solution", share: 0.18 },
  { role: "Fonctionnalités", share: 0.22 },
  { role: "Bénéfices", share: 0.13 },
  { role: "Preuve", share: 0.1 },
  { role: "Conclusion", share: 0.07 },
  { role: "CTA", share: 0.08 },
] as const;

const tones: { key: VideoTone; label: string }[] = [
  { key: "premium", label: "Premium" },
  { key: "pedagogique", label: "Pédagogique" },
  { key: "dynamique", label: "Dynamique" },
  { key: "corporate", label: "Corporate" },
  { key: "chaleureux", label: "Chaleureux" },
  { key: "direct", label: "Direct" },
];

interface WizardState {
  objective: VideoObjective | null;
  duration: VideoDuration | null;
  productName: string;
  productUrl: string;
  sector: string;
  audience: string;
  problem: string;
  promise: string;
  tone: VideoTone;
  language: string;
  cta: string;
  brandColors: string;
  storyboardGenerated: boolean;
  aiScenes: AiScene[] | null;
  scriptText: string;
  narrationStyle: "voix-off" | "demonstration" | "temoignage";
  scriptLength: "concis" | "standard" | "detaille";
  subtitles: boolean;
  screenshots: string[];
  brief: string;
}

const initialState: WizardState = {
  objective: null,
  duration: null,
  productName: "",
  productUrl: "",
  sector: "",
  audience: "",
  problem: "",
  promise: "",
  tone: "premium",
  language: "Français",
  cta: "",
  brandColors: "",
  storyboardGenerated: false,
  aiScenes: null,
  scriptText: "",
  narrationStyle: "voix-off",
  scriptLength: "standard",
  subtitles: true,
  screenshots: [],
  brief: "",
};

/* ── Génération simulée ────────────────────────────────────────── */

function buildScript(state: WizardState): string {
  const name = state.productName || "votre produit";
  const problem = state.problem || "un processus lent et frustrant";
  const promise = state.promise || "un résultat clair, plus vite";
  const audience = state.audience || "vos équipes";
  const cta = state.cta || `Essayez ${name} dès aujourd'hui.`;
  const hook =
    state.brief.trim() ||
    `${audience.charAt(0).toUpperCase() + audience.slice(1)} perdent un temps précieux face à ${problem}.`;
  return [
    hook,
    `${name} change la donne : ${promise}.`,
    `En quelques clics, tout est structuré, visible et partageable — sans formation, sans friction.`,
    `Résultat : des décisions plus rapides et une équipe concentrée sur ce qui compte.`,
    cta,
  ].join("\n\n");
}

/* ── Composant principal ───────────────────────────────────────── */

export function NewVideoWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(initialState);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [generating, setGenerating] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [launchNotice, setLaunchNotice] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  /* Sauvegarde automatique simulée */
  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
    setSaveStatus("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveStatus("saved"), 700);
  }

  /* Génération IA disponible ? (clé côté serveur) */
  useEffect(() => {
    let alive = true;
    isAiConfigured().then((ok) => {
      if (alive) setAiAvailable(ok);
    });
    return () => {
      alive = false;
    };
  }, []);

  /* Transition GSAP entre étapes */
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
    });
    return () => mm.revert();
  }, [step]);

  const scenes = useMemo(() => {
    if (!state.duration) return [];
    return sceneStructure.map((s, i) => ({
      ...s,
      order: i + 1,
      seconds: Math.round(s.share * state.duration!),
    }));
  }, [state.duration]);

  const suggested = objectives.find((o) => o.key === state.objective);

  const canContinue = [
    state.objective !== null,
    state.duration !== null,
    state.productName.trim().length > 1 && state.promise.trim().length > 3,
    true, // assets optionnels
    state.storyboardGenerated,
    state.scriptText.trim().length > 20,
    true,
    false, // dernière étape : pas de "continuer"
  ][step];

  const checklist = [
    { label: "Objectif et durée définis", done: !!state.objective && !!state.duration },
    { label: "Brief produit complété", done: state.productName.trim().length > 1 && state.promise.trim().length > 3 },
    { label: "Storyboard validé", done: state.storyboardGenerated },
    { label: "Script relu et enregistré", done: state.scriptText.trim().length > 20 },
    { label: "Données sensibles vérifiées (comptes de démo uniquement)", done: true },
  ];
  const checklistComplete = checklist.every((c) => c.done);

  async function generateStoryboard() {
    setGenerating(true);
    // Avec l'IA (si configurée), le storyboard et la voix off sont écrits par
    // Claude à partir du brief. Sinon, repli sur le gabarit.
    if (aiAvailable && state.objective && state.duration) {
      try {
        const scenes = await generateAiScenes({
          productName: state.productName.trim(),
          duration: state.duration,
          tone: state.tone,
          language: state.language,
          objective: state.objective,
          brief: state.brief,
          problem: state.problem,
          promise: state.promise,
          audience: state.audience,
          cta: state.cta,
          sector: state.sector,
        });
        setState((prev) => ({
          ...prev,
          aiScenes: scenes,
          storyboardGenerated: true,
          scriptText: scenes.map((s) => s.voiceOver.trim()).filter(Boolean).join("\n\n"),
        }));
        setSaveStatus("saved");
        setGenerating(false);
        return;
      } catch {
        // repli silencieux sur le gabarit
      }
    }
    setTimeout(() => {
      update("storyboardGenerated", true);
      setGenerating(false);
    }, 1100);
  }

  function generateScript() {
    setGenerating(true);
    setTimeout(() => {
      const text = state.aiScenes
        ? state.aiScenes.map((s) => s.voiceOver.trim()).filter(Boolean).join("\n\n")
        : buildScript(state);
      update("scriptText", text);
      setGenerating(false);
    }, 700);
  }

  function launchRender() {
    if (!state.objective || !state.duration) return;
    setLaunching(true);
    setLaunchNotice(null);

    // Le projet est construit à partir du brief et conservé dans le
    // navigateur : aucun serveur requis, le rendu simulé démarre tout de suite.
    const project = buildProject({
      objective: state.objective,
      duration: state.duration,
      productName: state.productName.trim(),
      productUrl: state.productUrl,
      sector: state.sector,
      audience: state.audience,
      problem: state.problem,
      promise: state.promise,
      tone: state.tone,
      language: state.language,
      cta: state.cta,
      scriptText: state.scriptText,
      subtitles: state.subtitles,
      images: state.screenshots,
      aiScenes: state.aiScenes ?? undefined,
    });

    if (!saveLocalProject(project)) {
      setLaunchNotice(
        "Impossible d'enregistrer le projet dans ce navigateur (stockage local indisponible)."
      );
      setLaunching(false);
      return;
    }

    router.push(`/dashboard/projects/${project.id}`);
  }

  /* ── Rendu ── */

  return (
    <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr]">
      <div className="min-w-0">
        {/* Barre de progression */}
        <nav aria-label="Étapes de création" className="card-surface p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-coffee">
              Étape {step + 1} sur {steps.length} —{" "}
              <span className="text-bronze-deep">{steps[step]}</span>
            </p>
            <p
              className={cn(
                "text-xs transition-colors",
                saveStatus === "saving" ? "text-bronze" : "text-warm-gray"
              )}
              role="status"
            >
              {saveStatus === "saving" && "Enregistrement…"}
              {saveStatus === "saved" && "Brouillon enregistré"}
              {saveStatus === "idle" && "Enregistrement automatique"}
            </p>
          </div>
          <div className="mt-3 flex gap-1.5" aria-hidden>
            {steps.map((s, i) => (
              <div key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream">
                <div
                  className={cn(
                    "h-full rounded-full bg-bronze transition-all duration-500",
                    i < step ? "w-full" : i === step ? "w-1/2" : "w-0"
                  )}
                />
              </div>
            ))}
          </div>
        </nav>

        {/* Panneau d'étape */}
        <div ref={panelRef} className="card-surface mt-6 p-6 md:p-8">
          {/* 1 — Objectif */}
          {step === 0 && (
            <>
              <h2 className="font-display text-2xl text-coffee">
                Quel est l&apos;objectif de cette vidéo ?
              </h2>
              <p className="mt-2 text-sm text-warm-gray">
                Le type de vidéo détermine la structure du storyboard et le ton
                recommandé.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {objectives.map((obj) => (
                  <button
                    key={obj.key}
                    onClick={() => update("objective", obj.key)}
                    aria-pressed={state.objective === obj.key}
                    className={cn(
                      "rounded-xl border p-5 text-left transition-all duration-200",
                      state.objective === obj.key
                        ? "border-bronze bg-[#F3E9DC]/60 shadow-soft"
                        : "border-hairline hover:border-bronze/40 hover:bg-cream/40"
                    )}
                  >
                    <span className="block text-sm font-medium text-coffee">
                      {obj.label}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-warm-gray">
                      {obj.detail}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* 2 — Durée */}
          {step === 1 && (
            <>
              <h2 className="font-display text-2xl text-coffee">
                Quelle durée pour votre démonstration ?
              </h2>
              {suggested && (
                <p className="mt-2 text-sm text-warm-gray">
                  Recommandation pour «&nbsp;{suggested.label}&nbsp;» :{" "}
                  <span className="font-medium text-bronze-deep">
                    {suggested.suggestedDuration} secondes
                  </span>
                  .
                </p>
              )}
              <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {durations.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => update("duration", d.value)}
                    aria-pressed={state.duration === d.value}
                    className={cn(
                      "relative rounded-xl border p-5 text-left transition-all duration-200",
                      state.duration === d.value
                        ? "border-bronze bg-[#F3E9DC]/60 shadow-soft"
                        : "border-hairline hover:border-bronze/40 hover:bg-cream/40"
                    )}
                  >
                    {suggested?.suggestedDuration === d.value && (
                      <Badge tone="bronze" className="absolute -top-2.5 right-4">
                        Recommandé
                      </Badge>
                    )}
                    <span className="flex items-baseline gap-1">
                      <span className="font-display text-3xl text-bronze">{d.value}</span>
                      <span className="text-xs uppercase tracking-caps text-warm-gray">sec</span>
                    </span>
                    <span className="mt-2 block text-sm font-medium text-coffee">{d.title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-warm-gray">{d.detail}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* 3 — Produit */}
          {step === 2 && (
            <>
              <h2 className="font-display text-2xl text-coffee">Parlez-nous de votre produit.</h2>
              <p className="mt-2 text-sm text-warm-gray">
                Ces informations alimentent le storyboard et le script. Plus le
                brief est précis, plus la démo est juste.
              </p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Nom du produit" htmlFor="productName">
                  <TextInput
                    id="productName"
                    value={state.productName}
                    onChange={(e) => update("productName", e.target.value)}
                    placeholder="Nova CRM"
                  />
                </Field>
                <Field label="URL du produit" htmlFor="productUrl">
                  <TextInput
                    id="productUrl"
                    type="url"
                    value={state.productUrl}
                    onChange={(e) => update("productUrl", e.target.value)}
                    placeholder="https://novacrm.fr"
                  />
                </Field>
                <Field label="Secteur" htmlFor="sector">
                  <TextInput
                    id="sector"
                    value={state.sector}
                    onChange={(e) => update("sector", e.target.value)}
                    placeholder="CRM pour PME"
                  />
                </Field>
                <Field label="Audience cible" htmlFor="audience">
                  <TextInput
                    id="audience"
                    value={state.audience}
                    onChange={(e) => update("audience", e.target.value)}
                    placeholder="les équipes commerciales de PME"
                  />
                </Field>
                <Field label="Problème résolu" htmlFor="problem" className="sm:col-span-2">
                  <TextArea
                    id="problem"
                    value={state.problem}
                    onChange={(e) => update("problem", e.target.value)}
                    placeholder="Les relances se perdent entre les emails, les notes et les tableurs partagés."
                  />
                </Field>
                <Field
                  label="Promesse principale"
                  htmlFor="promise"
                  hint="Une phrase : ce que votre produit change concrètement."
                  className="sm:col-span-2"
                >
                  <TextInput
                    id="promise"
                    value={state.promise}
                    onChange={(e) => update("promise", e.target.value)}
                    placeholder="un pipeline clair et des relances qui partent toutes seules"
                  />
                </Field>
                <Field label="Ton de la vidéo" htmlFor="tone">
                  <Select
                    id="tone"
                    value={state.tone}
                    onChange={(e) => update("tone", e.target.value as VideoTone)}
                  >
                    {tones.map((t) => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Langue de la vidéo" htmlFor="language">
                  <Select
                    id="language"
                    value={state.language}
                    onChange={(e) => update("language", e.target.value)}
                  >
                    <option>Français</option>
                    <option>Anglais</option>
                    <option>Espagnol</option>
                    <option>Allemand</option>
                    <option>Italien</option>
                  </Select>
                </Field>
                <Field label="CTA final souhaité" htmlFor="cta" className="sm:col-span-2">
                  <TextInput
                    id="cta"
                    value={state.cta}
                    onChange={(e) => update("cta", e.target.value)}
                    placeholder="Essayez Nova CRM gratuitement pendant 14 jours."
                  />
                </Field>
                <Field
                  label="Ce que tu veux (accroche / angle)"
                  htmlFor="brief"
                  hint="Dicte le ton et le message d'ouverture — c'est ce qui pilote le script."
                  className="sm:col-span-2"
                >
                  <TextArea
                    id="brief"
                    value={state.brief}
                    onChange={(e) => update("brief", e.target.value)}
                    placeholder="Ex. : Punchy et rassurant. Montrer que Nova fait gagner 5 h par semaine aux commerciaux."
                  />
                </Field>
              </div>
            </>
          )}

          {/* 4 — Assets */}
          {step === 3 && (
            <>
              <h2 className="font-display text-2xl text-coffee">Ajoutez vos assets.</h2>
              <p className="mt-2 text-sm text-warm-gray">
                Tous les fichiers restent privés. Utilisez des comptes de
                démonstration : Studio One vous aidera à flouter toute donnée
                sensible avant l&apos;export.
              </p>
              <div className="mt-6 space-y-6">
                <UploadDropzone
                  label="Logo"
                  hint="PNG ou SVG, fond transparent de préférence."
                  accept="image/png,image/svg+xml"
                  multiple={false}
                />
                <Field
                  label="Couleurs de marque"
                  htmlFor="brandColors"
                  hint="Codes hex séparés par des virgules."
                >
                  <TextInput
                    id="brandColors"
                    value={state.brandColors}
                    onChange={(e) => update("brandColors", e.target.value)}
                    placeholder="#9A6A3A, #18110C, #FFFDF8"
                  />
                </Field>
                <UploadDropzone
                  label="Captures d'écran"
                  hint="PNG ou JPG — elles seront animées (zoom, panoramique) dans la vidéo."
                  accept="image/*"
                  onImagesChange={(urls) => update("screenshots", urls)}
                />
                <UploadDropzone
                  label="Vidéos courtes (optionnel)"
                  hint="Enregistrements d'écran MP4 ou MOV, 60 secondes maximum par clip."
                  accept="video/*"
                />
                <UploadDropzone
                  label="Documents produit et script existant (optionnel)"
                  hint="PDF, notes, pitch deck : tout ce qui aide à écrire un script juste."
                  accept=".pdf,.doc,.docx,.txt,.md"
                />
              </div>
            </>
          )}

          {/* 5 — Storyboard */}
          {step === 4 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl text-coffee">Votre storyboard.</h2>
                  <p className="mt-2 text-sm text-warm-gray">
                    Huit scènes chronométrées sur {state.duration ?? 90} secondes.
                    Chaque scène reste modifiable après génération.
                  </p>
                </div>
                {!state.storyboardGenerated && (
                  <Button onClick={generateStoryboard} disabled={generating}>
                    {generating ? "Génération…" : "Générer le storyboard"}
                  </Button>
                )}
              </div>

              {generating && (
                <div className="mt-6 space-y-3" aria-live="polite">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="skeleton h-16 w-full" />
                  ))}
                </div>
              )}

              {state.storyboardGenerated && !generating && (
                <>
                  <div className="mt-6 space-y-3">
                    {scenes.map((scene) => (
                      <div
                        key={scene.role}
                        className="flex items-center gap-4 rounded-xl border border-hairline bg-ivory p-4 transition-colors hover:border-bronze/30"
                      >
                        <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-hairline bg-cream">
                          <span className="font-display text-sm text-bronze-deep">{scene.order}</span>
                          <span className="text-[9px] text-warm-gray">{scene.seconds} s</span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-coffee">{scene.role}</p>
                          <div className="mt-1.5 h-1 rounded-full bg-cream" aria-hidden>
                            <div
                              className="h-full rounded-full bg-bronze/60"
                              style={{ width: `${scene.share * 100 * 4}%`, maxWidth: "100%" }}
                            />
                          </div>
                        </div>
                        <button className="shrink-0 text-xs font-medium text-bronze-deep underline-offset-4 hover:underline">
                          Modifier
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={generateStoryboard}
                    className="mt-4 text-xs font-medium text-warm-gray underline-offset-4 hover:text-bronze-deep hover:underline"
                  >
                    Régénérer une autre structure
                  </button>
                </>
              )}
            </>
          )}

          {/* 6 — Script */}
          {step === 5 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl text-coffee">Le script voix off.</h2>
                  <p className="mt-2 text-sm text-warm-gray">
                    Généré à partir de votre brief. Relisez, modifiez chaque
                    phrase, ou régénérez avec un autre style.
                  </p>
                </div>
                <Button
                  onClick={generateScript}
                  disabled={generating}
                  variant={state.scriptText ? "secondary" : "primary"}
                >
                  {generating
                    ? "Génération…"
                    : state.scriptText
                      ? "Régénérer"
                      : "Générer le script"}
                </Button>
              </div>

              <div className="mt-5 flex flex-wrap gap-4">
                <Field label="Style de narration" htmlFor="narrationStyle" className="min-w-44 flex-1">
                  <Select
                    id="narrationStyle"
                    value={state.narrationStyle}
                    onChange={(e) => update("narrationStyle", e.target.value as WizardState["narrationStyle"])}
                  >
                    <option value="voix-off">Voix off classique</option>
                    <option value="demonstration">Démonstration guidée</option>
                    <option value="temoignage">Ton témoignage</option>
                  </Select>
                </Field>
                <Field label="Longueur" htmlFor="scriptLength" className="min-w-44 flex-1">
                  <Select
                    id="scriptLength"
                    value={state.scriptLength}
                    onChange={(e) => update("scriptLength", e.target.value as WizardState["scriptLength"])}
                  >
                    <option value="concis">Concis</option>
                    <option value="standard">Standard</option>
                    <option value="detaille">Détaillé</option>
                  </Select>
                </Field>
                <Field label="Ton" htmlFor="scriptTone" className="min-w-44 flex-1">
                  <Select
                    id="scriptTone"
                    value={state.tone}
                    onChange={(e) => update("tone", e.target.value as VideoTone)}
                  >
                    {tones.map((t) => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </Select>
                </Field>
              </div>

              {generating ? (
                <div className="mt-5 space-y-3" aria-live="polite">
                  <div className="skeleton h-4 w-full" />
                  <div className="skeleton h-4 w-11/12" />
                  <div className="skeleton h-4 w-4/5" />
                </div>
              ) : (
                <TextArea
                  aria-label="Script voix off"
                  value={state.scriptText}
                  onChange={(e) => update("scriptText", e.target.value)}
                  rows={10}
                  className="mt-5"
                  placeholder="Cliquez sur « Générer le script » ou écrivez le vôtre ici."
                />
              )}

              {state.scriptText && !generating && (
                <p className="mt-3 text-xs text-warm-gray">
                  {state.scriptText.trim().split(/\s+/).length} mots · ≈{" "}
                  {Math.round(state.scriptText.trim().split(/\s+/).length / 2.4)} s
                  de narration pour {state.duration ?? 90} s de vidéo.
                </p>
              )}
            </>
          )}

          {/* 7 — Prévisualisation */}
          {step === 6 && (
            <>
              <h2 className="font-display text-2xl text-coffee">Prévisualisation.</h2>
              <p className="mt-2 text-sm text-warm-gray">
                Vérifiez la timeline : scènes, durées, voix off et transitions.
                Le rendu final respectera exactement cette structure.
              </p>

              <div className="mt-6 overflow-hidden rounded-xl border border-hairline">
                <div className="relative aspect-video bg-gradient-to-br from-cream via-ivory to-[#F0E4D3]">
                  <span className="absolute left-4 top-4 flex gap-2">
                    <Badge tone="bronze">4K</Badge>
                    <Badge tone="neutral">{state.duration ?? 90} s</Badge>
                    {state.subtitles && <Badge tone="neutral">Sous-titres</Badge>}
                  </span>
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-hairline-strong bg-ivory/85 shadow-soft">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                        <path d="M6 4v10l8-5-8-5z" fill="#9A6A3A" />
                      </svg>
                    </span>
                  </span>
                </div>
                <div className="border-t border-hairline bg-ivory p-4">
                  <div className="film-rule mb-3" aria-hidden />
                  <div className="flex gap-1">
                    {scenes.map((scene) => (
                      <div
                        key={scene.role}
                        style={{ width: `${scene.share * 100}%` }}
                        className="group/clip relative flex h-9 items-center justify-center overflow-hidden rounded-md border border-hairline bg-cream transition-colors hover:border-bronze/50 hover:bg-[#F3E9DC]"
                        title={`${scene.role} — ${scene.seconds} s`}
                      >
                        <span className="truncate px-1 text-[9px] font-medium text-bronze-deep">
                          {scene.role}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-warm-gray">
                    <span>00:00</span>
                    <span>
                      0{Math.floor((state.duration ?? 90) / 60)}:
                      {String((state.duration ?? 90) % 60).padStart(2, "0")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-hairline bg-cream/40 px-5 py-4">
                  <span>
                    <span className="block text-sm font-medium text-coffee">Sous-titres incrustés</span>
                    <span className="text-xs text-warm-gray">Un fichier SRT est fourni dans tous les cas.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={state.subtitles}
                    onChange={(e) => update("subtitles", e.target.checked)}
                    className="h-4 w-4 accent-[#9A6A3A]"
                  />
                </label>
                <div className="rounded-xl border border-hairline bg-cream/40 px-5 py-4">
                  <span className="block text-sm font-medium text-coffee">Transitions</span>
                  <span className="text-xs text-warm-gray">
                    Fondus doux entre scènes — cohérents avec le ton{" "}
                    {tones.find((t) => t.key === state.tone)?.label.toLowerCase()}.
                  </span>
                </div>
              </div>
            </>
          )}

          {/* 8 — Export / Paiement */}
          {step === 7 && (
            <>
              <h2 className="font-display text-2xl text-coffee">
                Checklist finale, puis export.
              </h2>
              <p className="mt-2 text-sm text-warm-gray">
                Lancez le rendu 4K directement : vous recevrez la vidéo, les
                sous-titres SRT, le script et le storyboard PDF.
              </p>

              <ul className="mt-6 space-y-2.5" aria-label="Checklist avant export">
                {checklist.map((item) => (
                  <li
                    key={item.label}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-5 py-3.5 text-sm",
                      item.done
                        ? "border-hairline bg-ivory text-coffee"
                        : "border-amber-300/60 bg-amber-50 text-amber-900"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                        item.done ? "bg-bronze text-ivory" : "border border-amber-400 text-amber-600"
                      )}
                      aria-hidden
                    >
                      {item.done ? (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6.5l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        "!"
                      )}
                    </span>
                    {item.label}
                  </li>
                ))}
              </ul>

              <div className="mt-8 rounded-2xl border border-bronze/30 bg-[#F3E9DC]/50 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="eyebrow">Mode test</p>
                    <p className="mt-1 font-display text-xl text-coffee">
                      Rendu 4K sans paiement
                    </p>
                    <p className="mt-1 text-xs text-warm-gray">
                      Le paiement est désactivé pendant la phase de test — le
                      rendu se lance immédiatement.
                    </p>
                  </div>
                  <Badge tone="bronze">{state.duration ?? 90} s · 4K</Badge>
                </div>
                <Button
                  onClick={launchRender}
                  disabled={!checklistComplete || launching}
                  size="lg"
                  className="mt-5 w-full"
                >
                  {launching ? "Lancement du rendu…" : "Lancer le rendu 4K"}
                </Button>
                {!checklistComplete && (
                  <p className="mt-3 text-center text-xs text-amber-800">
                    Complétez la checklist ci-dessus pour lancer le rendu.
                  </p>
                )}
                {launchNotice && (
                  <p role="status" className="mt-3 rounded-lg bg-ivory px-4 py-2.5 text-xs leading-relaxed text-bronze-deep">
                    {launchNotice}
                  </p>
                )}
                <p className="mt-3 text-center text-[11px] text-warm-gray">
                  Export 4K · Script voix off · Sous-titres · Storyboard PDF
                </p>
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            ← Étape précédente
          </Button>
          {step < steps.length - 1 && (
            <Button
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              disabled={!canContinue}
            >
              Continuer →
            </Button>
          )}
        </div>
      </div>

      {/* ── Preview latérale ── */}
      <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start" aria-label="Résumé du projet">
        <div className="card-surface p-6">
          <p className="eyebrow">Votre projet</p>
          <h3 className="mt-2 truncate font-display text-xl text-coffee">
            {state.productName || "Nouvelle vidéo"}
          </h3>

          <dl className="mt-5 space-y-3 text-sm">
            {[
              {
                label: "Objectif",
                value: suggested?.label ?? "À définir",
                set: !!state.objective,
              },
              {
                label: "Durée",
                value: state.duration ? `${state.duration} secondes` : "À définir",
                set: !!state.duration,
              },
              {
                label: "Ton",
                value: tones.find((t) => t.key === state.tone)?.label ?? "Premium",
                set: true,
              },
              { label: "Langue", value: state.language, set: true },
              {
                label: "Storyboard",
                value: state.storyboardGenerated ? "8 scènes générées" : "En attente",
                set: state.storyboardGenerated,
              },
              {
                label: "Script",
                value: state.scriptText ? "Rédigé" : "En attente",
                set: !!state.scriptText,
              },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-3 border-b border-hairline pb-3 last:border-0 last:pb-0">
                <dt className="text-warm-gray">{row.label}</dt>
                <dd className={cn("truncate text-right font-medium", row.set ? "text-coffee" : "text-warm-gray/60")}>
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          {state.duration && (
            <div className="mt-5">
              <p className="text-xs text-warm-gray">Timeline prévisionnelle</p>
              <div className="mt-2 flex gap-0.5" aria-hidden>
                {scenes.map((scene) => (
                  <div
                    key={scene.role}
                    style={{ width: `${scene.share * 100}%` }}
                    className="h-2 rounded-sm bg-bronze/50 first:rounded-l-full last:rounded-r-full"
                    title={scene.role}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card-surface mt-4 p-5">
          <p className="text-xs font-medium text-bronze-deep">Recommandation Studio One</p>
          <p className="mt-1.5 text-xs leading-relaxed text-warm-gray">
            {step <= 1 &&
              "Une démo commerciale performe mieux en 90 secondes : assez pour prouver, assez court pour être regardée en entier."}
            {step === 2 &&
              "Formulez la promesse comme un résultat, pas comme une fonctionnalité : « des relances qui partent toutes seules » plutôt que « module de relances »."}
            {step === 3 &&
              "Des captures en pleine résolution donnent un rendu 4K net. Masquez les noms et emails réels — l'outil peut les flouter."}
            {step === 4 &&
              "La scène « Problème » est celle qui accroche : décrivez la douleur exacte de votre audience, sans jargon."}
            {step === 5 &&
              "Lisez le script à voix haute. Si une phrase vous essouffle, elle essoufflera la voix off — coupez-la en deux."}
            {step === 6 &&
              "80 % des vues LinkedIn se font sans le son : gardez les sous-titres incrustés pour ce canal."}
            {step === 7 &&
              "Le rendu simulé prend environ 90 secondes. Vous pourrez suivre la progression en temps réel depuis la page projet."}
          </p>
        </div>
      </aside>
    </div>
  );
}
