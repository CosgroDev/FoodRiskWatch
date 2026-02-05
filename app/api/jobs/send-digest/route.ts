import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase/server";
import { renderDigestEmail, type AlertItem } from "../../../../lib/email/digest-template";
import { sendEmail } from "../../../../lib/email/resend";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max for Vercel

// Base URL for links in emails
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://foodriskwatch-app.vercel.app";

type SubscriptionRow = {
  id: string;
  user_id: string;
  frequency: "instant" | "daily" | "weekly";
  is_active: boolean;
  last_digest_at: string | null;
  users: { id: string; email: string }[] | { id: string; email: string } | null;
};

type FilterRule = {
  rule_type: string;
  rule_value: string;
};

type AlertFact = {
  id: string;
  hazard: string | null;
  hazard_category: string | null;
  product_category: string | null;
  product_text: string | null;
  origin_country: string | null;
  notifying_country: string | null;
  alert_date: string | null;
  risk_level: string | null;
};

// Check if a subscription is due for a digest
function isDueForDigest(subscription: SubscriptionRow): boolean {
  const { frequency, last_digest_at } = subscription;
  const now = new Date();

  if (!last_digest_at) {
    // Never sent, always due
    return true;
  }

  const lastSent = new Date(last_digest_at);
  const hoursSinceLastSent = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

  switch (frequency) {
    case "instant":
      // Instant: send if there are new alerts since last digest
      return true; // Will check for new alerts later
    case "daily":
      return hoursSinceLastSent >= 24;
    case "weekly":
      return hoursSinceLastSent >= 168; // 7 days
    default:
      return hoursSinceLastSent >= 168;
  }
}

// Get user's filter preferences
async function getUserFilters(
  sb: ReturnType<typeof supabaseServer>,
  subscriptionId: string
): Promise<{ hazards: string[]; categories: string[]; countries: string[] }> {
  const { data: filter } = await sb
    .from("filters")
    .select("id")
    .eq("subscription_id", subscriptionId)
    .limit(1)
    .maybeSingle();

  if (!filter) {
    return { hazards: [], categories: [], countries: [] };
  }

  const { data: rules } = await sb
    .from("filter_rules")
    .select("rule_type, rule_value")
    .eq("filter_id", filter.id);

  const filterRules = (rules || []) as FilterRule[];

  return {
    hazards: filterRules.filter((r) => r.rule_type === "hazard").map((r) => r.rule_value),
    categories: filterRules.filter((r) => r.rule_type === "category").map((r) => r.rule_value),
    countries: filterRules.filter((r) => r.rule_type === "country").map((r) => r.rule_value),
  };
}

// Get matching alerts for a user
async function getMatchingAlerts(
  sb: ReturnType<typeof supabaseServer>,
  filters: { hazards: string[]; categories: string[]; countries: string[] },
  since: Date | null,
  limit: number = 20
): Promise<AlertItem[]> {
  // Query alerts from the appropriate time range
  const sinceDate = since || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  let query = sb
    .from("alerts_fact")
    .select("id, hazard, hazard_category, product_category, product_text, origin_country, notifying_country, alert_date, risk_level")
    .gte("alert_date", sinceDate.toISOString())
    .order("alert_date", { ascending: false })
    .limit(limit * 3);

  const { data: alerts, error } = await query;

  if (error || !alerts) {
    console.error("Error fetching alerts:", error);
    return [];
  }

  // Filter based on user preferences
  const hasFilters =
    filters.hazards.length > 0 || filters.categories.length > 0 || filters.countries.length > 0;

  let filteredAlerts = alerts as AlertFact[];

  if (hasFilters) {
    filteredAlerts = alerts.filter((alert: AlertFact) => {
      const hazardMatch =
        filters.hazards.length === 0 ||
        filters.hazards.some(
          (h) => alert.hazard && alert.hazard.toLowerCase().includes(h.toLowerCase())
        );

      const categoryMatch =
        filters.categories.length === 0 ||
        filters.categories.some(
          (c) => alert.product_category && alert.product_category.toLowerCase().includes(c.toLowerCase())
        );

      const countryMatch =
        filters.countries.length === 0 ||
        filters.countries.some(
          (c) =>
            (alert.origin_country && alert.origin_country.toLowerCase().includes(c.toLowerCase())) ||
            (alert.notifying_country && alert.notifying_country.toLowerCase().includes(c.toLowerCase()))
        );

      return hazardMatch && categoryMatch && countryMatch;
    });
  }

  return filteredAlerts.slice(0, limit).map((alert: AlertFact) => ({
    id: alert.id,
    hazard: alert.hazard || "Unknown",
    hazard_category: alert.hazard_category,
    product_category: alert.product_category,
    product_text: alert.product_text,
    origin_country: alert.origin_country,
    notifying_country: alert.notifying_country,
    alert_date: alert.alert_date,
    risk_level: alert.risk_level,
  }));
}

// Generate or get existing manage token for user
async function getManageToken(
  sb: ReturnType<typeof supabaseServer>,
  userId: string
): Promise<string> {
  // Check for existing valid token
  const { data: existing } = await sb
    .from("email_tokens")
    .select("token")
    .eq("user_id", userId)
    .eq("purpose", "manage")
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();

  if (existing?.token) {
    return existing.token;
  }

  // Create new token (valid for 30 days)
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await sb.from("email_tokens").insert({
    user_id: userId,
    token,
    purpose: "manage",
    expires_at: expiresAt.toISOString(),
  });

  return token;
}

export async function POST(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_DIGEST_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let sb;
  try {
    sb = supabaseServer();
  } catch {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  // Get all active subscriptions with user emails
  const { data: subscriptions, error: subError } = await sb
    .from("subscriptions")
    .select("id, user_id, frequency, is_active, last_digest_at, users(id, email)")
    .eq("is_active", true);

  if (subError) {
    console.error("Error fetching subscriptions:", subError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ message: "No active subscriptions", sent: 0 });
  }

  const results = {
    processed: 0,
    sent: 0,
    skipped: 0,
    errors: [] as string[],
  };

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const sub of subscriptions as SubscriptionRow[]) {
    results.processed++;

    // Handle users being an array or single object
    const userObj = Array.isArray(sub.users) ? sub.users[0] : sub.users;

    // Skip if no user email
    if (!userObj?.email) {
      results.skipped++;
      continue;
    }

    const userEmail = userObj.email;

    // Check if due for digest
    if (!isDueForDigest(sub)) {
      results.skipped++;
      continue;
    }

    // Get user's filters
    const filters = await getUserFilters(sb, sub.id);

    // Determine time range based on frequency
    const sinceDate = sub.last_digest_at ? new Date(sub.last_digest_at) : weekAgo;

    // Get matching alerts
    const alerts = await getMatchingAlerts(sb, filters, sinceDate);

    // Skip if no alerts to send
    if (alerts.length === 0) {
      results.skipped++;
      continue;
    }

    // Get manage token for unsubscribe/preferences links
    const manageToken = await getManageToken(sb, sub.user_id);

    // Render email
    const html = renderDigestEmail({
      recipientEmail: userEmail,
      alerts,
      dateRange: {
        start: sinceDate.toISOString(),
        end: now.toISOString(),
      },
      manageUrl: `${BASE_URL}/preferences?token=${manageToken}`,
      unsubscribeUrl: `${BASE_URL}/api/unsubscribe?token=${manageToken}`,
      baseUrl: BASE_URL,
    });

    // Determine subject based on frequency and alert count
    const subjectPrefix = sub.frequency === "instant" ? "New Alert" :
                          sub.frequency === "daily" ? "Daily Digest" : "Weekly Digest";
    const subject = `${subjectPrefix}: ${alerts.length} Food Safety Alert${alerts.length !== 1 ? "s" : ""}`;

    // Send email
    const result = await sendEmail({
      to: userEmail,
      subject,
      html,
    });

    if (result.success) {
      results.sent++;

      // Update last_digest_at
      await sb
        .from("subscriptions")
        .update({ last_digest_at: now.toISOString() })
        .eq("id", sub.id);
    } else {
      results.errors.push(`${userEmail}: ${result.error}`);
    }
  }

  return NextResponse.json({
    ok: true,
    ...results,
  });
}

// Also support GET for manual testing (with secret in query param)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");

  if (!secret || secret !== process.env.CRON_DIGEST_SECRET) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        usage: "POST /api/jobs/send-digest with x-cron-secret header, or GET with ?secret=YOUR_SECRET",
      },
      { status: 401 }
    );
  }

  // Create a mock request with the secret in headers
  const mockReq = new NextRequest(req.url, {
    method: "POST",
    headers: { "x-cron-secret": secret },
  });

  return POST(mockReq);
}
