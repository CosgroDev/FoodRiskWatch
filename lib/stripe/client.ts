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

export const FREQUENCY_FROM_PRICE: Record<string, "weekly" | "daily"> = {};

// Build reverse lookup when prices are loaded
if (PRICE_IDS.weekly) FREQUENCY_FROM_PRICE[PRICE_IDS.weekly] = "weekly";
if (PRICE_IDS.daily) FREQUENCY_FROM_PRICE[PRICE_IDS.daily] = "daily";
