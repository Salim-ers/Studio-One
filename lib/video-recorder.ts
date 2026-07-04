import type { ExportFormat, StoryboardScene, VideoProject } from "@/types/video";
import {
  drawSceneFrame,
  loadImageSources,
  precomputeTimeline,
} from "./video-scenes";
import { loadClipFrames } from "./clip-frames";
import { fetchMusic, fetchVoiceover } from "./audio";

/**
 * Export vidéo AVEC audio (voix off + musique). Contrairement à l'encodeur
 * WebCodecs muet, ce chemin utilise MediaRecorder + canvas.captureStream +
 * WebAudio : le muxage audio/vidéo est natif et fiable sur Chrome comme
 * Firefox. Contrepartie : l'enregistrement se fait en temps réel (la durée
 * de la vidéo), et la sortie est un WebM (VP8/Opus).
 */

const FPS = 30;

export interface AudioResult {
  blob: Blob;
  extension: "webm";
}

export interface AudioOptions {
  voiceoverText?: string;
  musicPrompt?: string;
  clipUrl?: string;
}

// Résolution réduite pour rester fluide en temps réel.
const DIMENSIONS: Record<ExportFormat, { width: number; height: number }> = {
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 },
  "1:1": { width: 900, height: 900 },
};

const MIME_CANDIDATES = [
  "video/webm;codecs=vp8,opus",
  "video/webm;codecs=vp9,opus",
  "video/webm",
];

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") {
    throw new Error(
      "Votre navigateur ne supporte pas l'enregistrement vidéo (MediaRecorder)."
    );
  }
  for (const m of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return "video/webm";
}

function fallbackScene(project: VideoProject): StoryboardScene {
  return {
    id: "sc-brand",
    order: 1,
    role: "intro",
    title: project.name,
    description: `Vidéo de démonstration ${project.duration} secondes.`,
    durationSeconds: 8,
    voiceOver: "",
  };
}

async function decodeSafe(
  ctx: AudioContext,
  buffer: ArrayBuffer
): Promise<AudioBuffer | null> {
  try {
    return await ctx.decodeAudioData(buffer);
  } catch {
    return null;
  }
}

export async function generateVideoWithAudio(
  project: VideoProject,
  format: ExportFormat,
  onProgress: (percent: number) => void,
  imageUrls: string[],
  options: AudioOptions
): Promise<AudioResult> {
  const { width, height } = DIMENSIONS[format];
  const scenes =
    project.scenes.length > 0 ? project.scenes : [fallbackScene(project)];
  const totalSeconds = scenes.reduce((acc, s) => acc + s.durationSeconds, 0);

  onProgress(2);

  // ── Récupération audio (voix off + musique) en parallèle ─────────
  const durationMs = Math.round(totalSeconds * 1000);
  const [voiceBuf, musicBuf] = await Promise.all([
    options.voiceoverText
      ? fetchVoiceover(options.voiceoverText).catch(() => null)
      : Promise.resolve(null),
    options.musicPrompt
      ? fetchMusic(options.musicPrompt, durationMs).catch(() => null)
      : Promise.resolve(null),
  ]);

  if (options.voiceoverText && !voiceBuf && options.musicPrompt && !musicBuf) {
    throw new Error(
      "Génération audio impossible (voix off et musique). Vérifie ta clé ElevenLabs."
    );
  }
  onProgress(10);

  // ── Canvas + précalcul du storyboard ─────────────────────────────
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas 2D indisponible dans ce navigateur.");

  const images = imageUrls.length ? await loadImageSources(imageUrls) : [];
  const clipFrames = options.clipUrl
    ? await loadClipFrames(options.clipUrl).catch(() => null)
    : null;
  const pre = precomputeTimeline(
    ctx,
    project,
    scenes,
    width,
    height,
    images,
    clipFrames
  );

  // ── Graphe audio → piste de flux ─────────────────────────────────
  const audioCtx = new AudioContext();
  // Créé après des await (fetch) : peut démarrer suspendu → on le réveille,
  // sinon la piste audio capturée serait muette.
  await audioCtx.resume().catch(() => {});
  const voice = voiceBuf ? await decodeSafe(audioCtx, voiceBuf) : null;
  const music = musicBuf ? await decodeSafe(audioCtx, musicBuf) : null;
  onProgress(12);

  const dest = audioCtx.createMediaStreamDestination();
  const master = audioCtx.createGain();
  master.gain.value = 0;
  master.connect(dest);

  const sources: AudioBufferSourceNode[] = [];
  const startAt = audioCtx.currentTime + 0.12;

  if (music) {
    const src = audioCtx.createBufferSource();
    src.buffer = music;
    src.loop = true;
    const g = audioCtx.createGain();
    g.gain.value = 0.16; // musique en sourdine sous la voix
    src.connect(g).connect(master);
    src.start(startAt);
    sources.push(src);
  }
  if (voice) {
    const src = audioCtx.createBufferSource();
    src.buffer = voice;
    const g = audioCtx.createGain();
    g.gain.value = 1;
    src.connect(g).connect(master);
    src.start(startAt + 0.3); // légère respiration avant la voix
    sources.push(src);
  }

  // Fondu d'entrée et de sortie du master
  master.gain.setValueAtTime(0, startAt);
  master.gain.linearRampToValueAtTime(1, startAt + 0.4);
  master.gain.setValueAtTime(1, startAt + totalSeconds - 0.8);
  master.gain.linearRampToValueAtTime(0, startAt + totalSeconds);

  // ── Flux combiné vidéo + audio ───────────────────────────────────
  const videoStream = canvas.captureStream(FPS);
  const stream = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const mime = pickMime();
  const recorder = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: 6_000_000,
    audioBitsPerSecond: 160_000,
  });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const done = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
    recorder.onerror = () => reject(new Error("Enregistrement interrompu."));
  });

  // ── Boucle de rendu en temps réel ────────────────────────────────
  recorder.start();
  const t0 = performance.now();
  await new Promise<void>((resolve) => {
    const tick = () => {
      const elapsed = (performance.now() - t0) / 1000;
      const t = Math.min(elapsed, totalSeconds);
      drawSceneFrame(ctx, pre, t, width, height);
      onProgress(Math.min(99, 12 + Math.round((t / totalSeconds) * 87)));
      if (elapsed >= totalSeconds) {
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  for (const src of sources) {
    try {
      src.stop();
    } catch {
      /* déjà arrêtée */
    }
  }
  recorder.stop();
  videoStream.getTracks().forEach((tr) => tr.stop());

  const blob = await done;
  await audioCtx.close().catch(() => {});
  onProgress(100);

  return { blob, extension: "webm" };
}
