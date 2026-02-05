import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";
import { renderDigestEmail, type AlertItem } from "../../../lib/email/digest-template";

export const dynamic = "force-dynamic";

type FilterRule = {
  rule_type: string;
  rule_value: string;
};

type AlertFact = {
  id: string;
  hazard: string | null;
  product_category: string | null;
  product_text: string | null;
  origin_country: string | null;
  notifying_country: string | null;
  alert_date: string | null;
  link: string | null;
};

// Validate manage token and get user info
async function validateToken(sb: ReturnType<typeof supabaseServer>, token: string) {
  const { data, error } = await sb
    .from("email_tokens")
    .select("user_id, purpose, expires_at")
    .eq("token", token)
    .single();

  if (error || !data || data.purpose !== "manage") {
    return { error: "Invalid token" };
  }
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { error: "Token expired" };
  }
  return { userId: data.user_id };
}

// Get user's email
async function getUserEmail(sb: ReturnType<typeof supabaseServer>, userId: string) {
  const { data } = await sb.from("users").select("email").eq("id", userId).single();
  return data?.email || "unknown@example.com";
}

// Get user's subscription and filter preferences
async function getUserPreferences(sb: ReturnType<typeof supabaseServer>, userId: string) {
  // Get subscription
  const { data: subscription } = await sb
    .from("subscriptions")
    .select("id, frequency")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!subscription) {
    return { frequency: "weekly" as const, filters: { hazards: [], categories: [], countries: [] } };
  }

  // Get filter
  const { data: filter } = await sb
    .from("filters")
    .select("id")
    .eq("subscription_id", subscription.id)
    .limit(1)
    .maybeSingle();

  if (!filter) {
    return { frequency: subscription.frequency || "weekly", filters: { hazards: [], categories: [], countries: [] } };
  }

  // Get filter rules
  const { data: rules } = await sb
    .from("filter_rules")
    .select("rule_type, rule_value")
    .eq("filter_id", filter.id);

  const filterRules = rules || [];

  return {
    frequency: subscription.frequency || "weekly",
    filters: {
      hazards: filterRules.filter((r: FilterRule) => r.rule_type === "hazard").map((r: FilterRule) => r.rule_value),
      categories: filterRules.filter((r: FilterRule) => r.rule_type === "category").map((r: FilterRule) => r.rule_value),
      countries: filterRules.filter((r: FilterRule) => r.rule_type === "country").map((r: FilterRule) => r.rule_value),
    },
  };
}

// Query alerts from database that match user's filters
async function getMatchingAlerts(
  sb: ReturnType<typeof supabaseServer>,
  filters: { hazards: string[]; categories: string[]; countries: string[] },
  limit: number = 20
): Promise<AlertItem[]> {
  // Start with base query for recent alerts (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  let query = sb
    .from("alerts_fact")
    .select("id, hazard, product_category, product_text, origin_country, notifying_country, alert_date, link")
    .gte("alert_date", thirtyDaysAgo)
    .order("alert_date", { ascending: false })
    .limit(limit * 3); // Fetch more to filter down

  const { data: alerts, error } = await query;

  if (error) {
    console.error("Error fetching alerts:", error);
    return [];
  }

  if (!alerts || alerts.length === 0) {
    return [];
  }

  // Filter alerts based on user preferences
  // If user has no filters set, return all alerts
  const hasFilters =
    filters.hazards.length > 0 || filters.categories.length > 0 || filters.countries.length > 0;

  let filteredAlerts = alerts as AlertFact[];

  if (hasFilters) {
    filteredAlerts = alerts.filter((alert: AlertFact) => {
      // Check hazard match (case-insensitive partial match)
      const hazardMatch =
        filters.hazards.length === 0 ||
        filters.hazards.some(
          (h) => alert.hazard && alert.hazard.toLowerCase().includes(h.toLowerCase())
        );

      // Check category match
      const categoryMatch =
        filters.categories.length === 0 ||
        filters.categories.some(
          (c) => alert.product_category && alert.product_category.toLowerCase().includes(c.toLowerCase())
        );

      // Check country match (origin or notifying)
      const countryMatch =
        filters.countries.length === 0 ||
        filters.countries.some(
          (c) =>
            (alert.origin_country && alert.origin_country.toLowerCase().includes(c.toLowerCase())) ||
            (alert.notifying_country && alert.notifying_country.toLowerCase().includes(c.toLowerCase()))
        );

      // Alert matches if ANY of the filter categories match (OR logic within categories)
      // but ALL specified filter categories must have at least one match (AND logic across categories)
      return hazardMatch && categoryMatch && countryMatch;
    });
  }

  // Convert to AlertItem format
  return filteredAlerts.slice(0, limit).map((alert: AlertFact) => ({
    hazard: alert.hazard || "Unknown",
    product_category: alert.product_category,
    product_text: alert.product_text,
    origin_country: alert.origin_country,
    notifying_country: alert.notifying_country,
    alert_date: alert.alert_date,
    link: alert.link,
  }));
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const format = url.searchParams.get("format") || "html";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "15", 10), 50);

  if (!token) {
    return NextResponse.json(
      {
        error: "Token required",
        usage: "GET /api/digest-preview?token=YOUR_MANAGE_TOKEN",
        hint: "Get a manage token by subscribing at / and checking the response",
      },
      { status: 400 }
    );
  }

  let sb;
  try {
    sb = supabaseServer();
  } catch {
    return NextResponse.json(
      { error: "Database not configured. Set SUPABASE env vars." },
      { status: 500 }
    );
  }

  // Validate token
  const validation = await validateToken(sb, token);
  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Get user info and preferences
  const [email, preferences] = await Promise.all([
    getUserEmail(sb, validation.userId),
    getUserPreferences(sb, validation.userId),
  ]);

  // Get matching alerts from database
  const alerts = await getMatchingAlerts(sb, preferences.filters, limit);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Return JSON if requested
  if (format === "json") {
    return NextResponse.json({
      user: {
        email,
        userId: validation.userId,
      },
      preferences: {
        frequency: preferences.frequency,
        filters: preferences.filters,
      },
      alerts: {
        count: alerts.length,
        items: alerts,
      },
      dateRange: {
        start: weekAgo.toISOString(),
        end: now.toISOString(),
      },
    });
  }

  // Render personalized email
  const html = renderDigestEmail({
    recipientEmail: email,
    alerts,
    dateRange: {
      start: weekAgo.toISOString(),
      end: now.toISOString(),
    },
    manageUrl: `${url.origin}/preferences?token=${token}`,
    unsubscribeUrl: `${url.origin}/api/unsubscribe?token=${token}`,
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
