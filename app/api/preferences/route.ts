import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

type RulePayload = {
  token?: string;
  frequency?: "weekly" | "daily" | "instant";
  hazards?: string[];
  categories?: string[];
  countries?: string[];
};

async function validateManageToken(sb: ReturnType<typeof supabaseServer>, token?: string) {
  if (!token) return { error: "Missing token" as const };
  const { data, error } = await sb
    .from("email_tokens")
    .select("user_id, purpose, expires_at")
    .eq("token", token)
    .single();

  if (error || !data || data.purpose !== "manage") return { error: "Invalid token" as const };
  if (data.expires_at && new Date(data.expires_at) < new Date()) return { error: "Token expired" as const };
  return { userId: data.user_id };
}

async function ensureDefaultSubscription(sb: ReturnType<typeof supabaseServer>, userId: string) {
  const { data: sub } = await sb
    .from("subscriptions")
    .select("id, frequency")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (sub) return sub;

  const { data: created, error } = await sb
    .from("subscriptions")
    .insert({ user_id: userId, tier: "free", frequency: "weekly", timezone: "Europe/London", is_active: true })
    .select("id, frequency")
    .single();
  if (error || !created) throw error;
  return created;
}

async function ensureDefaultFilter(sb: ReturnType<typeof supabaseServer>, subscriptionId: string) {
  const { data: filt } = await sb
    .from("filters")
    .select("id")
    .eq("subscription_id", subscriptionId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (filt) return filt;

  const { data: created, error } = await sb
    .from("filters")
    .insert({ subscription_id: subscriptionId, name: "Default" })
    .select("id")
    .single();
  if (error || !created) throw error;
  return created;
}

export async function GET(req: NextRequest) {
  const sb = supabaseServer();
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || undefined;

  const validation = await validateManageToken(sb, token);
  if ("error" in validation) {
    return NextResponse.json({ message: validation.error }, { status: 400 });
  }

  const subscription = await ensureDefaultSubscription(sb, validation.userId);
  const filter = await ensureDefaultFilter(sb, subscription.id);

  const { data: rules } = await sb
    .from("filter_rules")
    .select("rule_type, rule_value")
    .eq("filter_id", filter.id);

  // Fetch distinct values from alerts_fact for dynamic options
  const [hazardsResult, categoriesResult, countriesResult] = await Promise.all([
    sb.from("alerts_fact").select("hazard").not("hazard", "is", null),
    sb.from("alerts_fact").select("product_category").not("product_category", "is", null),
    sb.from("alerts_fact").select("origin_country").not("origin_country", "is", null),
  ]);

  // Extract unique values and sort alphabetically
  const availableHazards = Array.from(new Set((hazardsResult.data || []).map((r) => r.hazard as string))).sort();
  const availableCategories = Array.from(new Set((categoriesResult.data || []).map((r) => r.product_category as string))).sort();
  const availableCountries = Array.from(new Set((countriesResult.data || []).map((r) => r.origin_country as string))).sort();

  const response = {
    frequency: (subscription.frequency as "weekly" | "daily" | "instant") || "weekly",
    hazards: (rules || []).filter((r) => r.rule_type === "hazard").map((r) => r.rule_value),
    categories: (rules || []).filter((r) => r.rule_type === "category").map((r) => r.rule_value),
    countries: (rules || []).filter((r) => r.rule_type === "country").map((r) => r.rule_value),
    // Available options from ingested data
    availableHazards,
    availableCategories,
    availableCountries,
  };

  return NextResponse.json(response);
}

export async function POST(req: NextRequest) {
  const sb = supabaseServer();
  const body = (await req.json().catch(() => ({}))) as RulePayload;
  const validation = await validateManageToken(sb, body.token);
  if ("error" in validation) {
    return NextResponse.json({ message: validation.error }, { status: 400 });
  }

  const safeFrequency: "weekly" | "daily" | "instant" = body.frequency === "weekly" ? "weekly" : "weekly";

  const subscription = await ensureDefaultSubscription(sb, validation.userId);
  await sb
    .from("subscriptions")
    .update({ frequency: safeFrequency, is_active: true })
    .eq("id", subscription.id);

  const filter = await ensureDefaultFilter(sb, subscription.id);

  // Replace existing rules with new set
  await sb.from("filter_rules").delete().eq("filter_id", filter.id);

  const rulesToInsert = [
    ...(body.hazards || []).map((value) => ({ filter_id: filter.id, rule_type: "hazard", rule_value: value })),
    ...(body.categories || []).map((value) => ({ filter_id: filter.id, rule_type: "category", rule_value: value })),
    ...(body.countries || []).map((value) => ({ filter_id: filter.id, rule_type: "country", rule_value: value })),
  ];

  if (rulesToInsert.length > 0) {
    const { error } = await sb.from("filter_rules").insert(rulesToInsert);
    if (error) {
      console.error("rules insert error", error);
      return NextResponse.json({ message: "Failed to save filters" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
