"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RENDER_DURATION_MS } from "@/lib/render";

/**
 * Suit la progression du rendu simulé en interrogeant l'API, puis
 * rafraîchit la page serveur quand l'export est prêt.
 */
export function RenderProgress({
  projectId,
  initialProgress,
}: {
  projectId: string;
  initialProgress: number;
}) {
  const router = useRouter();
  const [progress, setProgress] = useState(initialProgress);

  useEffect(() => {
    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          project: { status: string; renderProgress: number };
        };
        setProgress(data.project.renderProgress);
        if (data.project.status !== "rendering") {
          clearInterval(timer);
          router.refresh();
        }
      } catch {
        // Erreur réseau transitoire : on retentera au prochain tick.
      }
    }, 1500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [projectId, router]);

  const remainingSeconds = Math.max(
    1,
    Math.ceil(((100 - progress) / 100) * (RENDER_DURATION_MS / 1000))
  );

  return (
    <div className="mt-5">
      <div className="flex justify-between text-xs text-warm-gray">
        <span>Progression</span>
        <span className="font-medium text-bronze-deep">{progress} %</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream" aria-hidden>
        <div
          className="h-full rounded-full bg-bronze transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-warm-gray" role="status">
        Rendu 4K en cours — temps restant estimé : {remainingSeconds} s. Vous
        pouvez quitter cette page, le rendu continue.
      </p>
    </div>
  );
}
