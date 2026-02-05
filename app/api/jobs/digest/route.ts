import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase/server";
import { sendDigestEmail } from "../../../../lib/email/send";

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

type AlertFact = {
  id: string;
  hazard: string | null;
  product_category: string | null;
  origin_country: string | null;
  product_text: string | null;
  alert_date: string | null;
  link: string | null;
};

export async function POST(req: NextRequest) {
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

    // Build filter criteria
    const hazards = rules.filter((r) => r.rule_type === "hazard").map((r) => r.rule_value);
    const categories = rules.filter((r) => r.rule_type === "category").map((r) => r.rule_value);
    const countries = rules.filter((r) => r.rule_type === "country").map((r) => r.rule_value);

    // Get alerts from the last 7 days that match filters
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let alertQuery = sb
      .from("alerts_fact")
      .select("id, hazard, product_category, origin_country, product_text, alert_date, link")
      .gte("alert_date", oneWeekAgo.toISOString());

    // Apply filters if user has set any
    if (hazards.length > 0) {
      alertQuery = alertQuery.in("hazard", hazards);
    }
    if (categories.length > 0) {
      alertQuery = alertQuery.in("product_category", categories);
    }
    if (countries.length > 0) {
      alertQuery = alertQuery.in("origin_country", countries);
    }

    const { data: alerts } = await alertQuery.returns<AlertFact[]>();

    if (!alerts || alerts.length === 0) {
      continue;
    }

    // Get already delivered alert IDs for this subscription
    const { data: existingDeliveries } = await sb
      .from("deliveries")
      .select("id")
      .eq("subscription_id", subscription.id);

    const deliveryIds = (existingDeliveries || []).map((d) => d.id);

    let deliveredAlertIds: string[] = [];
    if (deliveryIds.length > 0) {
      const { data: deliveredItems } = await sb
        .from("delivery_items")
        .select("alerts_fact_id")
        .in("delivery_id", deliveryIds);
      deliveredAlertIds = (deliveredItems || []).map((i) => i.alerts_fact_id);
    }

    // Filter out already delivered alerts
    const newAlerts = alerts.filter((a) => !deliveredAlertIds.includes(a.id));

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

    // Create delivery items
    const deliveryItems = newAlerts.map((alert) => ({
      delivery_id: delivery.id,
      alerts_fact_id: alert.id,
    }));

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
