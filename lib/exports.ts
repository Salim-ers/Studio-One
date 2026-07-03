import type { VideoProject } from "@/types/video";

/**
 * Génération des fichiers d'export (sous-titres SRT, script, storyboard)
 * à partir des données du projet, et déclenchement du téléchargement.
 * Tout se passe dans le navigateur — aucun serveur requis.
 */

export function projectSlug(project: VideoProject): string {
  return (
    project.productName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "studio-one"
  );
}

function srtTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const millis = Math.round((totalSeconds % 1) * 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(millis, 3)}`;
}

/** Sous-titres SRT : une entrée par scène ayant une voix off, calée sur les durées. */
export function buildSrt(project: VideoProject): string {
  const entries: string[] = [];
  let cursor = 0;
  let index = 1;

  for (const scene of project.scenes) {
    const start = cursor;
    const end = cursor + scene.durationSeconds;
    cursor = end;
    if (!scene.voiceOver.trim()) continue;

    entries.push(
      `${index}\n${srtTimestamp(start)} --> ${srtTimestamp(Math.max(start + 1, end - 0.2))}\n${scene.voiceOver.trim()}\n`
    );
    index += 1;
  }

  return entries.join("\n");
}

/** Script voix off complet, scène par scène. */
export function buildScriptText(project: VideoProject): string {
  // Même référence de durée que le SRT, le storyboard et la vidéo générée :
  // la somme des scènes (qui peut différer de project.duration sur les seeds).
  const totalSeconds = project.scenes.reduce((acc, s) => acc + s.durationSeconds, 0);
  const lines: string[] = [
    `${project.name}`,
    `Script voix off — ${totalSeconds} secondes · ${project.language} · ton ${project.tone}`,
    `Généré par Studio One`,
    "",
    "────────────────────────────────────────",
    "",
  ];

  for (const scene of project.scenes) {
    lines.push(`Scène ${scene.order} — ${scene.title} (${scene.durationSeconds} s)`);
    lines.push(scene.voiceOver.trim() || "(pas de voix off sur cette scène)");
    lines.push("");
  }

  return lines.join("\n");
}

/** Storyboard détaillé : rôle, durée, description et voix off de chaque scène. */
export function buildStoryboardText(project: VideoProject): string {
  const totalSeconds = project.scenes.reduce((acc, s) => acc + s.durationSeconds, 0);
  const lines: string[] = [
    `${project.name}`,
    `Storyboard — ${project.scenes.length} scènes · ${totalSeconds} secondes · formats ${project.formats.join(", ")}`,
    `Généré par Studio One`,
    "",
    "────────────────────────────────────────",
    "",
  ];

  let cursor = 0;
  for (const scene of project.scenes) {
    lines.push(
      `Scène ${scene.order} · ${scene.title} — ${scene.durationSeconds} s (de ${cursor} s à ${cursor + scene.durationSeconds} s)`
    );
    lines.push(`  Description : ${scene.description}`);
    if (scene.voiceOver.trim()) {
      lines.push(`  Voix off : ${scene.voiceOver.trim()}`);
    }
    lines.push("");
    cursor += scene.durationSeconds;
  }

  return lines.join("\n");
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Laisse le temps au navigateur d'initier le téléchargement avant révocation.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function downloadText(filename: string, content: string): void {
  downloadBlob(
    filename,
    new Blob(["﻿" + content], { type: "text/plain;charset=utf-8" })
  );
}
