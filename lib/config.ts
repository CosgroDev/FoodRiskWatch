/**
 * Get the base URL for the application.
 * Always uses the production domain when NEXT_PUBLIC_APP_URL is set.
 * Falls back to VERCEL_URL for preview deployments, then localhost for development.
 */
export function getAppBaseUrl(): string {
  // Production domain - always prefer this
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Vercel preview deployments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Local development
  return "http://localhost:3000";
}
