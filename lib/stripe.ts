import Stripe from "stripe";

/**
 * Client Stripe côté serveur.
 * Retourne null si la clé n'est pas configurée, pour que l'application
 * reste utilisable en développement sans compte Stripe.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2024-06-20" });
}

const priceEnvMap: Record<string, string | undefined> = {
  "essential-60": process.env.STRIPE_PRICE_60,
  "pro-90": process.env.STRIPE_PRICE_90,
  "studio-120": process.env.STRIPE_PRICE_120,
  starter: process.env.STRIPE_PRICE_STARTER,
  growth: process.env.STRIPE_PRICE_GROWTH,
  agency: process.env.STRIPE_PRICE_AGENCY,
};

export function getPriceId(planId: string): string | undefined {
  return priceEnvMap[planId];
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
