import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase/server";
import { autoCleanRecord } from "../../../../lib/normalizer-auto";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing alert ID" }, { status: 400 });
  }

  let sb;
  try {
    sb = supabaseServer();
  } catch {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  // Try to find by fact ID first
  const { data: factData, error: factError } = await sb
    .from("alerts_fact")
    .select("*, alerts_raw(payload_json)")
    .eq("id", id)
    .maybeSingle();

  if (factError) {
    console.error("Fact lookup error:", factError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (factData) {
    // Found by fact ID - return cleaned data with raw payload
    const rawPayload = factData.alerts_raw?.payload_json || {};
    const cleaned = autoCleanRecord(rawPayload);

    return NextResponse.json({
      id: factData.id,
      source: "fact",
      // Cleaned/normalized data
      alert: {
        hazard: factData.hazard,
        hazardCategory: factData.hazard_category,
        productText: cleaned.productText,
        productCategory: cleaned.productCategory,
        originCountry: cleaned.originCountry,
        notifyingCountry: cleaned.notifyingCountry,
        riskLevel: cleaned.riskLevel,
        alertDate: cleaned.alertDate,
      },
      // Full raw data for detailed view
      raw: rawPayload,
    });
  }

  // Try raw_id lookup
  const { data: rawData, error: rawError } = await sb
    .from("alerts_raw")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (rawError) {
    console.error("Raw lookup error:", rawError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (rawData) {
    const cleaned = autoCleanRecord(rawData.payload_json || {});

    return NextResponse.json({
      id: rawData.id,
      source: "raw",
      alert: cleaned,
      raw: rawData.payload_json,
    });
  }

  // Try source_id lookup (notification reference like "2024.1234")
  const { data: sourceData, error: sourceError } = await sb
    .from("alerts_raw")
    .select("*")
    .eq("source_id", id)
    .maybeSingle();

  if (sourceError) {
    console.error("Source lookup error:", sourceError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (sourceData) {
    const cleaned = autoCleanRecord(sourceData.payload_json || {});

    return NextResponse.json({
      id: sourceData.id,
      source: "source_id",
      alert: cleaned,
      raw: sourceData.payload_json,
    });
  }

  return NextResponse.json({ error: "Alert not found" }, { status: 404 });
}
