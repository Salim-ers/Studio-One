import {
  Muxer as Mp4Muxer,
  ArrayBufferTarget as Mp4Target,
} from "mp4-muxer";
import {
  Muxer as WebmMuxer,
  ArrayBufferTarget as WebmTarget,
} from "webm-muxer";
import type { ExportFormat, StoryboardScene, VideoProject } from "@/types/video";

/**
 * Génération de la vidéo de démonstration dans le navigateur : chaque image
 * du storyboard est dessinée sur un canvas puis encodée via WebCodecs, plus
 * vite que le temps réel. MP4 (H.264) en priorité, repli WebM (VP8/VP9)
 * selon les codecs disponibles. Vidéo muette : la voix off est incrustée
 * sous forme de sous-titres.
 */

const FPS = 24;

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

async function pickCodec(
  width: number,
  height: number,
  bitrate: number
): Promise<CodecCandidate> {
  for (let i = 0; i < CODEC_CANDIDATES.length; i++) {
    const candidate = CODEC_CANDIDATES[i];
    try {
      const { supported } = await VideoEncoder.isConfigSupported({
        codec: candidate.codecString,
        width,
        height,
        bitrate,
        framerate: FPS,
      });
      if (supported) return candidate;
    } catch {
      // Codec inconnu de ce navigateur : on essaie le suivant.
    }
  }
  throw new Error(
    "Aucun codec vidéo compatible trouvé dans ce navigateur. Essayez Chrome ou Edge récent."
  );
}

/* ── Dessin des images ─────────────────────────────────────────── */

const COLORS = {
  coffee: "#18110C",
  bronze: "#9A6A3A",
  bronzeDeep: "#6F4726",
  warmGray: "#8C8178",
  ivory: "#FFFDF8",
  cream: "#F3E9DC",
};

const ROLE_LABELS: Record<StoryboardScene["role"], string> = {
  intro: "Intro",
  probleme: "Problème",
  solution: "Solution",
  fonctionnalites: "Fonctionnalités",
  benefices: "Bénéfices",
  preuve: "Preuve",
  conclusion: "Conclusion",
  cta: "Appel à l'action",
};

const DISPLAY_FONT = "Georgia, 'Times New Roman', serif";
const BODY_FONT =
  "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

/** Coupe en morceaux un mot insécable plus large que la colonne. */
function breakLongWord(
  ctx: CanvasRenderingContext2D,
  word: string,
  maxWidth: number
): string[] {
  if (ctx.measureText(word).width <= maxWidth) return [word];
  const parts: string[] = [];
  let current = "";
  for (let i = 0; i < word.length; i++) {
    const attempt = current + word[i];
    if (ctx.measureText(attempt).width <= maxWidth || !current) {
      current = attempt;
    } else {
      parts.push(current);
      current = word[i];
    }
  }
  if (current) parts.push(current);
  return parts;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const rawWords = text.split(/\s+/).filter(Boolean);
  const words: string[] = [];
  for (let i = 0; i < rawWords.length; i++) {
    const parts = breakLongWord(ctx, rawWords[i], maxWidth);
    for (let j = 0; j < parts.length; j++) words.push(parts[j]);
  }
  const lines: string[] = [];
  let current = "";

  for (let i = 0; i < words.length; i++) {
    const attempt = current ? `${current} ${words[i]}` : words[i];
    if (ctx.measureText(attempt).width <= maxWidth || !current) {
      current = attempt;
    } else {
      lines.push(current);
      current = words[i];
      if (lines.length === maxLines - 1) {
        // Dernière ligne : on remplit puis on tronque avec une ellipse.
        let rest = current;
        for (let j = i + 1; j < words.length; j++) rest += ` ${words[j]}`;
        while (rest.length > 1 && ctx.measureText(`${rest}…`).width > maxWidth) {
          rest = rest.slice(0, -1).trimEnd();
        }
        lines.push(rest === current ? rest : `${rest}…`);
        return lines;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface SceneWindow {
  scene: StoryboardScene;
  start: number;
  end: number;
}

function buildTimeline(scenes: StoryboardScene[]): SceneWindow[] {
  const windows: SceneWindow[] = [];
  let cursor = 0;
  for (let i = 0; i < scenes.length; i++) {
    windows.push({
      scene: scenes[i],
      start: cursor,
      end: cursor + scenes[i].durationSeconds,
    });
    cursor += scenes[i].durationSeconds;
  }
  return windows;
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  project: VideoProject,
  timeline: SceneWindow[],
  totalSeconds: number,
  time: number,
  w: number,
  h: number
): void {
  const u = Math.min(w, h) / 1080;
  const margin = 86 * u;

  // Fond dégradé ivoire → crème
  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, COLORS.ivory);
  gradient.addColorStop(1, COLORS.cream);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  const active =
    timeline.find((s) => time >= s.start && time < s.end) ??
    timeline[timeline.length - 1];

  // En-tête : produit + compteur de scène
  ctx.textBaseline = "top";
  ctx.fillStyle = COLORS.bronze;
  ctx.font = `600 ${Math.round(26 * u)}px ${BODY_FONT}`;
  ctx.textAlign = "left";
  ctx.fillText(project.productName.toUpperCase(), margin, margin * 0.55);
  if (active) {
    ctx.textAlign = "right";
    ctx.fillStyle = COLORS.warmGray;
    ctx.fillText(
      `SCÈNE ${active.scene.order}/${timeline.length}`,
      w - margin,
      margin * 0.55
    );
  }

  if (active) {
    // Fondu d'apparition du contenu de scène
    const local = time - active.start;
    const fade = Math.max(0.05, Math.min(1, local / 0.5));
    ctx.globalAlpha = fade;

    const contentTop = h * (h > w ? 0.24 : 0.26);
    ctx.textAlign = "left";

    // Rôle de la scène
    ctx.fillStyle = COLORS.bronze;
    ctx.font = `700 ${Math.round(30 * u)}px ${BODY_FONT}`;
    ctx.fillText(
      ROLE_LABELS[active.scene.role].toUpperCase(),
      margin,
      contentTop
    );

    // Titre
    ctx.fillStyle = COLORS.coffee;
    ctx.font = `600 ${Math.round(72 * u)}px ${DISPLAY_FONT}`;
    const titleLines = wrapText(ctx, active.scene.title, w - margin * 2, 2);
    let y = contentTop + 56 * u;
    for (let i = 0; i < titleLines.length; i++) {
      ctx.fillText(titleLines[i], margin, y);
      y += 84 * u;
    }

    // Description
    ctx.fillStyle = COLORS.warmGray;
    ctx.font = `400 ${Math.round(34 * u)}px ${BODY_FONT}`;
    const descLines = wrapText(ctx, active.scene.description, w - margin * 2, 4);
    y += 16 * u;
    for (let i = 0; i < descLines.length; i++) {
      ctx.fillText(descLines[i], margin, y);
      y += 48 * u;
    }

    // Sous-titre (voix off incrustée)
    if (active.scene.voiceOver.trim()) {
      ctx.font = `500 ${Math.round(32 * u)}px ${BODY_FONT}`;
      const subLines = wrapText(
        ctx,
        active.scene.voiceOver.trim(),
        w - margin * 3,
        3
      );
      const lineHeight = 46 * u;
      const padY = 28 * u;
      const boxHeight = subLines.length * lineHeight + padY * 2 - (lineHeight - 36 * u);
      const boxBottom = h - 120 * u;
      const boxTop = boxBottom - boxHeight;

      ctx.globalAlpha = fade * 0.92;
      ctx.fillStyle = COLORS.ivory;
      ctx.strokeStyle = "rgba(154,106,58,0.25)";
      ctx.lineWidth = 2 * u;
      ctx.beginPath();
      const bx = margin;
      const bw = w - margin * 2;
      const r = 18 * u;
      ctx.moveTo(bx + r, boxTop);
      ctx.arcTo(bx + bw, boxTop, bx + bw, boxTop + boxHeight, r);
      ctx.arcTo(bx + bw, boxTop + boxHeight, bx, boxTop + boxHeight, r);
      ctx.arcTo(bx, boxTop + boxHeight, bx, boxTop, r);
      ctx.arcTo(bx, boxTop, bx + bw, boxTop, r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.globalAlpha = fade;
      ctx.fillStyle = COLORS.coffee;
      ctx.textAlign = "center";
      let sy = boxTop + padY;
      for (let i = 0; i < subLines.length; i++) {
        ctx.fillText(subLines[i], w / 2, sy);
        sy += lineHeight;
      }
    }

    ctx.globalAlpha = 1;
  }

  // Règle pellicule : graduations au-dessus de la barre de progression
  ctx.strokeStyle = "rgba(154,106,58,0.35)";
  ctx.lineWidth = Math.max(1, 2 * u);
  const tickY = h - 64 * u;
  for (let x = margin; x <= w - margin; x += 24 * u) {
    const major = Math.round((x - margin) / (24 * u)) % 5 === 0;
    ctx.beginPath();
    ctx.moveTo(x, tickY);
    ctx.lineTo(x, tickY - (major ? 16 : 9) * u);
    ctx.stroke();
  }

  // Barre de progression globale
  const barY = h - 44 * u;
  ctx.fillStyle = "rgba(154,106,58,0.18)";
  ctx.fillRect(margin, barY, w - margin * 2, 6 * u);
  ctx.fillStyle = COLORS.bronze;
  ctx.fillRect(
    margin,
    barY,
    (w - margin * 2) * Math.min(1, time / totalSeconds),
    6 * u
  );

  // Signature
  ctx.fillStyle = COLORS.warmGray;
  ctx.font = `400 ${Math.round(20 * u)}px ${BODY_FONT}`;
  ctx.textAlign = "right";
  ctx.fillText("Studio One — démo générée", w - margin, h - 30 * u);
  ctx.textAlign = "left";
}

/* ── Encodage ──────────────────────────────────────────────────── */

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

export async function generateVideo(
  project: VideoProject,
  format: ExportFormat,
  onProgress: (percent: number) => void
): Promise<VideoResult> {
  if (typeof VideoEncoder === "undefined") {
    throw new Error(
      "Votre navigateur ne supporte pas l'encodage vidéo (WebCodecs). Utilisez Chrome, Edge ou un navigateur récent."
    );
  }

  const { width, height } = FORMAT_DIMENSIONS[format];
  const bitrate = format === "1:1" ? 6_000_000 : 8_000_000;
  const scenes = project.scenes.length > 0 ? project.scenes : [fallbackScene(project)];
  const timeline = buildTimeline(scenes);
  const totalSeconds = timeline[timeline.length - 1].end;
  const totalFrames = Math.max(FPS, Math.round(totalSeconds * FPS));

  const candidate = await pickCodec(width, height, bitrate);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas 2D indisponible dans ce navigateur.");

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
    });
    addChunk = (chunk, meta) => muxer.addVideoChunk(chunk, meta);
    finalize = () => {
      muxer.finalize();
      return target.buffer;
    };
  }

  const errorRef: { current: Error | null } = { current: null };
  const encoder = new VideoEncoder({
    output: (chunk, meta) => addChunk(chunk, meta),
    error: (e) => {
      errorRef.current = e instanceof Error ? e : new Error(String(e));
    },
  });

  encoder.configure({
    codec: candidate.codecString,
    width,
    height,
    bitrate,
    framerate: FPS,
    ...(candidate.kind === "mp4" ? { avc: { format: "avc" as const } } : {}),
  });

  const frameDuration = Math.round(1_000_000 / FPS);

  for (let i = 0; i < totalFrames; i++) {
    if (errorRef.current) break;

    drawFrame(ctx, project, timeline, totalSeconds, i / FPS, width, height);
    const frame = new VideoFrame(canvas, {
      timestamp: i * frameDuration,
      duration: frameDuration,
    });
    encoder.encode(frame, { keyFrame: i % (FPS * 2) === 0 });
    frame.close();

    // Régule la file de l'encodeur et laisse respirer l'interface.
    // Le timeout évite un blocage si l'encodeur plante : "dequeue" ne
    // serait alors jamais émis, et la boucle doit revoir errorRef.
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

  if (errorRef.current) {
    try {
      encoder.close();
    } catch {}
    throw errorRef.current;
  }

  await encoder.flush();
  encoder.close();
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
