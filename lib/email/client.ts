import { Resend } from "resend";

// Lazy initialization to avoid build-time errors when API key is not set
let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

export const EMAIL_FROM = process.env.EMAIL_FROM || "FoodRisk Watch <alerts@foodriskwatch.com>";
