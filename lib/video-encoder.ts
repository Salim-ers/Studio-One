import {
  Muxer as Mp4Muxer,
  ArrayBufferTarget as Mp4Target,
} from "mp4-muxer";
import {
  Muxer as WebmMuxer,
  ArrayBufferTarget as WebmTarget,
} from "webm-muxer";
import type { ExportFormat, StoryboardScene, VideoProject } from "@/types/video";
import {
  drawSceneFrame,
  loadImageSources,
  precomputeTimeline,
  type Precomputed,
} from "./video-scenes";
import { loadClipFrames } from "./clip-frames";

/**
 * Génération de la vidéo de démonstration dans le navigateur : le rendu
 * cinématique (lib/video-scenes.ts) est dessiné image par image sur un
 * canvas, puis encodé via WebCodecs plus vite que le temps réel. Les codecs
 * sont essayés dans l'ordre (MP4 H.264, puis WebM VP8/VP9) : un échec de
 * muxage bascule automatiquement sur le suivant — Firefox produit par
 * exemple des B-frames H.264 réordonnées que les muxers refusent. Vidéo
 * muette : la voix off est incrustée en sous-titres (l'audio arrivera via
 * l'intégration ElevenLabs).
 */

const FPS = 30;

export interface VideoResult {
  blob: Blob;
  extension: "mp4" | "webm";
  width: number;
  height: number;
}

const FORMAT_DIMENSIONS: Record<ExportFormat, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
};

interface CodecCandidate {
  kind: "mp4" | "webm";
  codecString: string;
  webmCodec?: "V_VP8" | "V_VP9";
}

const CODEC_CANDIDATES: CodecCandidate[] = [
  { kind: "mp4", codecString: "avc1.640028" },
  { kind: "mp4", codecString: "avc1.420028" },
  { kind: "webm", codecString: "vp8", webmCodec: "V_VP8" },
  { kind: "webm", codecString: "vp09.00.40.08", webmCodec: "V_VP9" },
];

async function supportedCandidates(
  width: number,
  height: number,
  bitrate: number
): Promise<CodecCandidate[]> {
  const result: CodecCandidate[] = [];
  for (const candidate of CODEC_CANDIDATES) {
    try {
      const { supported } = await VideoEncoder.isConfigSupported({
        codec: candidate.codecString,
        width,
        height,
        bitrate,
        framerate: FPS,
        latencyMode: "realtime",
      });
      if (supported) result.push(candidate);
    } catch {
      // Codec inconnu de ce navigateur : on essaie le suivant.
    }
  }
  return result;
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

interface EncodeContext {
  pre: Precomputed;
  totalFrames: number;
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  bitrate: number;
  onProgress: (percent: number) => void;
}

async function encodeWithCandidate(
  candidate: CodecCandidate,
  ec: EncodeContext
): Promise<VideoResult> {
  const { pre, totalFrames, ctx, canvas, width, height, bitrate, onProgress } = ec;

  let addChunk: (
    chunk: EncodedVideoChunk,
    meta?: EncodedVideoChunkMetadata
  ) => void;
  let finalize: () => ArrayBuffer;

  if (candidate.kind === "mp4") {
    const target = new Mp4Target();
    const muxer = new Mp4Muxer({
      target,
      video: { codec: "avc", width, height },
      fastStart: "in-memory",
      firstTimestampBehavior: "offset",
    });
    addChunk = (chunk, meta) => muxer.addVideoChunk(chunk, meta);
    finalize = () => {
      muxer.finalize();
      return target.buffer;
    };
  } else {
    const target = new WebmTarget();
    const muxer = new WebmMuxer({
      target,
      video: {
        codec: candidate.webmCodec ?? "V_VP8",
        width,
        height,
        frameRate: FPS,
      },
      firstTimestampBehavior: "offset",
    });
    addChunk = (chunk, meta) => muxer.addVideoChunk(chunk, meta);
    finalize = () => {
      muxer.finalize();
      return target.buffer;
    };
  }

  const errorRef: { current: Error | null } = { current: null };
  const recordError = (e: unknown) => {
    if (!errorRef.current) {
      errorRef.current = e instanceof Error ? e : new Error(String(e));
    }
  };
  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      try {
        // Firefox : decoderConfig absent après le premier chunk, et
        // colorSpace aux membres nuls qui fait planter les muxers.
        const decoderConfig = meta && meta.decoderConfig;
        addChunk(
          chunk,
          decoderConfig
            ? { decoderConfig: { ...decoderConfig, colorSpace: undefined } }
            : undefined
        );
      } catch (e) {
        recordError(e);
      }
    },
    error: recordError,
  });

  encoder.configure({
    codec: candidate.codecString,
    width,
    height,
    bitrate,
    framerate: FPS,
    latencyMode: "realtime",
    ...(candidate.kind === "mp4" ? { avc: { format: "avc" as const } } : {}),
  });

  const frameDuration = Math.round(1_000_000 / FPS);

  for (let i = 0; i < totalFrames; i++) {
    if (errorRef.current) break;

    drawSceneFrame(ctx, pre, i / FPS, width, height);
    const frame = new VideoFrame(canvas, {
      timestamp: i * frameDuration,
      duration: frameDuration,
    });
    encoder.encode(frame, { keyFrame: i % (FPS * 2) === 0 });
    frame.close();

    if (encoder.encodeQueueSize > 8) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 500);
        encoder.addEventListener(
          "dequeue",
          () => {
            clearTimeout(timer);
            resolve();
          },
          { once: true }
        );
      });
    }
    if (i % FPS === 0) {
      onProgress(Math.min(99, Math.round((i / totalFrames) * 100)));
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  if (!errorRef.current) {
    try {
      await encoder.flush();
    } catch (e) {
      recordError(e);
    }
  }
  try {
    encoder.close();
  } catch {}

  if (errorRef.current) throw errorRef.current;

  const buffer = finalize();
  onProgress(100);

  return {
    blob: new Blob([buffer], {
      type: candidate.kind === "mp4" ? "video/mp4" : "video/webm",
    }),
    extension: candidate.kind,
    width,
    height,
  };
}

export async function generateVideo(
  project: VideoProject,
  format: ExportFormat,
  onProgress: (percent: number) => void,
  imageUrls: string[] = [],
  clipUrl?: string
): Promise<VideoResult> {
  if (typeof VideoEncoder === "undefined") {
    throw new Error(
      "Votre navigateur ne supporte pas l'encodage vidéo (WebCodecs). Utilisez Chrome, Edge ou un navigateur récent."
    );
  }

  const { width, height } = FORMAT_DIMENSIONS[format];
  const bitrate = format === "1:1" ? 7_000_000 : 9_000_000;
  const scenes =
    project.scenes.length > 0 ? project.scenes : [fallbackScene(project)];
  const totalSeconds = scenes.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalFrames = Math.max(FPS, Math.round(totalSeconds * FPS));

  const candidates = await supportedCandidates(width, height, bitrate);
  if (candidates.length === 0) {
    throw new Error(
      "Aucun codec vidéo compatible trouvé dans ce navigateur. Essayez Chrome ou Edge récent."
    );
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas 2D indisponible dans ce navigateur.");

  const images = imageUrls.length ? await loadImageSources(imageUrls) : [];
  const clipFrames = clipUrl ? await loadClipFrames(clipUrl).catch(() => null) : null;
  const pre = precomputeTimeline(
    ctx,
    project,
    scenes,
    width,
    height,
    images,
    clipFrames
  );

  const ec: EncodeContext = {
    pre,
    totalFrames,
    ctx,
    canvas,
    width,
    height,
    bitrate,
    onProgress,
  };

  let lastError: Error | null = null;
  for (const candidate of candidates) {
    try {
      return await encodeWithCandidate(candidate, ec);
    } catch (e) {
      // Codec suivant : ex. H.264 de Firefox/Windows réordonne les frames.
      lastError = e instanceof Error ? e : new Error(String(e));
      onProgress(0);
    }
  }
  throw lastError ?? new Error("La génération vidéo a échoué.");
}
