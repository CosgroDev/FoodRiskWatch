import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ message: "Missing alert ID" }, { status: 400 });
  }

  const sb = supabaseServer();

  const { data: alert, error } = await sb
    .from("alerts_fact")
    .select("id, hazard, product_category, product_text, origin_country, notifying_country, alert_date, link, raw_id")
    .eq("id", id)
    .single();

  if (error || !alert) {
    return NextResponse.json({ message: "Alert not found" }, { status: 404 });
  }

  // Fetch the raw payload for additional details
  let rawPayload = null;
  if (alert.raw_id) {
    const { data: rawData } = await sb
      .from("alerts_raw")
      .select("payload_json")
      .eq("id", alert.raw_id)
      .single();
    rawPayload = rawData?.payload_json;
  }

  return NextResponse.json({
    ...alert,
    raw_payload: rawPayload,
  });
}
