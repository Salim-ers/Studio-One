/**
 * Jetons de session signés HMAC-SHA256 via Web Crypto :
 * fonctionne dans le runtime Node (routes API, pages serveur)
 * comme dans le runtime Edge (middleware).
 */

export const SESSION_COOKIE = "studio_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();

function getSecret(): string {
  // `||` et non `??` : AUTH_SECRET= vide (copié de .env.example) doit
  // retomber sur la valeur de développement, pas produire une clé vide.
  return process.env.AUTH_SECRET || "studio-one-dev-secret-change-me";
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> | null {
  try {
    const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

async function getHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(email: string): Promise<string> {
  const payload = toBase64Url(
    encoder.encode(JSON.stringify({ email, exp: Date.now() + SESSION_TTL_MS }))
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getHmacKey(),
    encoder.encode(payload)
  );
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

/** Retourne l'email de session si le jeton est valide et non expiré, sinon null. */
export async function verifySessionToken(
  token: string | undefined
): Promise<string | null> {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const signatureBytes = fromBase64Url(signature);
  if (!signatureBytes) return null;

  const valid = await crypto.subtle.verify(
    "HMAC",
    await getHmacKey(),
    signatureBytes,
    encoder.encode(payload)
  );
  if (!valid) return null;

  const payloadBytes = fromBase64Url(payload);
  if (!payloadBytes) return null;

  try {
    const data = JSON.parse(new TextDecoder().decode(payloadBytes)) as {
      email?: string;
      exp?: number;
    };
    if (!data.email || !data.exp || data.exp < Date.now()) return null;
    return data.email;
  } catch {
    return null;
  }
}
