/**
 * Décode un clip Higgsfield en une série d'images (ImageBitmap) réutilisables
 * comme fond animé de la vidéo. On échantillonne le clip en amont (par seek)
 * puis on dessine les frames en boucle pendant l'encodage — robuste et rapide,
 * indépendant du chemin d'export (WebCodecs ou MediaRecorder).
 */

export interface ClipFrames {
  frames: ImageBitmap[];
  fps: number;
  aspect: number;
}

function seekTo(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      video.removeEventListener("seeked", finish);
      resolve();
    };
    video.addEventListener("seeked", finish, { once: true });
    // Garde-fou : si "seeked" ne vient pas, on continue quand même.
    setTimeout(finish, 400);
    try {
      video.currentTime = t;
    } catch {
      finish();
    }
  });
}

/** Charge et échantillonne le clip. Retourne null si indisponible (repli propre). */
export async function loadClipFrames(
  sameOriginUrl: string,
  { fps = 12, maxFrames = 72 }: { fps?: number; maxFrames?: number } = {}
): Promise<ClipFrames | null> {
  if (typeof document === "undefined") return null;
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = sameOriginUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      const onMeta = () => resolve();
      video.addEventListener("loadedmetadata", onMeta, { once: true });
      video.addEventListener("error", () => reject(new Error("clip")), { once: true });
      setTimeout(() => reject(new Error("timeout")), 15_000);
    });
    // Certains navigateurs exigent des données décodées avant createImageBitmap.
    await new Promise<void>((resolve) => {
      if (video.readyState >= 2) return resolve();
      video.addEventListener("loadeddata", () => resolve(), { once: true });
      setTimeout(resolve, 3_000);
    });

    const duration = Number.isFinite(video.duration) && video.duration > 0
      ? video.duration
      : 5;
    const count = Math.min(maxFrames, Math.max(8, Math.round(duration * fps)));
    const frames: ImageBitmap[] = [];
    for (let i = 0; i < count; i++) {
      await seekTo(video, (i / count) * duration);
      try {
        frames.push(await createImageBitmap(video));
      } catch {
        // frame illisible : on ignore
      }
    }
    if (frames.length === 0) return null;
    const aspect =
      (video.videoWidth || 16) / (video.videoHeight || 9) || 16 / 9;
    return { frames, fps, aspect };
  } catch {
    return null;
  } finally {
    video.removeAttribute("src");
    try {
      video.load();
    } catch {
      /* ignore */
    }
  }
}
