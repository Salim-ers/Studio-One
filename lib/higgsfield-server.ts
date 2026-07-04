/**
 * Utilitaires serveur Higgsfield. Les identifiants restent côté serveur.
 * Accepte HF_CREDENTIALS ("KEY_ID:KEY_SECRET"), ou HF_API_KEY + HF_API_SECRET
 * (ou l'ancien HF_SECRET).
 */
export function resolveHiggsfieldCredentials(): string | null {
  if (process.env.HF_CREDENTIALS) return process.env.HF_CREDENTIALS;
  const key = process.env.HF_API_KEY;
  const secret = process.env.HF_API_SECRET || process.env.HF_SECRET;
  if (key && secret) return `${key}:${secret}`;
  return null;
}
