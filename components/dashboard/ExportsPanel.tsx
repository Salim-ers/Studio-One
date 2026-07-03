"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildScriptText,
  buildSrt,
  buildStoryboardText,
  downloadBlob,
  downloadText,
  projectSlug,
} from "@/lib/exports";
import { generateVideo } from "@/lib/video-encoder";
import { generateVideoWithAudio } from "@/lib/video-recorder";
import {
  isAudioConfigured,
  musicPromptFor,
  voiceoverTextFor,
} from "@/lib/audio";
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
 * des données du projet : vidéos (WebCodecs muet, ou MediaRecorder avec voix
 * off + musique ElevenLabs), sous-titres SRT et fichiers texte.
 */
export function ExportsPanel({ project }: { project: VideoProject }) {
  const [jobs, setJobs] = useState<Record<string, VideoJob>>({});
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [withAudio, setWithAudio] = useState(false);
  // Le cache dépend de l'option audio (fichiers différents).
  const cacheRef = useRef<Record<string, { blob: Blob; filename: string }>>({});
  const slug = projectSlug(project);

  useEffect(() => {
    let alive = true;
    isAudioConfigured().then((ok) => {
      if (!alive) return;
      setAudioAvailable(ok);
      setWithAudio(ok);
    });
    return () => {
      alive = false;
    };
  }, []);

  function updateJob(key: string, job: VideoJob) {
    setJobs((prev) => ({ ...prev, [key]: job }));
  }

  async function handleVideo(format: ExportFormat) {
    const audio = audioAvailable && withAudio;
    const cacheKey = `${format}${audio ? "-audio" : ""}`;
    const cached = cacheRef.current[cacheKey];
    if (cached) {
      downloadBlob(cached.filename, cached.blob);
      return;
    }
    if (jobs[format]?.status === "working") return;

    updateJob(format, { status: "working", progress: 0 });
    try {
      const onProgress = (progress: number) =>
        updateJob(format, { status: "working", progress });

      let blob: Blob;
      let extension: string;
      if (audio) {
        const result = await generateVideoWithAudio(
          project,
          format,
          onProgress,
          project.images ?? [],
          {
            voiceoverText: voiceoverTextFor(project) || undefined,
            musicPrompt: musicPromptFor(project),
          }
        );
        blob = result.blob;
        extension = result.extension;
      } else {
        const result = await generateVideo(
          project,
          format,
          onProgress,
          project.images ?? []
        );
        blob = result.blob;
        extension = result.extension;
      }

      const filename = `${slug}-${format.replace(":", "x")}${audio ? "-audio" : ""}.${extension}`;
      cacheRef.current[cacheKey] = { blob, filename };
      updateJob(format, { status: "done", progress: 100 });
      downloadBlob(filename, blob);
    } catch (e) {
      updateJob(format, {
        status: "error",
        progress: 0,
        error:
          e instanceof Error ? e.message : "La génération a échoué. Réessayez.",
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

  const anyWorking = Object.values(jobs).some((j) => j.status === "working");

  return (
    <>
      {audioAvailable && (
        <label className="mb-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-bronze/30 bg-[#F3E9DC]/50 px-5 py-3.5">
          <span>
            <span className="block text-sm font-medium text-coffee">
              Voix off + musique (IA)
            </span>
            <span className="text-xs text-warm-gray">
              Narration ElevenLabs et musique de fond. Rendu en temps réel
              (durée de la vidéo), export WebM.
            </span>
          </span>
          <input
            type="checkbox"
            checked={withAudio}
            disabled={anyWorking}
            onChange={(e) => setWithAudio(e.target.checked)}
            className="h-4 w-4 shrink-0 accent-[#9A6A3A]"
          />
        </label>
      )}

      <ul className="card-surface divide-y divide-[rgba(154,106,58,0.18)]">
        {project.formats.map((format) => {
          const job = jobs[format] ?? { status: "idle" as const, progress: 0 };
          const working = job.status === "working";
          const audio = audioAvailable && withAudio;
          return (
            <li key={format} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-coffee">
                    Vidéo · {format}
                  </p>
                  <p className="text-xs text-warm-gray">
                    {audio
                      ? `${format === "16:9" ? "1280 × 720" : format === "9:16" ? "720 × 1280" : "900 × 900"} · WebM · voix off + musique`
                      : VIDEO_DETAILS[format]}
                  </p>
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
        {audioAvailable && withAudio
          ? "Vidéo générée en temps réel avec voix off et musique — comptez la durée de la vidéo. Sous-titres incrustés, export WebM."
          : "Vidéos générées localement dans votre navigateur, sous-titres incrustés. La première génération d'un format prend quelques dizaines de secondes."}
      </p>
    </>
  );
}
