"use client";

import { useRef, useState } from "react";
import {
  buildScriptText,
  buildSrt,
  buildStoryboardText,
  downloadBlob,
  downloadText,
  projectSlug,
} from "@/lib/exports";
import { generateVideo } from "@/lib/video-encoder";
import type { ExportFormat, VideoProject } from "@/types/video";

interface VideoJob {
  status: "idle" | "working" | "done" | "error";
  progress: number;
  error?: string;
}

const VIDEO_DETAILS: Record<ExportFormat, string> = {
  "16:9": "1920 × 1080 · MP4/WebM · sous-titres incrustés",
  "9:16": "1080 × 1920 · MP4/WebM · sous-titres incrustés",
  "1:1": "1080 × 1080 · MP4/WebM · sous-titres incrustés",
};

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M6 1.5V8m0 0L3.5 5.5M6 8l2.5-2.5M2 10.5h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Exports réellement téléchargeables, générés dans le navigateur à partir
 * des données du projet : vidéos encodées image par image (WebCodecs),
 * sous-titres SRT et fichiers texte.
 */
export function ExportsPanel({ project }: { project: VideoProject }) {
  const [jobs, setJobs] = useState<Record<string, VideoJob>>({});
  const cacheRef = useRef<Record<string, { blob: Blob; filename: string }>>({});
  const slug = projectSlug(project);

  function updateJob(key: string, job: VideoJob) {
    setJobs((prev) => ({ ...prev, [key]: job }));
  }

  async function handleVideo(format: ExportFormat) {
    const cached = cacheRef.current[format];
    if (cached) {
      downloadBlob(cached.filename, cached.blob);
      return;
    }
    if (jobs[format]?.status === "working") return;

    updateJob(format, { status: "working", progress: 0 });
    try {
      const result = await generateVideo(project, format, (progress) =>
        updateJob(format, { status: "working", progress })
      );
      const filename = `${slug}-${format.replace(":", "x")}.${result.extension}`;
      cacheRef.current[format] = { blob: result.blob, filename };
      updateJob(format, { status: "done", progress: 100 });
      downloadBlob(filename, result.blob);
    } catch (e) {
      updateJob(format, {
        status: "error",
        progress: 0,
        error:
          e instanceof Error
            ? e.message
            : "La génération a échoué. Réessayez.",
      });
    }
  }

  const textItems = [
    {
      key: "srt",
      label: "Sous-titres",
      detail: "Fichier SRT — calé sur les durées de scènes",
      action: () => downloadText(`${slug}.srt`, buildSrt(project)),
    },
    {
      key: "script",
      label: "Script voix off",
      detail: "Fichier texte — scène par scène",
      action: () => downloadText(`${slug}-script.txt`, buildScriptText(project)),
    },
    {
      key: "storyboard",
      label: "Storyboard",
      detail: "Fichier texte — plan de montage détaillé",
      action: () =>
        downloadText(`${slug}-storyboard.txt`, buildStoryboardText(project)),
    },
  ];

  return (
    <>
      <ul className="card-surface divide-y divide-[rgba(154,106,58,0.18)]">
        {project.formats.map((format) => {
          const job = jobs[format] ?? { status: "idle" as const, progress: 0 };
          const working = job.status === "working";
          return (
            <li key={format} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-coffee">
                    Vidéo · {format}
                  </p>
                  <p className="text-xs text-warm-gray">{VIDEO_DETAILS[format]}</p>
                </div>
                <button
                  onClick={() => handleVideo(format)}
                  disabled={working}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-hairline-strong px-3.5 py-1.5 text-xs font-medium text-coffee transition-all hover:border-bronze hover:text-bronze-deep disabled:pointer-events-none disabled:opacity-60"
                >
                  <DownloadIcon />
                  {working
                    ? `Génération… ${job.progress} %`
                    : job.status === "error"
                      ? "Réessayer"
                      : "Télécharger"}
                </button>
              </div>
              {working && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cream" aria-hidden>
                  <div
                    className="h-full rounded-full bg-bronze transition-all duration-500"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              )}
              {job.status === "error" && job.error && (
                <p role="alert" className="mt-2 text-xs leading-relaxed text-red-700">
                  {job.error}
                </p>
              )}
            </li>
          );
        })}

        {textItems.map((item) => (
          <li
            key={item.key}
            className="flex items-center justify-between gap-3 p-4"
          >
            <div>
              <p className="text-sm font-medium text-coffee">{item.label}</p>
              <p className="text-xs text-warm-gray">{item.detail}</p>
            </div>
            <button
              onClick={item.action}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-hairline-strong px-3.5 py-1.5 text-xs font-medium text-coffee transition-all hover:border-bronze hover:text-bronze-deep"
            >
              <DownloadIcon />
              Télécharger
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-warm-gray">
        Vidéos générées localement dans votre navigateur, sous-titres
        incrustés, sans piste audio — la voix off arrivera avec le vrai moteur
        de rendu. La première génération d&apos;un format prend quelques
        dizaines de secondes.
      </p>
    </>
  );
}
