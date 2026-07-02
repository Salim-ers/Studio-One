"use client";

import { useMemo, useState } from "react";
import type { StoryboardScene, VideoTone } from "@/types/video";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const tones: { key: VideoTone; label: string }[] = [
  { key: "premium", label: "Premium" },
  { key: "pedagogique", label: "Pédagogique" },
  { key: "dynamique", label: "Dynamique" },
  { key: "corporate", label: "Corporate" },
  { key: "chaleureux", label: "Chaleureux" },
  { key: "direct", label: "Direct" },
];

interface ScriptEditorProps {
  scenes: StoryboardScene[];
  initialTone: VideoTone;
  initialVersion: number;
  clarityScore: number;
}

export function ScriptEditor({
  scenes,
  initialTone,
  initialVersion,
  clarityScore,
}: ScriptEditorProps) {
  const initialText = useMemo(
    () => scenes.map((s) => s.voiceOver).filter(Boolean).join("\n\n"),
    [scenes]
  );
  const [text, setText] = useState(initialText);
  const [tone, setTone] = useState<VideoTone>(initialTone);
  const [version, setVersion] = useState(initialVersion);
  const [regenerating, setRegenerating] = useState(false);
  const [saved, setSaved] = useState(true);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.round(wordCount / 2.4); // ~145 mots / min

  function regenerate() {
    setRegenerating(true);
    // Point d'ancrage pour la vraie génération : appel API à brancher ici.
    setTimeout(() => {
      setVersion((v) => v + 1);
      setRegenerating(false);
      setSaved(true);
    }, 900);
  }

  return (
    <div className="card-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-lg text-coffee">Script voix off</h3>
          <Badge tone="neutral">Version {version}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs",
              saved ? "text-warm-gray" : "text-bronze-deep"
            )}
            role="status"
          >
            {saved ? "Enregistré" : "Modifications non enregistrées"}
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-cream px-3 py-1 text-xs font-medium text-bronze-deep"
            title="Score de clarté : lisibilité et simplicité du script pour un prospect qui découvre le produit."
          >
            Clarté {clarityScore} / 100
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Ton de la narration">
        {tones.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTone(t.key);
              setSaved(false);
            }}
            aria-pressed={tone === t.key}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
              tone === t.key
                ? "border-bronze bg-[#F3E9DC] text-bronze-deep"
                : "border-hairline text-warm-gray hover:border-bronze/40 hover:text-coffee"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {regenerating ? (
        <div className="mt-4 space-y-3" aria-live="polite" aria-label="Régénération du script">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-11/12" />
          <div className="skeleton h-4 w-4/5" />
          <div className="skeleton h-4 w-10/12" />
        </div>
      ) : (
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setSaved(false);
          }}
          rows={10}
          aria-label="Texte du script voix off"
          className="mt-4 w-full rounded-xl border border-hairline-strong bg-cream/40 p-4 text-sm leading-relaxed text-coffee transition-colors focus:border-bronze focus:outline-none focus:ring-2 focus:ring-bronze/15"
        />
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-warm-gray">
          {wordCount} mots · ≈ {estimatedSeconds} s de narration
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={regenerate} disabled={regenerating}>
            {regenerating ? "Régénération…" : "Régénérer avec ce ton"}
          </Button>
          <Button
            size="sm"
            onClick={() => setSaved(true)}
            disabled={saved || regenerating}
          >
            Enregistrer le script
          </Button>
        </div>
      </div>
    </div>
  );
}
