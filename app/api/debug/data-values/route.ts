import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase/server";
import { normalizeHazard, normalizeCategory, normalizeCountry } from "../../../../lib/normalize";

export const dynamic = "force-dynamic";

/**
 * Debug endpoint to inspect current data values and test normalization
 * GET /api/debug/data-values
 */
export async function GET() {
  const sb = supabaseServer();

  // Get distinct values from alerts_fact
  const [hazardsResult, categoriesResult, countriesResult] = await Promise.all([
    sb.from("alerts_fact").select("hazard").not("hazard", "is", null),
    sb.from("alerts_fact").select("product_category").not("product_category", "is", null),
    sb.from("alerts_fact").select("origin_country").not("origin_country", "is", null),
  ]);

  // Extract unique values
  const hazards = Array.from(new Set((hazardsResult.data || []).map((r) => r.hazard as string))).sort();
  const categories = Array.from(new Set((categoriesResult.data || []).map((r) => r.product_category as string))).sort();
  const countries = Array.from(new Set((countriesResult.data || []).map((r) => r.origin_country as string))).sort();

  // Also get a sample of raw data to compare
  const { data: rawSample } = await sb
    .from("alerts_raw")
    .select("payload_json")
    .limit(5);

  // Show what normalization would produce
  const hazardComparison = hazards.map((h) => ({
    current: h,
    normalized: normalizeHazard(h),
    changed: h !== normalizeHazard(h),
  }));

  const categoryComparison = categories.map((c) => ({
    current: c,
    normalized: normalizeCategory(c),
    changed: c !== normalizeCategory(c),
  }));

  const countryComparison = countries.map((c) => ({
    current: c,
    normalized: normalizeCountry(c),
    changed: c !== normalizeCountry(c),
  }));

  // Extract field names from raw sample to understand API structure
  const sampleFields = rawSample?.[0]?.payload_json
    ? Object.keys(rawSample[0].payload_json as Record<string, unknown>)
    : [];

  return NextResponse.json({
    summary: {
      totalHazards: hazards.length,
      totalCategories: categories.length,
      totalCountries: countries.length,
      hazardsNeedingChange: hazardComparison.filter((h) => h.changed).length,
      categoriesNeedingChange: categoryComparison.filter((c) => c.changed).length,
      countriesNeedingChange: countryComparison.filter((c) => c.changed).length,
    },
    apiFields: sampleFields,
    rawSample: rawSample?.[0]?.payload_json || null,
    hazards: hazardComparison,
    categories: categoryComparison,
    countries: countryComparison,
  });
}
