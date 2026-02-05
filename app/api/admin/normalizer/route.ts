import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase/server";
import {
  getNormalizationStats,
  addMapping,
  refreshMappingsCache,
} from "../../../../lib/normalizer-adaptive";

export const dynamic = "force-dynamic";

// Simple admin auth via secret header
function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get("x-admin-secret");
  return !!secret && secret === process.env.ADMIN_SECRET;
}

/**
 * GET /api/admin/normalizer
 * Returns normalization statistics and unknowns needing review
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let sb;
  try {
    sb = supabaseServer();
  } catch {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // Refresh cache on demand
  if (action === "refresh-cache") {
    await refreshMappingsCache(sb);
    return NextResponse.json({ ok: true, message: "Cache refreshed" });
  }

  // Get unknown values for a specific type
  if (action === "unknowns") {
    const type = url.searchParams.get("type") || "all";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);

    let query = sb
      .from("unknown_normalization_values")
      .select("*")
      .eq("is_reviewed", false)
      .order("occurrence_count", { ascending: false })
      .limit(limit);

    if (type !== "all") {
      query = query.eq("value_type", type);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      unknowns: data,
      count: data?.length || 0,
    });
  }

  // Get existing mappings
  if (action === "mappings") {
    const type = url.searchParams.get("type") || "all";
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 500);

    let query = sb
      .from("normalization_mappings")
      .select("*")
      .order("usage_count", { ascending: false })
      .limit(limit);

    if (type !== "all") {
      query = query.eq("mapping_type", type);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      mappings: data,
      count: data?.length || 0,
    });
  }

  // Default: return overall stats
  try {
    const stats = await getNormalizationStats(sb);
    return NextResponse.json(stats);
  } catch (err) {
    console.error("Stats error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/normalizer
 * Add or update a normalization mapping
 *
 * Body: {
 *   action: "add-mapping" | "mark-reviewed" | "bulk-add",
 *   mapping_type?: "country" | "hazard" | "category" | "product",
 *   raw_value?: string,
 *   normalized_value?: string,
 *   confidence?: number,
 *   mappings?: Array<{mapping_type, raw_value, normalized_value}>
 * }
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let sb;
  try {
    sb = supabaseServer();
  } catch {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  // Add a single mapping
  if (action === "add-mapping") {
    const { mapping_type, raw_value, normalized_value, confidence } = body;

    if (!mapping_type || !raw_value || !normalized_value) {
      return NextResponse.json(
        { error: "Missing required fields: mapping_type, raw_value, normalized_value" },
        { status: 400 }
      );
    }

    const validTypes = ["country", "hazard", "category", "product"];
    if (!validTypes.includes(mapping_type)) {
      return NextResponse.json(
        { error: `Invalid mapping_type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const success = await addMapping(
      sb,
      mapping_type,
      raw_value,
      normalized_value,
      confidence ?? 1.0
    );

    if (!success) {
      return NextResponse.json({ error: "Failed to add mapping" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Mapping added" });
  }

  // Bulk add mappings
  if (action === "bulk-add") {
    const mappings = body.mappings as Array<{
      mapping_type: string;
      raw_value: string;
      normalized_value: string;
    }>;

    if (!Array.isArray(mappings) || mappings.length === 0) {
      return NextResponse.json({ error: "No mappings provided" }, { status: 400 });
    }

    let added = 0;
    for (const m of mappings.slice(0, 100)) {
      // Limit to 100 at a time
      if (m.mapping_type && m.raw_value && m.normalized_value) {
        const success = await addMapping(
          sb,
          m.mapping_type as "country" | "hazard" | "category" | "product",
          m.raw_value,
          m.normalized_value
        );
        if (success) added++;
      }
    }

    return NextResponse.json({ ok: true, added });
  }

  // Mark unknown value as reviewed (skip it)
  if (action === "mark-reviewed") {
    const { value_type, raw_value } = body;

    if (!value_type || !raw_value) {
      return NextResponse.json({ error: "Missing value_type or raw_value" }, { status: 400 });
    }

    const { error } = await sb
      .from("unknown_normalization_values")
      .update({ is_reviewed: true })
      .eq("value_type", value_type)
      .eq("raw_value", raw_value);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
