import type { StoryboardScene, VideoProject } from "@/types/video";

/**
 * Rendu cinématique des scènes sur canvas : fond animé, typographie
 * cinétique, mock d'interface en mouvement, effet Ken Burns sur les
 * captures, compteurs/barres animés, ouverture et CTA. Le layout des
 * textes est précalculé une fois par format ; seules les positions et
 * opacités sont animées image par image (performances d'encodage).
 */

export const PALETTE = {
  coffee: "#18110C",
  ink: "#241812",
  bronze: "#9A6A3A",
  bronzeDeep: "#6F4726",
  caramel: "#B9854D",
  warmGray: "#8C8178",
  ivory: "#FFFDF8",
  cream: "#F3E9DC",
  creamDeep: "#EAD9C3",
};

const ROLE_LABELS: Record<StoryboardScene["role"], string> = {
  intro: "Intro",
  probleme: "Le problème",
  solution: "La solution",
  fonctionnalites: "Fonctionnalités",
  benefices: "Bénéfices",
  preuve: "Preuve",
  conclusion: "Conclusion",
  cta: "Passez à l'action",
};

const DISPLAY_FONT = "Georgia, 'Times New Roman', serif";
const BODY_FONT =
  "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

/* ── Utilitaires d'animation ───────────────────────────────────── */

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
const easeInOutCubic = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const x = clamp(t);
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

/** PRNG déterministe (LCG) pour des positions stables entre encodages. */
function seeded(seed: number): () => number {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/* ── Précalcul du layout ───────────────────────────────────────── */

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
    if (ctx.measureText(attempt).width <= maxWidth || !current) current = attempt;
    else {
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
  for (const w of rawWords) for (const p of breakLongWord(ctx, w, maxWidth)) words.push(p);

  const lines: string[] = [];
  let current = "";
  for (let i = 0; i < words.length; i++) {
    const attempt = current ? `${current} ${words[i]}` : words[i];
    if (ctx.measureText(attempt).width <= maxWidth || !current) current = attempt;
    else {
      lines.push(current);
      current = words[i];
      if (lines.length === maxLines - 1) {
        let rest = current;
        for (let j = i + 1; j < words.length; j++) rest += ` ${words[j]}`;
        while (rest.length > 1 && ctx.measureText(`${rest}…`).width > maxWidth)
          rest = rest.slice(0, -1).trimEnd();
        lines.push(rest === current ? rest : `${rest}…`);
        return lines;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Charge des captures (data URLs ou URLs) en sources dessinables. */
export async function loadImageSources(
  urls: string[]
): Promise<Array<{ source: CanvasImageSource; aspect: number }>> {
  const loaded = await Promise.all(
    urls.map(
      async (
        url
      ): Promise<{ source: CanvasImageSource; aspect: number } | null> => {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          const bitmap = await createImageBitmap(blob);
          return { source: bitmap, aspect: bitmap.width / bitmap.height };
        } catch {
          return null;
        }
      }
    )
  );
  return loaded.filter(
    (x): x is { source: CanvasImageSource; aspect: number } => x !== null
  );
}

export interface SceneVisual {
  scene: StoryboardScene;
  start: number;
  end: number;
  titleLines: string[];
  descLines: string[];
  subtitleLines: string[];
  image?: CanvasImageSource;
  imageAspect?: number;
}

export interface Precomputed {
  project: VideoProject;
  visuals: SceneVisual[];
  totalSeconds: number;
  stacked: boolean;
  u: number;
}

export function precomputeTimeline(
  ctx: CanvasRenderingContext2D,
  project: VideoProject,
  scenes: StoryboardScene[],
  width: number,
  height: number,
  images: Array<{ source: CanvasImageSource; aspect: number }> = []
): Precomputed {
  const u = Math.min(width, height) / 1080;
  const stacked = width < height * 1.2;
  const margin = 92 * u;

  // Zone de texte : moitié gauche en paysage, pleine largeur en portrait.
  const textWidth = stacked ? width - margin * 2 : width * 0.5 - margin * 1.2;
  const titleSize = Math.round((stacked ? 68 : 76) * u);
  const descSize = Math.round(34 * u);
  const subSize = Math.round(32 * u);

  // Répartition des captures fournies sur les scènes de contenu (layout
  // standard). L'intro et le CTA ont leur propre mise en scène.
  const imageScenes = scenes.filter(
    (s) => s.role !== "intro" && s.role !== "cta"
  );
  const imageFor = new Map<string, { source: CanvasImageSource; aspect: number }>();
  if (images.length > 0) {
    imageScenes.forEach((s, i) => {
      if (images.length) imageFor.set(s.id, images[i % images.length]);
    });
  }

  let cursor = 0;
  const visuals: SceneVisual[] = scenes.map((scene) => {
    ctx.font = `600 ${titleSize}px ${DISPLAY_FONT}`;
    const titleLines = wrapText(ctx, scene.title, textWidth, 3);
    ctx.font = `400 ${descSize}px ${BODY_FONT}`;
    const descLines = wrapText(ctx, scene.description, textWidth, 3);
    ctx.font = `500 ${subSize}px ${BODY_FONT}`;
    const subtitleLines = scene.voiceOver.trim()
      ? wrapText(ctx, scene.voiceOver.trim(), width - margin * 2 - 80 * u, 2)
      : [];

    const img = imageFor.get(scene.id);
    const v: SceneVisual = {
      scene,
      start: cursor,
      end: cursor + scene.durationSeconds,
      titleLines,
      descLines,
      subtitleLines,
      image: img?.source,
      imageAspect: img?.aspect,
    };
    cursor += scene.durationSeconds;
    return v;
  });

  return {
    project,
    visuals,
    totalSeconds: cursor,
    stacked,
    u,
  };
}

/* ── Primitives de dessin ──────────────────────────────────────── */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  u: number
) {
  // Dégradé chaud qui respire lentement.
  const shift = (Math.sin(t * 0.25) + 1) / 2;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, PALETTE.ivory);
  g.addColorStop(lerp(0.45, 0.65, shift), PALETTE.cream);
  g.addColorStop(1, PALETTE.creamDeep);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Points flottants (parallaxe douce).
  const rand = seeded(7);
  ctx.save();
  for (let i = 0; i < 20; i++) {
    const bx = rand() * w;
    const by = rand() * h;
    const rad = (2 + rand() * 4) * u;
    const drift = Math.sin(t * 0.5 + i) * 14 * u;
    ctx.globalAlpha = 0.05 + rand() * 0.06;
    ctx.fillStyle = i % 2 ? PALETTE.bronze : PALETTE.caramel;
    ctx.beginPath();
    ctx.arc(bx + drift, by + Math.cos(t * 0.4 + i) * 10 * u, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Halo bronze mobile pour donner de la profondeur.
  const hx = w * (0.7 + Math.sin(t * 0.3) * 0.08);
  const hy = h * (0.35 + Math.cos(t * 0.22) * 0.06);
  const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, Math.max(w, h) * 0.55);
  halo.addColorStop(0, "rgba(185,133,77,0.16)");
  halo.addColorStop(1, "rgba(185,133,77,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);
}

function drawTopBar(
  ctx: CanvasRenderingContext2D,
  project: VideoProject,
  visual: SceneVisual,
  total: number,
  w: number,
  u: number,
  margin: number
) {
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = PALETTE.bronzeDeep;
  ctx.font = `700 ${Math.round(26 * u)}px ${BODY_FONT}`;
  ctx.fillText(project.productName.toUpperCase(), margin, margin * 0.7);

  ctx.textAlign = "right";
  ctx.fillStyle = PALETTE.warmGray;
  ctx.font = `600 ${Math.round(24 * u)}px ${BODY_FONT}`;
  ctx.fillText(
    `${String(visual.scene.order).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
    w - margin,
    margin * 0.7
  );
  ctx.textAlign = "left";
}

/** Mock d'interface animé : donne un vrai sentiment de « logiciel en action ». */
function drawMockUI(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
  local: number,
  u: number
) {
  const appear = easeOutCubic(clamp(local / 0.6));
  ctx.save();
  ctx.globalAlpha = appear;
  const oy = y + (1 - appear) * 40 * u;

  // Ombre portée
  ctx.save();
  ctx.shadowColor = "rgba(24,17,12,0.18)";
  ctx.shadowBlur = 40 * u;
  ctx.shadowOffsetY = 24 * u;
  ctx.fillStyle = PALETTE.ivory;
  roundRect(ctx, x, oy, w, h, 20 * u);
  ctx.fill();
  ctx.restore();

  // Cadre
  ctx.strokeStyle = "rgba(154,106,58,0.22)";
  ctx.lineWidth = 1.5 * u;
  roundRect(ctx, x, oy, w, h, 20 * u);
  ctx.stroke();

  // Barre de fenêtre + pastilles
  const barH = 44 * u;
  ctx.fillStyle = PALETTE.cream;
  roundRect(ctx, x, oy, w, barH, 20 * u);
  ctx.fill();
  ctx.fillRect(x, oy + barH - 20 * u, w, 20 * u);
  const dots = [PALETTE.caramel, PALETTE.bronze, PALETTE.bronzeDeep];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = dots[i];
    ctx.globalAlpha = appear * 0.8;
    ctx.beginPath();
    ctx.arc(x + 26 * u + i * 24 * u, oy + barH / 2, 6 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = appear;

  // Zone de contenu : sidebar + cartes qui apparaissent en cascade
  const pad = 22 * u;
  const contentY = oy + barH + pad;
  const sidebarW = w * 0.26;

  // Sidebar
  ctx.fillStyle = "rgba(154,106,58,0.06)";
  roundRect(ctx, x + pad, contentY, sidebarW - pad, h - barH - pad * 2, 12 * u);
  ctx.fill();
  const navCount = 4;
  const activeNav = Math.floor(t * 0.8) % navCount;
  for (let i = 0; i < navCount; i++) {
    const ny = contentY + 18 * u + i * 40 * u;
    if (i === activeNav) {
      ctx.fillStyle = "rgba(154,106,58,0.16)";
      roundRect(ctx, x + pad + 8 * u, ny - 10 * u, sidebarW - pad - 16 * u, 32 * u, 8 * u);
      ctx.fill();
    }
    ctx.fillStyle = i === activeNav ? PALETTE.bronzeDeep : "rgba(140,129,120,0.5)";
    roundRect(ctx, x + pad + 18 * u, ny, (sidebarW - pad) * 0.55, 8 * u, 4 * u);
    ctx.fill();
  }

  // Cartes / lignes de contenu
  const mainX = x + sidebarW + pad * 0.5;
  const mainW = w - sidebarW - pad * 1.5;
  const rows = 4;
  for (let i = 0; i < rows; i++) {
    const rowAppear = easeOutCubic(clamp((local - 0.3 - i * 0.14) / 0.5));
    if (rowAppear <= 0) continue;
    ctx.globalAlpha = appear * rowAppear;
    const ry = contentY + i * 62 * u + (1 - rowAppear) * 16 * u;
    const highlighted = i === Math.floor(t * 0.6) % rows;
    ctx.fillStyle = highlighted ? "rgba(154,106,58,0.10)" : "rgba(24,17,12,0.03)";
    roundRect(ctx, mainX, ry, mainW - pad, 48 * u, 10 * u);
    ctx.fill();
    // pastille + barres
    ctx.fillStyle = highlighted ? PALETTE.bronze : "rgba(154,106,58,0.35)";
    ctx.beginPath();
    ctx.arc(mainX + 22 * u, ry + 24 * u, 10 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(24,17,12,0.28)";
    roundRect(ctx, mainX + 44 * u, ry + 14 * u, mainW * 0.4, 8 * u, 4 * u);
    ctx.fill();
    ctx.fillStyle = "rgba(24,17,12,0.14)";
    roundRect(ctx, mainX + 44 * u, ry + 28 * u, mainW * 0.6, 7 * u, 4 * u);
    ctx.fill();
  }
  ctx.globalAlpha = appear;

  // Curseur qui se déplace vers la ligne active
  const targetRow = Math.floor(t * 0.6) % rows;
  const cx = mainX + mainW * 0.5 + Math.sin(t * 1.4) * 20 * u;
  const cy = contentY + targetRow * 62 * u + 24 * u;
  ctx.fillStyle = PALETTE.coffee;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy + 22 * u);
  ctx.lineTo(cx + 6 * u, cy + 16 * u);
  ctx.lineTo(cx + 14 * u, cy + 24 * u);
  ctx.lineTo(cx + 18 * u, cy + 20 * u);
  ctx.lineTo(cx + 10 * u, cy + 12 * u);
  ctx.lineTo(cx + 16 * u, cy + 8 * u);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/** Capture réelle animée (Ken Burns) dans un cadre de fenêtre. */
function drawKenBurns(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  aspect: number,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
  local: number,
  u: number
) {
  const appear = easeOutCubic(clamp(local / 0.6));
  ctx.save();
  ctx.globalAlpha = appear;
  const oy = y + (1 - appear) * 40 * u;

  ctx.save();
  ctx.shadowColor = "rgba(24,17,12,0.22)";
  ctx.shadowBlur = 44 * u;
  ctx.shadowOffsetY = 26 * u;
  ctx.fillStyle = PALETTE.ivory;
  roundRect(ctx, x, oy, w, h, 18 * u);
  ctx.fill();
  ctx.restore();

  const barH = 40 * u;
  ctx.fillStyle = PALETTE.cream;
  roundRect(ctx, x, oy, w, barH, 18 * u);
  ctx.fill();
  ctx.fillRect(x, oy + barH - 18 * u, w, 18 * u);
  const dots = [PALETTE.caramel, PALETTE.bronze, PALETTE.bronzeDeep];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = dots[i];
    ctx.beginPath();
    ctx.arc(x + 24 * u + i * 22 * u, oy + barH / 2, 5.5 * u, 0, Math.PI * 2);
    ctx.fill();
  }

  // Image en cover avec zoom/pan lents
  const viewX = x + 6 * u;
  const viewY = oy + barH;
  const viewW = w - 12 * u;
  const viewH = h - barH - 6 * u;
  ctx.save();
  roundRect(ctx, viewX, viewY, viewW, viewH, 8 * u);
  ctx.clip();

  const zoom = lerp(1.04, 1.14, easeInOutCubic((Math.sin(t * 0.25) + 1) / 2));
  const panX = Math.sin(t * 0.2) * 0.03;
  const panY = Math.cos(t * 0.18) * 0.03;
  const viewAspect = viewW / viewH;
  let dw = viewW * zoom;
  let dh = viewH * zoom;
  if (aspect > viewAspect) dw = dh * aspect;
  else dh = dw / aspect;
  const dx = viewX + (viewW - dw) / 2 + panX * viewW;
  const dy = viewY + (viewH - dh) / 2 + panY * viewH;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();

  ctx.restore();
}

/** Barres animées pour la scène "bénéfices". */
function drawBars(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  local: number,
  u: number
) {
  const heights = [0.55, 0.8, 0.65, 1.0];
  const gap = 24 * u;
  const barW = (w - gap * (heights.length - 1)) / heights.length;
  for (let i = 0; i < heights.length; i++) {
    const grow = easeOutCubic(clamp((local - 0.3 - i * 0.12) / 0.7));
    const bh = h * heights[i] * grow;
    const bx = x + i * (barW + gap);
    const by = y + h - bh;
    const g = ctx.createLinearGradient(0, by, 0, by + bh);
    g.addColorStop(0, PALETTE.caramel);
    g.addColorStop(1, PALETTE.bronzeDeep);
    ctx.fillStyle = g;
    roundRect(ctx, bx, by, barW, bh, 10 * u);
    ctx.fill();
    // reflet
    ctx.fillStyle = "rgba(255,253,248,0.25)";
    roundRect(ctx, bx + 6 * u, by + 8 * u, barW * 0.3, Math.max(0, bh - 16 * u), 6 * u);
    ctx.fill();
  }
}

/* ── Rendu d'une image de la timeline ──────────────────────────── */

export function drawSceneFrame(
  ctx: CanvasRenderingContext2D,
  pre: Precomputed,
  time: number,
  w: number,
  h: number
) {
  const { u, stacked, project, visuals, totalSeconds } = pre;
  const margin = 92 * u;

  drawBackground(ctx, w, h, time, u);

  const visual =
    visuals.find((v) => time >= v.start && time < v.end) ??
    visuals[visuals.length - 1];
  const local = time - visual.start;
  const remaining = visual.end - time;
  const scene = visual.scene;

  drawTopBar(ctx, project, visual, visuals.length, w, u, margin);

  const isIntro = scene.role === "intro";
  const isCta = scene.role === "cta";
  const isBenefices = scene.role === "benefices";

  // Sortie de scène : léger glissement + fondu sur les 0,4 dernières secondes.
  const exit = clamp(remaining / 0.4);
  const exitShift = (1 - exit) * -50 * u;

  if (isIntro) {
    drawIntro(ctx, pre, visual, local, w, h, margin);
  } else if (isCta) {
    drawCta(ctx, pre, visual, local, time, w, h, margin);
  } else {
    // Layout standard : texte + visuel (mock UI ou capture).
    const textX = margin;
    const textTop = stacked ? margin * 1.9 : h * 0.28;

    ctx.save();
    ctx.globalAlpha = exit;
    ctx.translate(exitShift, 0);

    // Étiquette de rôle avec trait animé
    const tagAppear = easeOutCubic(clamp(local / 0.4));
    ctx.globalAlpha = exit * tagAppear;
    ctx.fillStyle = PALETTE.bronze;
    ctx.font = `700 ${Math.round(26 * u)}px ${BODY_FONT}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(ROLE_LABELS[scene.role].toUpperCase(), textX, textTop);
    ctx.fillStyle = PALETTE.bronze;
    ctx.fillRect(textX, textTop + 14 * u, 70 * u * tagAppear, 4 * u);

    // Titre : lignes qui montent en cascade
    ctx.fillStyle = PALETTE.coffee;
    const titleSize = Math.round((stacked ? 68 : 76) * u);
    ctx.font = `600 ${titleSize}px ${DISPLAY_FONT}`;
    let ty = textTop + 62 * u;
    visual.titleLines.forEach((line, i) => {
      const lp = easeOutCubic(clamp((local - 0.15 - i * 0.12) / 0.5));
      ctx.globalAlpha = exit * lp;
      ctx.fillText(line, textX, ty + (1 - lp) * 30 * u);
      ty += titleSize * 1.12;
    });

    // Description : lignes en fondu décalé
    ctx.fillStyle = PALETTE.warmGray;
    const descSize = Math.round(34 * u);
    ctx.font = `400 ${descSize}px ${BODY_FONT}`;
    let dy = ty + 18 * u;
    visual.descLines.forEach((line, i) => {
      const lp = easeOutCubic(clamp((local - 0.5 - i * 0.1) / 0.5));
      ctx.globalAlpha = exit * lp;
      ctx.fillText(line, textX, dy);
      dy += descSize * 1.4;
    });
    ctx.restore();

    // Visuel à droite (paysage) ou en bas (portrait)
    let vx: number, vy: number, vw: number, vh: number;
    if (stacked) {
      vw = w - margin * 2;
      vh = h * 0.3;
      vx = margin;
      vy = h * 0.44;
    } else {
      vw = w * 0.42;
      vh = h * 0.52;
      vx = w - vw - margin;
      vy = h * 0.24;
    }
    ctx.save();
    ctx.globalAlpha = exit;
    ctx.translate(-exitShift * 0.6, 0);
    if (isBenefices && !visual.image) {
      // Encadré + barres animées
      ctx.save();
      ctx.shadowColor = "rgba(24,17,12,0.16)";
      ctx.shadowBlur = 40 * u;
      ctx.shadowOffsetY = 22 * u;
      ctx.fillStyle = PALETTE.ivory;
      roundRect(ctx, vx, vy, vw, vh, 20 * u);
      ctx.fill();
      ctx.restore();
      drawBars(ctx, vx + 40 * u, vy + 50 * u, vw - 80 * u, vh - 100 * u, local, u);
    } else if (visual.image) {
      drawKenBurns(ctx, visual.image, visual.imageAspect ?? 16 / 9, vx, vy, vw, vh, time, local, u);
    } else {
      drawMockUI(ctx, vx, vy, vw, vh, time, local, u);
    }
    ctx.restore();
  }

  // Bande de sous-titres (voix off incrustée)
  if (visual.subtitleLines.length > 0) {
    drawSubtitle(ctx, visual.subtitleLines, exit, w, h, u, margin);
  }

  drawProgressBar(ctx, time, totalSeconds, w, h, u, margin);

  // Balayage bronze à l'entrée de chaque scène (sauf la première).
  if (visual.start > 0 && local < 0.45) {
    const p = easeInOutCubic(clamp(local / 0.45));
    ctx.save();
    ctx.globalAlpha = (1 - p) * 0.9;
    ctx.fillStyle = PALETTE.bronze;
    ctx.fillRect(w * (p - 0.15), 0, w * 0.15, h);
    ctx.restore();
  }
}

function drawIntro(
  ctx: CanvasRenderingContext2D,
  pre: Precomputed,
  visual: SceneVisual,
  local: number,
  w: number,
  h: number,
  margin: number
) {
  const { u, project } = pre;
  const cx = margin;
  const cy = h * 0.42;

  // Voile assombri chic
  ctx.save();
  const veil = ctx.createLinearGradient(0, 0, w, 0);
  veil.addColorStop(0, "rgba(24,17,12,0.06)");
  veil.addColorStop(1, "rgba(24,17,12,0)");
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Petit sur-titre
  const p0 = easeOutCubic(clamp(local / 0.5));
  ctx.globalAlpha = p0;
  ctx.fillStyle = PALETTE.bronze;
  ctx.font = `700 ${Math.round(28 * u)}px ${BODY_FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("STUDIO ONE PRÉSENTE", cx, cy - 60 * u);

  // Nom du produit — grande révélation avec léger dépassement
  const p1 = easeOutBack(clamp((local - 0.15) / 0.7));
  ctx.save();
  ctx.globalAlpha = clamp((local - 0.15) / 0.4);
  const nameSize = Math.round(120 * u);
  ctx.font = `700 ${nameSize}px ${DISPLAY_FONT}`;
  ctx.fillStyle = PALETTE.coffee;
  ctx.translate(cx, cy + 60 * u);
  ctx.scale(lerp(0.9, 1, p1), lerp(0.9, 1, p1));
  ctx.fillText(project.productName, 0, 0);
  ctx.restore();

  // Trait qui se déploie
  const p2 = easeInOutCubic(clamp((local - 0.6) / 0.6));
  ctx.globalAlpha = 1;
  ctx.fillStyle = PALETTE.bronze;
  ctx.fillRect(cx, cy + 100 * u, 420 * u * p2, 6 * u);

  // Accroche (description)
  const p3 = easeOutCubic(clamp((local - 0.9) / 0.6));
  ctx.globalAlpha = p3;
  ctx.fillStyle = PALETTE.warmGray;
  ctx.font = `400 ${Math.round(38 * u)}px ${BODY_FONT}`;
  let dy = cy + 170 * u;
  visual.descLines.slice(0, 2).forEach((line, i) => {
    const lp = clamp((local - 0.9 - i * 0.12) / 0.5);
    ctx.globalAlpha = lp;
    ctx.fillText(line, cx, dy + (1 - easeOutCubic(lp)) * 20 * u);
    dy += 52 * u;
  });
  ctx.globalAlpha = 1;
}

function drawCta(
  ctx: CanvasRenderingContext2D,
  pre: Precomputed,
  visual: SceneVisual,
  local: number,
  time: number,
  w: number,
  h: number,
  margin: number
) {
  const { u, project } = pre;

  // Panneau bronze plein pour finir en force
  ctx.save();
  const p0 = easeInOutCubic(clamp(local / 0.5));
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, PALETTE.bronzeDeep);
  g.addColorStop(1, PALETTE.bronze);
  ctx.globalAlpha = p0 * 0.97;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  ctx.textAlign = "center";
  const cx = w / 2;

  const p1 = easeOutCubic(clamp((local - 0.2) / 0.5));
  ctx.globalAlpha = p1;
  ctx.fillStyle = "rgba(255,253,248,0.8)";
  ctx.font = `700 ${Math.round(28 * u)}px ${BODY_FONT}`;
  ctx.fillText(project.productName.toUpperCase(), cx, h * 0.34);

  // Ligne d'appel (voix off du CTA ou titre)
  const p2 = easeOutCubic(clamp((local - 0.35) / 0.6));
  ctx.globalAlpha = p2;
  ctx.fillStyle = PALETTE.ivory;
  const ctaSize = Math.round(64 * u);
  ctx.font = `600 ${ctaSize}px ${DISPLAY_FONT}`;
  const lines = visual.titleLines.length ? visual.titleLines : [sceneCtaText(visual)];
  let ty = h * 0.46;
  lines.forEach((line, i) => {
    const lp = clamp((local - 0.35 - i * 0.12) / 0.5);
    ctx.globalAlpha = lp;
    ctx.fillText(line, cx, ty + (1 - easeOutCubic(lp)) * 24 * u);
    ty += ctaSize * 1.15;
  });

  // Bouton qui pulse
  const p3 = easeOutBack(clamp((local - 0.6) / 0.6));
  ctx.globalAlpha = clamp((local - 0.6) / 0.4);
  const pulse = 1 + Math.sin(time * 3) * 0.02;
  const btnW = 380 * u * p3 * pulse;
  const btnH = 92 * u * p3 * pulse;
  const bx = cx - btnW / 2;
  const by = ty + 20 * u;
  ctx.save();
  ctx.shadowColor = "rgba(24,17,12,0.3)";
  ctx.shadowBlur = 30 * u;
  ctx.shadowOffsetY = 14 * u;
  ctx.fillStyle = PALETTE.ivory;
  roundRect(ctx, bx, by, btnW, btnH, btnH / 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = PALETTE.bronzeDeep;
  ctx.font = `700 ${Math.round(30 * u)}px ${BODY_FONT}`;
  ctx.textBaseline = "middle";
  ctx.fillText("Essayer maintenant", cx, by + btnH / 2);
  ctx.textBaseline = "alphabetic";
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}

function sceneCtaText(visual: SceneVisual): string {
  return visual.scene.voiceOver.trim() || "Passez à l'action dès aujourd'hui.";
}

function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  alpha: number,
  w: number,
  h: number,
  u: number,
  margin: number
) {
  const lineHeight = 46 * u;
  const padY = 22 * u;
  const boxH = lines.length * lineHeight + padY * 2;
  const boxBottom = h - 96 * u;
  const boxTop = boxBottom - boxH;
  const boxW = w - margin * 2;

  ctx.save();
  ctx.globalAlpha = alpha * 0.92;
  ctx.fillStyle = "rgba(24,17,12,0.82)";
  roundRect(ctx, margin, boxTop, boxW, boxH, 16 * u);
  ctx.fill();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = PALETTE.ivory;
  ctx.font = `500 ${Math.round(32 * u)}px ${BODY_FONT}`;
  ctx.textAlign = "center";
  let sy = boxTop + padY + lineHeight * 0.7;
  for (const line of lines) {
    ctx.fillText(line, w / 2, sy);
    sy += lineHeight;
  }
  ctx.textAlign = "left";
  ctx.restore();
}

function drawProgressBar(
  ctx: CanvasRenderingContext2D,
  time: number,
  total: number,
  w: number,
  h: number,
  u: number,
  margin: number
) {
  // Règle pellicule
  ctx.strokeStyle = "rgba(154,106,58,0.30)";
  ctx.lineWidth = Math.max(1, 2 * u);
  const tickY = h - 58 * u;
  for (let x = margin; x <= w - margin; x += 26 * u) {
    const major = Math.round((x - margin) / (26 * u)) % 5 === 0;
    ctx.beginPath();
    ctx.moveTo(x, tickY);
    ctx.lineTo(x, tickY - (major ? 14 : 8) * u);
    ctx.stroke();
  }

  const barY = h - 40 * u;
  ctx.fillStyle = "rgba(154,106,58,0.18)";
  roundRect(ctx, margin, barY, w - margin * 2, 6 * u, 3 * u);
  ctx.fill();
  ctx.fillStyle = PALETTE.bronze;
  roundRect(ctx, margin, barY, (w - margin * 2) * clamp(time / total), 6 * u, 3 * u);
  ctx.fill();

  ctx.fillStyle = PALETTE.warmGray;
  ctx.font = `400 ${Math.round(20 * u)}px ${BODY_FONT}`;
  ctx.textAlign = "right";
  ctx.fillText("Studio One", w - margin, h - 22 * u);
  ctx.textAlign = "left";
}
