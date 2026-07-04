/** Capture des écrans du SaaS via login (route serveur). Identifiants non stockés. */

async function downscaleDataUrl(dataUrl: string, maxDim = 1400): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function captureSaasScreens(input: {
  url: string;
  email: string;
  password: string;
  pages?: string[];
}): Promise<string[]> {
  const res = await fetch("/api/capture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    let message = `Capture impossible (${res.status}).`;
    try {
      const data = await res.json();
      if (data.error) message = data.error;
      if (data.detail) message += ` — ${data.detail}`;
    } catch {
      /* non JSON */
    }
    throw new Error(message);
  }
  const data = (await res.json()) as { screenshots: string[] };
  const shots = data.screenshots ?? [];
  // Réduites côté client pour tenir dans le stockage local et l'encodeur.
  return Promise.all(shots.map((s) => downscaleDataUrl(s)));
}
