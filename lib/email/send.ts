import { getResend, EMAIL_FROM } from "./client";
import {
  verificationEmailHtml,
  verificationEmailText,
  loginEmailHtml,
  loginEmailText,
  digestEmailHtml,
  digestEmailText,
} from "./templates";

type Alert = {
  id: string;
  hazards: string[];
  countries: string[];
  product_category: string | null;
  product_text: string | null;
  alert_date: string | null;
  link: string | null;
};

export async function sendVerificationEmail(
  to: string,
  verifyUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to,
      subject: "Verify your FoodRisk Watch subscription",
      html: verificationEmailHtml(verifyUrl),
      text: verificationEmailText(verifyUrl),
    });

    if (error) {
      console.error("[Email] Failed to send verification email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[Email] Exception sending verification email:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function sendLoginEmail(
  to: string,
  manageUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to,
      subject: "Manage your FoodRisk Watch preferences",
      html: loginEmailHtml(manageUrl),
      text: loginEmailText(manageUrl),
    });

    if (error) {
      console.error("[Email] Failed to send login email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[Email] Exception sending login email:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function sendDigestEmail(
  to: string,
  alerts: Alert[],
  manageToken: string
): Promise<{ success: boolean; error?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const manageUrl = `${baseUrl}/preferences?token=${encodeURIComponent(manageToken)}`;
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(manageToken)}`;

  try {
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to,
      subject: `FoodRisk Watch: ${alerts.length} alert${alerts.length === 1 ? "" : "s"} this week`,
      html: digestEmailHtml(alerts, manageUrl, unsubscribeUrl, baseUrl),
      text: digestEmailText(alerts, manageUrl, unsubscribeUrl, baseUrl),
      headers: {
        "X-Entity-Ref-ID": `digest-${Date.now()}`,
      },
    });

    if (error) {
      console.error("[Email] Failed to send digest email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[Email] Exception sending digest email:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
