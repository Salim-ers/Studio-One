export type BillingMode = "per_video" | "subscription";

export interface Plan {
  id: string;
  name: string;
  tagline: string;
  price: number;
  currency: "EUR";
  mode: BillingMode;
  duration?: 60 | 90 | 120;
  videosPerMonth?: number;
  features: string[];
  highlighted?: boolean;
  priceEnvKey: string;
}

export interface Invoice {
  id: string;
  date: string;
  label: string;
  amount: number;
  status: "paid" | "open";
}

export interface SubscriptionState {
  planId: string;
  planName: string;
  status: "active" | "canceled" | "past_due";
  renewsAt: string;
  creditsTotal: number;
  creditsUsed: number;
}
