import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase/server";
import { sendDigestEmail } from "../../../../lib/email/send";
import { normalizeCategory } from "../../../../lib/normalize";

type Subscription = {
  id: string;
  user_id: string;
  frequency: string;
  users: { email: string; status: string } | null;
};

type FilterRule = {
  filter_id: string;
  rule_type: string;
  rule_value: string;
};

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

type AggregatedAlert = {
  id: string;
  raw_id: string;
  hazards: string[];
  countries: string[];
  product_category: string | null;
  product_text: string | null;
  alert_date: string | null;
  link: string | null;
  fact_ids: string[];
};

function aggregateAlerts(rows: AlertFactRow[]): AggregatedAlert[] {
  const grouped = new Map<string, AlertFactRow[]>();

  for (const row of rows) {
    const key = row.raw_id || row.id;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(row);
  }

  const aggregated: AggregatedAlert[] = [];

  const entries = Array.from(grouped.entries());
  for (let i = 0; i < entries.length; i++) {
    const [rawId, alertRows] = entries[i];
    const first = alertRows[0];
    const hazards = Array.from(new Set(alertRows.map(r => r.hazard).filter((h): h is string => !!h && h !== "Unknown")));
    const countries = Array.from(new Set(alertRows.map(r => r.origin_country).filter((c): c is string => !!c && c !== "Unknown")));
    const factIds = alertRows.map(r => r.id);

    aggregated.push({
      id: first.id,
      raw_id: rawId,
      hazards: hazards.length > 0 ? hazards : ["Unknown"],
      countries: countries.length > 0 ? countries : ["Unknown"],
      product_category: first.product_category,
      product_text: first.product_text,
      alert_date: first.alert_date,
      link: first.link,
      fact_ids: factIds,
    });
  }

  return aggregated;
}

export async function GET(req: NextRequest) {
  // Support both custom header (local testing) and Vercel's cron auth
  const customSecret = req.headers.get("x-cron-digest");
  const authHeader = req.headers.get("authorization");
  const vercelSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const isValidCustom = customSecret && customSecret === process.env.CRON_DIGEST_SECRET;
  const isValidVercel = vercelSecret && vercelSecret === process.env.CRON_SECRET;

  if (!isValidCustom && !isValidVercel) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const sb = supabaseServer();
  const results: { email: string; alertCount: number; deliveryId: string }[] = [];

  // Get all active weekly subscriptions with user email
  const { data: subscriptions, error: subError } = await sb
    .from("subscriptions")
    .select("id, user_id, frequency, users!inner(email, status)")
    .eq("frequency", "weekly")
    .eq("is_active", true)
    .returns<Subscription[]>();

  if (subError) {
    console.error("Failed to fetch subscriptions", subError);
    return NextResponse.json({ message: "Failed to fetch subscriptions" }, { status: 500 });
  }

  // Filter to only active users
  const activeSubscriptions = (subscriptions || []).filter(
    (s) => s.users?.status === "active"
  );

  for (const subscription of activeSubscriptions) {
    // Get filter rules for this subscription
    const { data: filters } = await sb
      .from("filters")
      .select("id")
      .eq("subscription_id", subscription.id);

    const filterIds = (filters || []).map((f) => f.id);

    let rules: FilterRule[] = [];
    if (filterIds.length > 0) {
      const { data: ruleData } = await sb
        .from("filter_rules")
        .select("filter_id, rule_type, rule_value")
        .in("filter_id", filterIds);
      rules = ruleData || [];
    }

    // Build filter criteria (only categories now)
    const categoryFilters = new Set(rules.filter((r) => r.rule_type === "category").map((r) => r.rule_value));

    // Get alerts from the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: allAlertRows } = await sb
      .from("alerts_fact")
      .select("id, raw_id, hazard, product_category, origin_country, product_text, alert_date, link")
      .gte("alert_date", oneWeekAgo.toISOString())
      .returns<AlertFactRow[]>();

    if (!allAlertRows || allAlertRows.length === 0) {
      continue;
    }

    // Filter rows by category before aggregating. If no filters set, include all alerts.
    const filteredRows = categoryFilters.size > 0
      ? allAlertRows.filter((row) => {
          const normalizedCategory = normalizeCategory(row.product_category);
          return normalizedCategory && categoryFilters.has(normalizedCategory);
        })
      : allAlertRows;

    // Aggregate rows by raw_id to combine hazards and countries
    const alerts = aggregateAlerts(filteredRows);

    if (alerts.length === 0) {
      continue;
    }

    // Get already delivered alert IDs for this subscription
    const { data: existingDeliveries } = await sb
      .from("deliveries")
      .select("id")
      .eq("subscription_id", subscription.id);

    const deliveryIds = (existingDeliveries || []).map((d) => d.id);

    let deliveredAlertIds: Set<string> = new Set();
    if (deliveryIds.length > 0) {
      const { data: deliveredItems } = await sb
        .from("delivery_items")
        .select("alerts_fact_id")
        .in("delivery_id", deliveryIds);
      deliveredAlertIds = new Set((deliveredItems || []).map((i) => i.alerts_fact_id));
    }

    // Filter out already delivered alerts (check if any of the fact_ids were delivered)
    const newAlerts = alerts.filter((a) => !a.fact_ids.some(id => deliveredAlertIds.has(id)));

    if (newAlerts.length === 0) {
      continue;
    }

    // Create delivery record
    const { data: delivery, error: deliveryError } = await sb
      .from("deliveries")
      .insert({
        subscription_id: subscription.id,
        delivery_type: "digest",
        status: "pending",
      })
      .select("id")
      .single();

    if (deliveryError || !delivery) {
      console.error("Failed to create delivery", deliveryError);
      continue;
    }

    // Create delivery items for all fact_ids in each aggregated alert
    const deliveryItems = newAlerts.flatMap((alert) =>
      alert.fact_ids.map((factId) => ({
        delivery_id: delivery.id,
        alerts_fact_id: factId,
      }))
    );

    const { error: itemsError } = await sb.from("delivery_items").insert(deliveryItems);

    if (itemsError) {
      console.error("Failed to create delivery items", itemsError);
      continue;
    }

    // Get user's manage token for unsubscribe/preferences links
    const { data: manageTokenData } = await sb
      .from("email_tokens")
      .select("token")
      .eq("user_id", subscription.user_id)
      .eq("purpose", "manage")
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .single();

    const manageToken = manageTokenData?.token;
    if (!manageToken) {
      console.error(`[Digest] No manage token for user ${subscription.user_id}`);
      await sb.from("deliveries").update({ status: "failed" }).eq("id", delivery.id);
      continue;
    }

    // Send actual email
    const emailResult = await sendDigestEmail(
      subscription.users?.email || "",
      newAlerts,
      manageToken
    );

    if (emailResult.success) {
      // Mark delivery as sent
      await sb
        .from("deliveries")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", delivery.id);

      console.log(`[Digest] Sent ${newAlerts.length} alerts to ${subscription.users?.email}`);

      results.push({
        email: subscription.users?.email || "unknown",
        alertCount: newAlerts.length,
        deliveryId: delivery.id,
      });
    } else {
      // Mark delivery as failed
      await sb.from("deliveries").update({ status: "failed" }).eq("id", delivery.id);
      console.error(`[Digest] Failed to send to ${subscription.users?.email}: ${emailResult.error}`);
    }
  }

  return NextResponse.json({
    ok: true,
    processed: activeSubscriptions.length,
    delivered: results.length,
    results,
  });
}
