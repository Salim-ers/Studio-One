import Image from "next/image";
import { Badge } from "@/components/ui/Badge";

const clips = [
  { label: "Intro", width: "9%" },
  { label: "Problème", width: "14%" },
  { label: "Solution", width: "17%" },
  { label: "Fonctionnalités", width: "22%" },
  { label: "Bénéfices", width: "13%" },
  { label: "Preuve", width: "11%" },
  { label: "CTA", width: "10%" },
];

/**
 * Mockup d'éditeur vidéo Studio One : preview 4K, timeline de montage,
 * badges de format. Les data-attributes sont animés par HeroReveal.
 */
export function EditorMockup() {
  return (
    <div className="relative">
      {/* Halo bronze très discret derrière la scène */}
      <div
        aria-hidden
        className="bronze-halo absolute -inset-16 -z-10 rounded-full"
      />

      <div
        data-hero="scene"
        className="card-surface overflow-hidden shadow-lifted"
      >
        {/* Barre de fenêtre */}
        <div className="flex items-center justify-between border-b border-hairline bg-cream/70 px-5 py-3">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/logo-bronze.png"
              alt=""
              width={22}
              height={22}
              className="rounded-full"
            />
            <span className="text-xs font-medium text-coffee">
              Nova CRM — Démo commerciale
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="bronze">4K · 16:9</Badge>
            <Badge tone="neutral">90 s</Badge>
          </div>
        </div>

        {/* Zone de preview */}
        <div className="relative aspect-[16/9] bg-gradient-to-br from-cream via-ivory to-[#F3E9DC]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-hairline-strong bg-ivory/80 shadow-soft backdrop-blur">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M6 4.5v11l9-5.5-9-5.5z" fill="#9A6A3A" />
              </svg>
            </div>
          </div>
          <div className="absolute left-5 top-5">
            <Badge tone="bronze">Scène 3 · Solution</Badge>
          </div>
          <div className="absolute bottom-5 right-5 rounded-lg border border-hairline bg-ivory/85 px-3 py-1.5 text-[11px] font-medium text-bronze-deep backdrop-blur">
            00:24 / 01:30
          </div>
        </div>

        {/* Timeline de montage */}
        <div className="border-t border-hairline bg-ivory px-5 py-4">
          <div className="film-rule mb-3" aria-hidden />
          <div className="relative flex gap-1.5">
            {clips.map((clip) => (
              <div
                key={clip.label}
                data-hero="clip"
                style={{ width: clip.width }}
                className="flex h-9 items-center overflow-hidden rounded-md border border-hairline bg-cream px-2"
                title={clip.label}
              >
                <span className="truncate text-[10px] font-medium text-bronze-deep">
                  {clip.label}
                </span>
              </div>
            ))}
            <span
              data-hero="playhead"
              aria-hidden
              className="absolute -top-4 bottom-0 w-px bg-bronze"
              style={{ left: "28%" }}
            >
              <span className="absolute -left-[3px] -top-1 h-2 w-[7px] rounded-sm bg-bronze" />
            </span>
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-warm-gray">
            <span>00:00</span>
            <span>00:30</span>
            <span>01:00</span>
            <span>01:30</span>
          </div>
        </div>
      </div>

      {/* Cartes flottantes */}
      <div
        data-hero="chip"
        data-float
        className="card-surface absolute -left-4 top-16 hidden items-center gap-2.5 px-4 py-3 lg:flex"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cream text-bronze" aria-hidden>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="2.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M4 14h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </span>
        <span className="text-xs">
          <span className="block font-semibold text-coffee">Storyboard généré</span>
          <span className="text-warm-gray">8 scènes structurées</span>
        </span>
      </div>

      <div
        data-hero="chip"
        data-float className="card-surface absolute -right-4 bottom-24 hidden items-center gap-2.5 px-4 py-3 lg:flex"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cream text-bronze" aria-hidden>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v8m0 0l3-3m-3 3L5 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 12.5h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </span>
        <span className="text-xs">
          <span className="block font-semibold text-coffee">Script voix off prêt</span>
          <span className="text-warm-gray">Clarté : 92 / 100</span>
        </span>
      </div>
    </div>
  );
}
