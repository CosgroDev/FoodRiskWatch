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

  // First fetch the alert to get its raw_id
  const { data: alert, error } = await sb
    .from("alerts_fact")
    .select("id, hazard, product_category, product_text, origin_country, notifying_country, alert_date, link, raw_id")
    .eq("id", id)
    .single();

  if (error || !alert) {
    return NextResponse.json({ message: "Alert not found" }, { status: 404 });
  }

  // Fetch all fact rows with the same raw_id to aggregate hazards and countries
  let hazards: string[] = [];
  let countries: string[] = [];

  if (alert.raw_id) {
    const { data: relatedAlerts } = await sb
      .from("alerts_fact")
      .select("hazard, origin_country")
      .eq("raw_id", alert.raw_id);

    if (relatedAlerts) {
      hazards = Array.from(new Set(
        relatedAlerts
          .map(r => r.hazard)
          .filter((h): h is string => !!h && h !== "Unknown")
      ));
      countries = Array.from(new Set(
        relatedAlerts
          .map(r => r.origin_country)
          .filter((c): c is string => !!c && c !== "Unknown")
      ));
    }
  }

  // Fallback to single values if no aggregated data
  if (hazards.length === 0 && alert.hazard) {
    hazards = [alert.hazard];
  }
  if (countries.length === 0 && alert.origin_country) {
    countries = [alert.origin_country];
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
    id: alert.id,
    hazards,
    countries,
    product_category: alert.product_category,
    product_text: alert.product_text,
    notifying_country: alert.notifying_country,
    alert_date: alert.alert_date,
    link: alert.link,
    raw_payload: rawPayload,
  });
}
