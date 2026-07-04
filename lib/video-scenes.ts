import type { StoryboardScene, VideoProject } from "@/types/video";

/**
 * Rendu cinématique sombre et moderne, inspiré des démos SaaS pro : fond
 * sombre premium avec halo de la couleur du produit, typographie cinétique à
 * dégradé, et la VRAIE interface mise en scène (cartes qui flottent en léger
 * 3D, spotlight, curseur animé qui clique, glow). L'accent est dérivé
 * automatiquement des couleurs des captures fournies — le style s'adapte donc
 * à chaque produit. Le layout est précalculé une fois par format ; seules les
 * positions/opacités sont animées image par image.
 */

const THEME = {
  bg0: "#07070D",
  bg1: "#0E0E18",
  card: "#15151F",
  cardBar: "#1C1C28",
  textHi: "#FFFFFF",
  textLo: "#A6A2B8",
  hairline: "rgba(255,255,255,0.10)",
};

const DEFAULT_ACCENT = { a1: "#7C5CFF", a2: "#C24BFF" };

const ROLE_LABELS: Record<StoryboardScene["role"], string> = {
  intro: "Intro",
  probleme: "Le problème",
  solution: "La solution",
  fonctionnalites: "Fonctionnalités",
  benefices: "Résultats",
  preuve: "Preuve",
  conclusion: "En résumé",
  cta: "Passez à l'action",
};

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";

/* ── Utilitaires ───────────────────────────────────────────────── */

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

function seeded(seed: number): () => number {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [((h % 360) + 360) % 360, s, l];
}

/** Couleur d'accent vibrante dérivée d'une capture (teinte dominante). */
function deriveAccent(
  image: CanvasImageSource | undefined
): { a1: string; a2: string } {
  if (!image || typeof document === "undefined") return DEFAULT_ACCENT;
  try {
    const c = document.createElement("canvas");
    c.width = 40;
    c.height = 40;
    const cx = c.getContext("2d", { willReadFrequently: true });
    if (!cx) return DEFAULT_ACCENT;
    cx.drawImage(image, 0, 0, 40, 40);
    const { data } = cx.getImageData(0, 0, 40, 40);
    let sx = 0,
      sy = 0,
      satSum = 0,
      count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
      if (s > 0.28 && l > 0.2 && l < 0.82) {
        const rad = (h * Math.PI) / 180;
        const w = s;
        sx += Math.cos(rad) * w;
        sy += Math.sin(rad) * w;
        satSum += s;
        count += 1;
      }
    }
    if (count < 12) return DEFAULT_ACCENT;
    const hue = (Math.atan2(sy, sx) * 180) / Math.PI;
    const sat = clamp((satSum / count) * 1.15, 0.55, 0.9);
    return {
      a1: hslToHex(hue, sat, 0.62),
      a2: hslToHex(hue + 32, sat, 0.58),
    };
  } catch {
    return DEFAULT_ACCENT;
  }
}

/* ── Chargement des captures ───────────────────────────────────── */

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

/* ── Layout ────────────────────────────────────────────────────── */

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
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

type SceneMode = "intro" | "cta" | "float" | "spotlight" | "stats" | "mock";

export interface SceneVisual {
  scene: StoryboardScene;
  start: number;
  end: number;
  titleLines: string[];
  descLines: string[];
  subtitleLines: string[];
  image?: CanvasImageSource;
  imageAspect?: number;
  mode: SceneMode;
}

export interface Precomputed {
  project: VideoProject;
  visuals: SceneVisual[];
  totalSeconds: number;
  stacked: boolean;
  u: number;
  accent: { a1: string; a2: string };
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
  const margin = 96 * u;
  const accent = deriveAccent(images[0]?.source);

  const textWidth = stacked ? width - margin * 2 : width * 0.52 - margin * 1.1;
  const titleSize = Math.round((stacked ? 74 : 82) * u);
  const descSize = Math.round(33 * u);
  const subSize = Math.round(32 * u);

  const contentScenes = scenes.filter(
    (s) => s.role !== "intro" && s.role !== "cta"
  );
  const imageFor = new Map<string, { source: CanvasImageSource; aspect: number }>();
  if (images.length > 0) {
    contentScenes.forEach((s, i) => imageFor.set(s.id, images[i % images.length]));
  }

  let cursor = 0;
  let imgIndex = 0;
  const visuals: SceneVisual[] = scenes.map((scene) => {
    ctx.font = `800 ${titleSize}px ${FONT}`;
    const titleLines = wrapText(ctx, scene.title, textWidth, 3);
    ctx.font = `400 ${descSize}px ${FONT}`;
    const descLines = wrapText(ctx, scene.description, textWidth, 3);
    ctx.font = `500 ${subSize}px ${FONT}`;
    const subtitleLines = scene.voiceOver.trim()
      ? wrapText(ctx, scene.voiceOver.trim(), width - margin * 2 - 80 * u, 2)
      : [];

    const img = imageFor.get(scene.id);
    let mode: SceneMode;
    if (scene.role === "intro") mode = "intro";
    else if (scene.role === "cta") mode = "cta";
    else if (img) {
      mode = imgIndex % 2 === 0 ? "float" : "spotlight";
      imgIndex += 1;
    } else if (scene.role === "benefices") mode = "stats";
    else mode = "mock";

    const v: SceneVisual = {
      scene,
      start: cursor,
      end: cursor + scene.durationSeconds,
      titleLines,
      descLines,
      subtitleLines,
      image: img?.source,
      imageAspect: img?.aspect,
      mode,
    };
    cursor += scene.durationSeconds;
    return v;
  });

  return { project, visuals, totalSeconds: cursor, stacked, u, accent };
}

/* ── Primitives ────────────────────────────────────────────────── */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function accentGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  accent: { a1: string; a2: string }
) {
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, accent.a1);
  g.addColorStop(1, accent.a2);
  return g;
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  accent: { a1: string; a2: string }
) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, THEME.bg1);
  g.addColorStop(1, THEME.bg0);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Halos de la couleur du produit qui dérivent lentement.
  const blobs = [
    { cx: 0.22, cy: 0.24, col: accent.a1, sp: 0.18 },
    { cx: 0.82, cy: 0.72, col: accent.a2, sp: 0.13 },
  ];
  for (const b of blobs) {
    const bx = w * (b.cx + Math.sin(t * b.sp) * 0.05);
    const by = h * (b.cy + Math.cos(t * b.sp * 1.3) * 0.05);
    const rad = Math.max(w, h) * 0.5;
    const rg = ctx.createRadialGradient(bx, by, 0, bx, by, rad);
    rg.addColorStop(0, hexA(b.col, 0.22));
    rg.addColorStop(1, hexA(b.col, 0));
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w, h);
  }

  // Grain d'étoiles discrètes.
  const rand = seeded(11);
  ctx.save();
  for (let i = 0; i < 22; i++) {
    const x = rand() * w;
    const y = rand() * h;
    ctx.globalAlpha = 0.05 + rand() * 0.08;
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(x, y, rand() * 1.6 + 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Vignette
  const vig = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.3,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.75
  );
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

function hexA(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/** Affiche TOUTE la capture (fit/contain), centrée, sans recadrer l'interface. */
function drawImageContain(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  aspect: number,
  x: number,
  y: number,
  w: number,
  h: number,
  scale = 1
) {
  // Fond sombre derrière les éventuelles bandes (letterbox).
  ctx.fillStyle = "#0B0B12";
  ctx.fillRect(x, y, w, h);
  const viewAspect = w / h;
  let dw: number, dh: number;
  if (aspect > viewAspect) {
    dw = w;
    dh = w / aspect;
  } else {
    dh = h;
    dw = h * aspect;
  }
  dw *= scale;
  dh *= scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawCursor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  clickT: number
) {
  // Halo de clic
  if (clickT > 0) {
    const p = easeOutCubic(clickT);
    ctx.save();
    ctx.globalAlpha = (1 - p) * 0.5;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.arc(x, y, 8 * s + p * 34 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  const press = clickT > 0 && clickT < 0.5 ? 0.88 : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * press, s * press);
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 30);
  ctx.lineTo(8, 22);
  ctx.lineTo(14, 34);
  ctx.lineTo(19, 32);
  ctx.lineTo(13, 20);
  ctx.lineTo(22, 20);
  ctx.closePath();
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = "#1A1A22";
  ctx.stroke();
  ctx.restore();
}

/* ── Modes visuels ─────────────────────────────────────────────── */

function drawFloating(
  ctx: CanvasRenderingContext2D,
  visual: SceneVisual,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
  local: number,
  u: number,
  accent: { a1: string; a2: string }
) {
  const appear = easeOutCubic(clamp(local / 0.6));
  const bob = Math.sin(t * 1.1) * 8 * u;
  const tilt = lerp(0.05, 0.02, appear);
  const cx = x + w / 2;
  const cy = y + h / 2 + (1 - appear) * 50 * u + bob;

  ctx.save();
  ctx.globalAlpha = appear;
  ctx.translate(cx, cy);
  ctx.rotate(-tilt);
  ctx.scale(lerp(0.94, 1, appear), lerp(0.94, 1, appear));
  ctx.translate(-w / 2, -h / 2);

  // Glow accent derrière la carte
  ctx.save();
  ctx.shadowColor = hexA(accent.a1, 0.55);
  ctx.shadowBlur = 60 * u;
  ctx.shadowOffsetY = 20 * u;
  ctx.fillStyle = THEME.card;
  roundRect(ctx, 0, 0, w, h, 18 * u);
  ctx.fill();
  ctx.restore();

  const barH = 40 * u;
  windowChromeScaled(ctx, 0, 0, w, barH, u);

  // Contenu : image réelle, ou faux tableau de bord
  ctx.save();
  roundRect(ctx, 6 * u, barH, w - 12 * u, h - barH - 6 * u, 10 * u);
  ctx.clip();
  if (visual.image) {
    const scale = lerp(1.0, 1.02, easeInOutCubic((Math.sin(t * 0.3) + 1) / 2));
    drawImageContain(
      ctx,
      visual.image,
      visual.imageAspect ?? 16 / 9,
      6 * u,
      barH,
      w - 12 * u,
      h - barH - 6 * u,
      scale
    );
  } else {
    drawFakeDashboard(ctx, 6 * u, barH, w - 12 * u, h - barH - 6 * u, t, local, u, accent);
  }
  ctx.restore();

  // Bord lumineux
  ctx.strokeStyle = THEME.hairline;
  ctx.lineWidth = 1.5 * u;
  roundRect(ctx, 0, 0, w, h, 18 * u);
  ctx.stroke();
  ctx.restore();

  // Curseur qui vient cliquer un bouton de la carte
  const clickCycle = (t % 3) / 3;
  const cursorAppear = easeOutCubic(clamp((local - 0.5) / 0.5));
  if (cursorAppear > 0) {
    const targetX = cx + w * 0.16;
    const targetY = cy + h * 0.18 + bob;
    const startX = cx + w * 0.42;
    const startY = cy + h * 0.42;
    const move = easeInOutCubic(clamp(clickCycle / 0.5));
    const px = lerp(startX, targetX, move);
    const py = lerp(startY, targetY, move);
    const clickT = clickCycle > 0.5 ? clamp((clickCycle - 0.5) / 0.35) : 0;
    ctx.globalAlpha = cursorAppear;
    drawCursor(ctx, px, py, 1.5 * u, clickT);
    ctx.globalAlpha = 1;
  }
}

function windowChromeScaled(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  barH: number,
  u: number
) {
  ctx.fillStyle = THEME.cardBar;
  roundRect(ctx, x, y, w, barH, 16 * u);
  ctx.fill();
  ctx.fillRect(x, y + barH - 16 * u, w, 16 * u);
  const cols = ["#ff5f57", "#febc2e", "#28c840"];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = cols[i];
    ctx.beginPath();
    ctx.arc(x + 22 * u + i * 20 * u, y + barH / 2, 5.5 * u, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFakeDashboard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
  local: number,
  u: number,
  accent: { a1: string; a2: string }
) {
  ctx.fillStyle = "#0F0F17";
  ctx.fillRect(x, y, w, h);
  const pad = 20 * u;
  const sidebarW = w * 0.24;
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(x, y, sidebarW, h);
  const activeNav = Math.floor(t * 0.8) % 4;
  for (let i = 0; i < 4; i++) {
    const ny = y + pad + i * 42 * u;
    if (i === activeNav) {
      ctx.fillStyle = hexA(accent.a1, 0.25);
      roundRect(ctx, x + 10 * u, ny - 8 * u, sidebarW - 20 * u, 30 * u, 8 * u);
      ctx.fill();
    }
    ctx.fillStyle = i === activeNav ? accent.a1 : "rgba(255,255,255,0.22)";
    roundRect(ctx, x + 20 * u, ny, sidebarW * 0.5, 8 * u, 4 * u);
    ctx.fill();
  }
  const mainX = x + sidebarW + pad;
  const mainW = w - sidebarW - pad * 2;
  for (let i = 0; i < 4; i++) {
    const rowAppear = easeOutCubic(clamp((local - 0.2 - i * 0.12) / 0.5));
    if (rowAppear <= 0) continue;
    ctx.globalAlpha = rowAppear;
    const ry = y + pad + i * 58 * u;
    const hot = i === Math.floor(t * 0.6) % 4;
    ctx.fillStyle = hot ? hexA(accent.a1, 0.14) : "rgba(255,255,255,0.05)";
    roundRect(ctx, mainX, ry, mainW, 46 * u, 10 * u);
    ctx.fill();
    ctx.fillStyle = hot ? accent.a2 : "rgba(255,255,255,0.3)";
    ctx.beginPath();
    ctx.arc(mainX + 22 * u, ry + 23 * u, 9 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    roundRect(ctx, mainX + 42 * u, ry + 14 * u, mainW * 0.4, 7 * u, 4 * u);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    roundRect(ctx, mainX + 42 * u, ry + 27 * u, mainW * 0.6, 6 * u, 3 * u);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawSpotlight(
  ctx: CanvasRenderingContext2D,
  visual: SceneVisual,
  x: number,
  y: number,
  w: number,
  h: number,
  t: number,
  local: number,
  u: number,
  accent: { a1: string; a2: string }
) {
  const appear = easeOutCubic(clamp(local / 0.5));
  ctx.save();
  ctx.globalAlpha = appear;

  ctx.save();
  ctx.shadowColor = hexA(accent.a2, 0.5);
  ctx.shadowBlur = 60 * u;
  ctx.shadowOffsetY = 18 * u;
  ctx.fillStyle = THEME.card;
  roundRect(ctx, x, y, w, h, 18 * u);
  ctx.fill();
  ctx.restore();

  const barH = 40 * u;
  windowChromeScaled(ctx, x, y, w, barH, u);

  ctx.save();
  roundRect(ctx, x + 6 * u, y + barH, w - 12 * u, h - barH - 6 * u, 10 * u);
  ctx.clip();
  const vx = x + 6 * u;
  const vy = y + barH;
  const vw = w - 12 * u;
  const vh = h - barH - 6 * u;
  if (visual.image) {
    drawImageContain(ctx, visual.image, visual.imageAspect ?? 16 / 9, vx, vy, vw, vh, 1.0);
  } else {
    drawFakeDashboard(ctx, vx, vy, vw, vh, t, local, u, accent);
  }

  // Spotlight : le focus se déplace lentement d'un point à un autre.
  const prog = easeInOutCubic(clamp((local - 0.4) / Math.max(1, visual.end - visual.start - 1)));
  const fx = vx + vw * lerp(0.32, 0.7, prog);
  const fy = vy + vh * lerp(0.4, 0.62, prog);
  const rad = Math.min(vw, vh) * 0.42;
  const dim = ctx.createRadialGradient(fx, fy, rad * 0.35, fx, fy, rad * 1.6);
  dim.addColorStop(0, "rgba(7,7,13,0)");
  dim.addColorStop(1, "rgba(7,7,13,0.82)");
  ctx.fillStyle = dim;
  ctx.fillRect(vx, vy, vw, vh);

  // Anneau d'accent autour du focus
  ctx.strokeStyle = hexA(accent.a1, 0.9 * appear);
  ctx.lineWidth = 3 * u;
  ctx.beginPath();
  ctx.arc(fx, fy, rad * 0.9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = THEME.hairline;
  ctx.lineWidth = 1.5 * u;
  roundRect(ctx, x, y, w, h, 18 * u);
  ctx.stroke();

  // Curseur vers le focus
  const cursorAppear = easeOutCubic(clamp((local - 0.6) / 0.5));
  if (cursorAppear > 0) {
    const prog2 = easeInOutCubic(clamp((local - 0.4) / Math.max(1, visual.end - visual.start - 1)));
    const fx2 = x + 6 * u + (w - 12 * u) * lerp(0.32, 0.7, prog2);
    const fy2 = y + barH + (h - barH - 6 * u) * lerp(0.4, 0.62, prog2);
    const clickT = (t % 2.5) / 2.5 > 0.6 ? clamp(((t % 2.5) / 2.5 - 0.6) / 0.3) : 0;
    ctx.globalAlpha = cursorAppear;
    drawCursor(ctx, fx2, fy2, 1.5 * u, clickT);
  }
  ctx.restore();
}

function drawStats(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  local: number,
  u: number,
  accent: { a1: string; a2: string }
) {
  const heights = [0.5, 0.72, 0.62, 1.0];
  const gap = 22 * u;
  const barW = (w - gap * (heights.length - 1)) / heights.length;
  for (let i = 0; i < heights.length; i++) {
    const grow = easeOutCubic(clamp((local - 0.3 - i * 0.12) / 0.7));
    const bh = h * heights[i] * grow;
    const bx = x + i * (barW + gap);
    const by = y + h - bh;
    const g = ctx.createLinearGradient(0, by + bh, 0, by);
    g.addColorStop(0, accent.a2);
    g.addColorStop(1, accent.a1);
    ctx.save();
    ctx.shadowColor = hexA(accent.a1, 0.5);
    ctx.shadowBlur = 24 * u;
    ctx.fillStyle = g;
    roundRect(ctx, bx, by, barW, bh, 10 * u);
    ctx.fill();
    ctx.restore();
  }
}

/* ── Frame ─────────────────────────────────────────────────────── */

export function drawSceneFrame(
  ctx: CanvasRenderingContext2D,
  pre: Precomputed,
  time: number,
  w: number,
  h: number
) {
  const { u, stacked, project, visuals, totalSeconds, accent } = pre;
  const margin = 96 * u;

  drawBackground(ctx, w, h, time, accent);

  const visual =
    visuals.find((v) => time >= v.start && time < v.end) ??
    visuals[visuals.length - 1];
  const local = time - visual.start;
  const remaining = visual.end - time;
  const scene = visual.scene;

  // Top bar
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `700 ${Math.round(24 * u)}px ${FONT}`;
  ctx.fillText(project.productName.toUpperCase(), margin, margin * 0.66);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  ctx.font = `600 ${Math.round(22 * u)}px ${FONT}`;
  ctx.fillText(
    `${String(scene.order).padStart(2, "0")} / ${String(visuals.length).padStart(2, "0")}`,
    w - margin,
    margin * 0.66
  );
  ctx.textAlign = "left";

  const exit = clamp(remaining / 0.4);

  if (visual.mode === "intro") {
    drawIntro(ctx, pre, visual, local, w, h, margin);
  } else if (visual.mode === "cta") {
    drawCta(ctx, pre, visual, local, time, w, h, margin);
  } else {
    // Texte
    const textX = margin;
    const textTop = stacked ? margin * 1.7 : h * 0.26;
    ctx.save();
    ctx.globalAlpha = exit;

    const tagAppear = easeOutCubic(clamp(local / 0.4));
    ctx.globalAlpha = exit * tagAppear;
    ctx.fillStyle = accent.a1;
    ctx.font = `700 ${Math.round(24 * u)}px ${FONT}`;
    ctx.fillText(ROLE_LABELS[scene.role].toUpperCase(), textX, textTop);
    ctx.fillStyle = accentGradient(ctx, textX, 0, 80 * u, accent);
    ctx.fillRect(textX, textTop + 14 * u, 72 * u * tagAppear, 4 * u);

    const titleSize = Math.round((stacked ? 74 : 82) * u);
    ctx.font = `800 ${titleSize}px ${FONT}`;
    let ty = textTop + 66 * u;
    const lastLine = visual.titleLines.length - 1;
    visual.titleLines.forEach((line, i) => {
      const lp = easeOutCubic(clamp((local - 0.12 - i * 0.12) / 0.5));
      ctx.globalAlpha = exit * lp;
      // Dernière ligne surlignée en dégradé accent (typo cinétique).
      ctx.fillStyle =
        i === lastLine
          ? accentGradient(ctx, textX, 0, ctx.measureText(line).width || 300 * u, accent)
          : THEME.textHi;
      ctx.fillText(line, textX, ty + (1 - lp) * 28 * u);
      ty += titleSize * 1.1;
    });

    ctx.fillStyle = THEME.textLo;
    const descSize = Math.round(33 * u);
    ctx.font = `400 ${descSize}px ${FONT}`;
    let dy = ty + 16 * u;
    visual.descLines.forEach((line, i) => {
      const lp = easeOutCubic(clamp((local - 0.5 - i * 0.1) / 0.5));
      ctx.globalAlpha = exit * lp;
      ctx.fillText(line, textX, dy);
      dy += descSize * 1.4;
    });
    ctx.restore();

    // Visuel
    let vx: number, vy: number, vw: number, vh: number;
    if (stacked) {
      vw = w - margin * 2;
      vh = h * 0.32;
      vx = margin;
      vy = h * 0.46;
    } else {
      vw = w * 0.44;
      vh = h * 0.56;
      vx = w - vw - margin;
      vy = h * 0.22;
    }
    ctx.save();
    ctx.globalAlpha = exit;
    if (visual.mode === "float") drawFloating(ctx, visual, vx, vy, vw, vh, time, local, u, accent);
    else if (visual.mode === "spotlight")
      drawSpotlight(ctx, visual, vx, vy, vw, vh, time, local, u, accent);
    else if (visual.mode === "stats") {
      ctx.save();
      ctx.shadowColor = hexA(accent.a1, 0.3);
      ctx.shadowBlur = 40 * u;
      ctx.fillStyle = THEME.card;
      roundRect(ctx, vx, vy, vw, vh, 18 * u);
      ctx.fill();
      ctx.restore();
      drawStats(ctx, vx + 40 * u, vy + 46 * u, vw - 80 * u, vh - 92 * u, local, u, accent);
    } else drawFloating(ctx, visual, vx, vy, vw, vh, time, local, u, accent);
    ctx.restore();
  }

  if (visual.subtitleLines.length > 0) {
    drawSubtitle(ctx, visual.subtitleLines, exit, w, h, u, margin, accent);
  }
  drawProgressBar(ctx, time, totalSeconds, w, h, u, margin, accent);

  // Balayage accent à l'entrée de scène
  if (visual.start > 0 && local < 0.4) {
    const p = easeInOutCubic(clamp(local / 0.4));
    ctx.save();
    ctx.globalAlpha = (1 - p) * 0.85;
    ctx.fillStyle = accentGradient(ctx, w * (p - 0.12), 0, w * 0.12, accent);
    ctx.fillRect(w * (p - 0.12), 0, w * 0.14, h);
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
  const { u, project, accent } = pre;
  const cx = margin;
  const cy = h * 0.44;

  const p0 = easeOutCubic(clamp(local / 0.5));
  ctx.globalAlpha = p0;
  ctx.fillStyle = accent.a1;
  ctx.font = `700 ${Math.round(26 * u)}px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillText("DÉMO PRODUIT", cx, cy - 64 * u);

  const p1 = easeOutBack(clamp((local - 0.15) / 0.7));
  ctx.save();
  ctx.globalAlpha = clamp((local - 0.15) / 0.4);
  const nameSize = Math.round(132 * u);
  ctx.font = `800 ${nameSize}px ${FONT}`;
  ctx.translate(cx, cy + 40 * u);
  ctx.scale(lerp(0.9, 1, p1), lerp(0.9, 1, p1));
  ctx.fillStyle = accentGradient(
    ctx,
    0,
    0,
    ctx.measureText(project.productName).width || 400 * u,
    accent
  );
  ctx.fillText(project.productName, 0, 0);
  ctx.restore();

  const p2 = easeInOutCubic(clamp((local - 0.6) / 0.6));
  ctx.globalAlpha = 1;
  ctx.fillStyle = accentGradient(ctx, cx, 0, 460 * u, accent);
  ctx.fillRect(cx, cy + 78 * u, 460 * u * p2, 6 * u);

  const p3 = clamp((local - 0.9) / 0.6);
  ctx.fillStyle = THEME.textLo;
  ctx.font = `400 ${Math.round(38 * u)}px ${FONT}`;
  let dy = cy + 148 * u;
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
  const { u, project, accent } = pre;
  const p0 = easeInOutCubic(clamp(local / 0.5));
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, accent.a1);
  g.addColorStop(1, accent.a2);
  ctx.save();
  ctx.globalAlpha = p0;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // léger voile sombre pour le contraste du texte
  ctx.fillStyle = "rgba(7,7,13,0.18)";
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  ctx.textAlign = "center";
  const cx = w / 2;

  const p1 = easeOutCubic(clamp((local - 0.2) / 0.5));
  ctx.globalAlpha = p1;
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = `700 ${Math.round(28 * u)}px ${FONT}`;
  ctx.fillText(project.productName.toUpperCase(), cx, h * 0.34);

  const ctaSize = Math.round(70 * u);
  ctx.font = `800 ${ctaSize}px ${FONT}`;
  ctx.fillStyle = "#FFFFFF";
  const lines = visual.titleLines.length
    ? visual.titleLines
    : [visual.scene.voiceOver.trim() || "Passez à l'action."];
  let ty = h * 0.44;
  lines.forEach((line, i) => {
    const lp = clamp((local - 0.35 - i * 0.12) / 0.5);
    ctx.globalAlpha = lp;
    ctx.fillText(line, cx, ty + (1 - easeOutCubic(lp)) * 24 * u);
    ty += ctaSize * 1.15;
  });

  const p3 = easeOutBack(clamp((local - 0.6) / 0.6));
  ctx.globalAlpha = clamp((local - 0.6) / 0.4);
  const pulse = 1 + Math.sin(time * 3) * 0.02;
  const btnW = 400 * u * p3 * pulse;
  const btnH = 96 * u * p3 * pulse;
  const bx = cx - btnW / 2;
  const by = ty + 26 * u;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 30 * u;
  ctx.shadowOffsetY = 14 * u;
  ctx.fillStyle = "#0B0B12";
  roundRect(ctx, bx, by, btnW, btnH, btnH / 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 ${Math.round(30 * u)}px ${FONT}`;
  ctx.textBaseline = "middle";
  ctx.fillText("Essayer maintenant", cx, by + btnH / 2);
  ctx.textBaseline = "alphabetic";
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}

function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  alpha: number,
  w: number,
  h: number,
  u: number,
  margin: number,
  accent: { a1: string; a2: string }
) {
  const lineHeight = 46 * u;
  const padY = 22 * u;
  const boxH = lines.length * lineHeight + padY * 2;
  const boxBottom = h - 92 * u;
  const boxTop = boxBottom - boxH;
  const boxW = w - margin * 2;

  ctx.save();
  ctx.globalAlpha = alpha * 0.9;
  ctx.fillStyle = "rgba(10,10,18,0.7)";
  roundRect(ctx, margin, boxTop, boxW, boxH, 16 * u);
  ctx.fill();
  ctx.strokeStyle = hexA(accent.a1, 0.4 * alpha);
  ctx.lineWidth = 1.5 * u;
  roundRect(ctx, margin, boxTop, boxW, boxH, 16 * u);
  ctx.stroke();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `500 ${Math.round(32 * u)}px ${FONT}`;
  ctx.textAlign = "center";
  let sy = boxTop + padY + lineHeight * 0.72;
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
  margin: number,
  accent: { a1: string; a2: string }
) {
  const barY = h - 46 * u;
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  roundRect(ctx, margin, barY, w - margin * 2, 5 * u, 3 * u);
  ctx.fill();
  ctx.fillStyle = accentGradient(ctx, margin, 0, w - margin * 2, accent);
  roundRect(ctx, margin, barY, (w - margin * 2) * clamp(time / total), 5 * u, 3 * u);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = `400 ${Math.round(20 * u)}px ${FONT}`;
  ctx.textAlign = "right";
  ctx.fillText("Studio One", w - margin, h - 24 * u);
  ctx.textAlign = "left";
}
