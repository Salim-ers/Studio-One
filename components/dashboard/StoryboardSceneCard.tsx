import type { StoryboardScene } from "@/types/video";

const roleLabels: Record<StoryboardScene["role"], string> = {
  intro: "Intro",
  probleme: "Problème",
  solution: "Solution",
  fonctionnalites: "Fonctionnalités",
  benefices: "Bénéfices",
  preuve: "Preuve",
  conclusion: "Conclusion",
  cta: "CTA",
};

export function StoryboardSceneCard({ scene }: { scene: StoryboardScene }) {
  return (
    <article className="group flex gap-4 rounded-xl border border-hairline bg-ivory p-4 shadow-soft transition-all duration-200 hover:border-bronze/30">
      <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-hairline bg-cream">
        <span className="font-display text-lg text-bronze-deep">{scene.order}</span>
        <span className="text-[10px] text-warm-gray">{scene.durationSeconds} s</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-caps text-bronze">
          {roleLabels[scene.role]}
        </p>
        <h4 className="mt-0.5 text-sm font-medium text-coffee">{scene.title}</h4>
        <p className="mt-1 text-xs leading-relaxed text-warm-gray">{scene.description}</p>
        {scene.voiceOver && (
          <p className="mt-2 border-l-2 border-bronze/30 pl-3 text-xs italic leading-relaxed text-coffee/75">
            « {scene.voiceOver} »
          </p>
        )}
      </div>
      {scene.asset && (
        <span className="hidden shrink-0 self-start rounded-full border border-hairline bg-cream px-2.5 py-1 text-[10px] text-warm-gray sm:block">
          {scene.asset}
        </span>
      )}
    </article>
  );
}
