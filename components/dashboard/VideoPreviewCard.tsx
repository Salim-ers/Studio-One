import { Badge } from "@/components/ui/Badge";
import type { VideoProject } from "@/types/video";

/**
 * Aperçu vidéo placeholder : cadre 16:9 crème, bouton lecture,
 * durée et statut. Prêt à recevoir un vrai player.
 */
export function VideoPreviewCard({ project }: { project: VideoProject }) {
  const isReady = project.status === "export_ready";
  const isRendering = project.status === "rendering";

  return (
    <div className="card-surface overflow-hidden">
      <div className="relative aspect-video bg-gradient-to-br from-cream via-ivory to-[#F0E4D3]">
        <span className="absolute left-4 top-4 flex gap-2">
          <Badge tone="bronze">4K</Badge>
          <Badge tone="neutral">{project.duration} s</Badge>
        </span>

        <span className="absolute inset-0 flex items-center justify-center">
          {isRendering ? (
            <span className="flex flex-col items-center gap-3">
              <span className="h-10 w-10 animate-spin rounded-full border-2 border-hairline-strong border-t-bronze" aria-hidden />
              <span className="text-xs text-warm-gray">
                Rendu en cours — {project.renderProgress} %
              </span>
            </span>
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-hairline-strong bg-ivory/85 shadow-soft">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path d="M6 4v10l8-5-8-5z" fill="#9A6A3A" />
              </svg>
            </span>
          )}
        </span>

        {!isReady && !isRendering && (
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-hairline bg-ivory/90 px-3 py-1 text-[11px] text-warm-gray backdrop-blur">
            L&apos;aperçu final apparaîtra après le rendu
          </span>
        )}
      </div>
      <div className="film-rule" aria-hidden />
    </div>
  );
}
