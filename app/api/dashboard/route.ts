import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

async function validateDashboardToken(sb: ReturnType<typeof supabaseServer>, token?: string) {
  if (!token) return { error: "Missing token" as const };

  const { data, error } = await sb
    .from("email_tokens")
    .select("user_id, purpose, expires_at")
    .eq("token", token)
    .single();

  if (error || !data || data.purpose !== "manage") {
    return { error: "Invalid token" as const };
  }

  // Check token expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { error: "Token expired. Please request a new link from the homepage." as const };
  }

  return { userId: data.user_id };
}

async function getSubscription(sb: ReturnType<typeof supabaseServer>, userId: string) {
  const { data } = await sb
    .from("subscriptions")
    .select("id, frequency, stripe_status")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  return data;
}

async function getUserCategories(sb: ReturnType<typeof supabaseServer>, subscriptionId: string) {
  const { data: filter } = await sb
    .from("filters")
    .select("id")
    .eq("subscription_id", subscriptionId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!filter) return [];

  const { data: rules } = await sb
    .from("filter_rules")
    .select("rule_value")
    .eq("filter_id", filter.id)
    .eq("rule_type", "category");

  return (rules || []).map(r => r.rule_value);
}

type DashboardQuery = {
  days: number;
  categories?: string[];
  hazards?: string[];
  origins?: string[];
};

async function getDashboardData(sb: ReturnType<typeof supabaseServer>, query: DashboardQuery) {
  const startDate = new Date();
  startDate.setUTCHours(0, 0, 0, 0);
  startDate.setUTCDate(startDate.getUTCDate() - query.days);

  // Base query for alerts
  let alertsQuery = sb
    .from("alerts_fact")
    .select("id, hazard, product_category, origin_country, alert_date, product_text, link, raw_id")
    .gte("alert_date", startDate.toISOString())
    .order("alert_date", { ascending: false });

  // Apply category filter if provided
  if (query.categories && query.categories.length > 0) {
    alertsQuery = alertsQuery.in("product_category", query.categories);
  }

  // Apply hazard filter if provided
  if (query.hazards && query.hazards.length > 0) {
    alertsQuery = alertsQuery.in("hazard", query.hazards);
  }

  // Apply origin filter if provided
  if (query.origins && query.origins.length > 0) {
    alertsQuery = alertsQuery.in("origin_country", query.origins);
  }

  const { data: alerts, error } = await alertsQuery;

  if (error) {
    console.error("Dashboard alerts query error:", error);
    return null;
  }

  const alertsList = alerts || [];

  // Aggregate by raw_id to get unique alerts
  const alertsByRawId = new Map<string, {
    id: string;
    raw_id: string;
    hazards: Set<string>;
    origins: Set<string>;
    product_category: string;
    product_text: string;
    alert_date: string;
    link: string;
  }>();

  for (const alert of alertsList) {
    const rawId = alert.raw_id || alert.id;
    if (!alertsByRawId.has(rawId)) {
      alertsByRawId.set(rawId, {
        id: alert.id,
        raw_id: rawId,
        hazards: new Set(),
        origins: new Set(),
        product_category: alert.product_category || "Unknown",
        product_text: alert.product_text || "Unknown product",
        alert_date: alert.alert_date,
        link: alert.link || "",
      });
    }
    const entry = alertsByRawId.get(rawId)!;
    if (alert.hazard) entry.hazards.add(alert.hazard);
    if (alert.origin_country) entry.origins.add(alert.origin_country);
  }

  // Convert to array
  const uniqueAlerts = Array.from(alertsByRawId.values()).map(a => ({
    id: a.id,
    raw_id: a.raw_id,
    hazards: Array.from(a.hazards),
    origins: Array.from(a.origins),
    product_category: a.product_category,
    product_text: a.product_text,
    alert_date: a.alert_date,
    link: a.link,
  }));

  // Calculate stats
  const hazardCounts: Record<string, number> = {};
  const originCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const alertsByDate: Record<string, number> = {};

  for (const alert of uniqueAlerts) {
    // Count by hazard
    for (const hazard of alert.hazards) {
      hazardCounts[hazard] = (hazardCounts[hazard] || 0) + 1;
    }

    // Count by origin
    for (const origin of alert.origins) {
      originCounts[origin] = (originCounts[origin] || 0) + 1;
    }

    // Count by category
    categoryCounts[alert.product_category] = (categoryCounts[alert.product_category] || 0) + 1;

    // Count by date (YYYY-MM-DD)
    const dateKey = alert.alert_date?.split("T")[0] || "unknown";
    alertsByDate[dateKey] = (alertsByDate[dateKey] || 0) + 1;
  }

  // Sort and limit top items
  const topHazards = Object.entries(hazardCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const topOrigins = Object.entries(originCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Build time series (fill in missing dates)
  const timeSeries: { date: string; count: number }[] = [];
  const endDate = new Date();
  endDate.setUTCHours(0, 0, 0, 0);

  for (let i = query.days; i >= 0; i--) {
    const d = new Date(endDate);
    d.setUTCDate(d.getUTCDate() - i);
    const dateKey = d.toISOString().split("T")[0];
    timeSeries.push({
      date: dateKey,
      count: alertsByDate[dateKey] || 0,
    });
  }

  // Get all unique hazards and origins for filter options
  const allHazards = Object.keys(hazardCounts).sort();
  const allOrigins = Object.keys(originCounts).sort();
  const allCategories = Object.keys(categoryCounts).sort();

  return {
    totalAlerts: uniqueAlerts.length,
    topHazards,
    topOrigins,
    topCategories,
    timeSeries,
    alerts: uniqueAlerts.slice(0, 50), // Limit to 50 most recent for display
    filterOptions: {
      hazards: allHazards,
      origins: allOrigins,
      categories: allCategories,
    },
  };
}

export async function GET(req: NextRequest) {
  const sb = supabaseServer();
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || undefined;

  // Validate token with 3-day freshness check
  const validation = await validateDashboardToken(sb, token);
  if ("error" in validation) {
    return NextResponse.json({ message: validation.error }, { status: 401 });
  }

  // Get subscription and check if daily tier
  const subscription = await getSubscription(sb, validation.userId);
  if (!subscription) {
    return NextResponse.json({ message: "No subscription found" }, { status: 404 });
  }

  if (subscription.frequency !== "daily") {
    return NextResponse.json({
      message: "Dashboard is only available for Daily subscribers",
      currentPlan: subscription.frequency,
    }, { status: 403 });
  }

  // Parse query params for filters
  const days = parseInt(url.searchParams.get("days") || "7", 10);
  const validDays = [7, 30, 90].includes(days) ? days : 7;

  const categoriesParam = url.searchParams.get("categories");
  const hazardsParam = url.searchParams.get("hazards");
  const originsParam = url.searchParams.get("origins");

  // Get user's default categories if no filter specified
  let categories: string[] | undefined;
  if (categoriesParam === null) {
    // No param = use user's configured categories
    categories = await getUserCategories(sb, subscription.id);
    if (categories.length === 0) {
      categories = undefined; // No categories configured = show all
    }
  } else if (categoriesParam === "") {
    // Empty param = show all categories
    categories = undefined;
  } else {
    // Specific categories
    categories = categoriesParam.split(",").filter(Boolean);
  }

  const hazards = hazardsParam ? hazardsParam.split(",").filter(Boolean) : undefined;
  const origins = originsParam ? originsParam.split(",").filter(Boolean) : undefined;

  const data = await getDashboardData(sb, {
    days: validDays,
    categories,
    hazards,
    origins,
  });

  if (!data) {
    return NextResponse.json({ message: "Failed to load dashboard data" }, { status: 500 });
  }

  return NextResponse.json({
    ...data,
    userCategories: categories || [],
    selectedDays: validDays,
  });
}
