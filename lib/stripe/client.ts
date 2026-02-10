import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeClient = new Stripe(key, {
      apiVersion: "2026-01-28.clover",
    });
  }
  return stripeClient;
}

// Price IDs from Stripe Dashboard - these need to be set in environment variables
export const PRICE_IDS = {
  weekly: process.env.STRIPE_PRICE_WEEKLY || "",
  daily: process.env.STRIPE_PRICE_DAILY || "",
};

// Dynamic lookup to avoid cold start issues with environment variables
export function getFrequencyFromPrice(priceId: string): "weekly" | "daily" | undefined {
  const weeklyPriceId = process.env.STRIPE_PRICE_WEEKLY;
  const dailyPriceId = process.env.STRIPE_PRICE_DAILY;

  if (priceId === weeklyPriceId) return "weekly";
  if (priceId === dailyPriceId) return "daily";
  return undefined;
}
