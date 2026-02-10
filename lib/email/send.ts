import { getResend, EMAIL_FROM } from "./client";
import {
  verificationEmailHtml,
  verificationEmailText,
  loginEmailHtml,
  loginEmailText,
  digestEmailHtml,
  digestEmailText,
  welcomeDigestEmailHtml,
  welcomeDigestEmailText,
} from "./templates";
import { supabaseServer } from "../supabase/server";
import { getAppBaseUrl } from "../config";

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
  const baseUrl = getAppBaseUrl();

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

type AlertFactRow = {
  id: string;
  raw_id: string | null;
  hazard: string | null;
  product_category: string | null;
  origin_country: string | null;
  product_text: string | null;
  alert_date: string | null;
  link: string | null;
};

function aggregateAlerts(rows: AlertFactRow[]): Alert[] {
  const grouped = new Map<string, AlertFactRow[]>();

  for (const row of rows) {
    const key = row.raw_id || row.id;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(row);
  }

  const aggregated: Alert[] = [];

  const entries = Array.from(grouped.entries());
  for (let i = 0; i < entries.length; i++) {
    const [, alertRows] = entries[i];
    const first = alertRows[0];
    const hazards = Array.from(new Set(alertRows.map(r => r.hazard).filter((h): h is string => !!h && h !== "Unknown")));
    const countries = Array.from(new Set(alertRows.map(r => r.origin_country).filter((c): c is string => !!c && c !== "Unknown")));

    aggregated.push({
      id: first.id,
      hazards: hazards.length > 0 ? hazards : ["Unknown"],
      countries: countries.length > 0 ? countries : ["Unknown"],
      product_category: first.product_category,
      product_text: first.product_text,
      alert_date: first.alert_date,
      link: first.link,
    });
  }

  return aggregated;
}

export async function sendWelcomeDigestEmail(
  to: string,
  subscriptionId: string,
  baseUrl: string,
  sb: ReturnType<typeof supabaseServer>
): Promise<{ success: boolean; error?: string }> {
  // Get manage token for this subscription's user
  const { data: subscription } = await sb
    .from("subscriptions")
    .select("user_id")
    .eq("id", subscriptionId)
    .single();

  if (!subscription) {
    return { success: false, error: "Subscription not found" };
  }

  const { data: tokenRow } = await sb
    .from("email_tokens")
    .select("token")
    .eq("user_id", subscription.user_id)
    .eq("purpose", "manage")
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const manageToken = tokenRow?.token || "";
  const manageUrl = `${baseUrl}/preferences?token=${encodeURIComponent(manageToken)}`;
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(manageToken)}`;

  // Get alerts from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: alertRows } = await sb
    .from("alerts_fact")
    .select("id, raw_id, hazard, product_category, origin_country, product_text, alert_date, link")
    .gte("alert_date", thirtyDaysAgo.toISOString())
    .order("alert_date", { ascending: false })
    .limit(50)
    .returns<AlertFactRow[]>();

  if (!alertRows || alertRows.length === 0) {
    // No alerts to send
    return { success: true };
  }

  const alerts = aggregateAlerts(alertRows);

  try {
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Welcome to FoodRisk Watch! Here's what you've been missing`,
      html: welcomeDigestEmailHtml(alerts, manageUrl, unsubscribeUrl, baseUrl),
      text: welcomeDigestEmailText(alerts, manageUrl, unsubscribeUrl, baseUrl),
      headers: {
        "X-Entity-Ref-ID": `welcome-${Date.now()}`,
      },
    });

    if (error) {
      console.error("[Email] Failed to send welcome digest:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[Email] Exception sending welcome digest:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
