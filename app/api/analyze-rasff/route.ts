import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RawRecord = Record<string, unknown>;

const RASFF_URL =
  "https://api.datalake.sante.service.ec.europa.eu/rasff/irasff-general-info-view?format=json&api-version=v1.0";

// Analyze field patterns across records
function analyzeField(records: RawRecord[], fieldNames: string[]): {
  fieldUsed: string | null;
  sampleValues: string[];
  uniqueValues: string[];
  patterns: { value: string; count: number }[];
} {
  const values: string[] = [];
  let fieldUsed: string | null = null;

  for (const record of records) {
    for (const field of fieldNames) {
      // Case-insensitive lookup
      const key = Object.keys(record).find((k) => k.toLowerCase() === field.toLowerCase());
      if (key && record[key] !== null && record[key] !== undefined) {
        fieldUsed = key;
        const val = String(record[key]).trim();
        if (val) values.push(val);
        break;
      }
    }
  }

  // Count occurrences
  const counts = new Map<string, number>();
  values.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));

  const patterns = Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  return {
    fieldUsed,
    sampleValues: values.slice(0, 10),
    uniqueValues: Array.from(new Set(values)).slice(0, 50),
    patterns,
  };
}

export async function GET() {
  try {
    // Fetch multiple pages for better analysis
    const allRecords: RawRecord[] = [];
    let nextUrl: string | null = RASFF_URL;
    let pages = 0;
    const maxPages = 5; // Fetch 5 pages for good sample

    while (nextUrl && pages < maxPages) {
      pages++;
      const fetchUrl: string = nextUrl;
      const fetchRes = await fetch(fetchUrl);
      if (!fetchRes.ok) {
        return NextResponse.json({ error: `RASFF API error: ${fetchRes.status}` }, { status: 500 });
      }
      const json = await fetchRes.json();
      const records: RawRecord[] = json.value || json.records || [];
      allRecords.push(...records);
      nextUrl = json["@odata.nextLink"] || json.nextLink || null;
    }

    if (allRecords.length === 0) {
      return NextResponse.json({ error: "No records fetched" }, { status: 500 });
    }

    // Get all unique field names
    const allFields = new Set<string>();
    allRecords.forEach((r) => Object.keys(r).forEach((k) => allFields.add(k)));

    // Analyze key fields
    const analysis = {
      totalRecords: allRecords.length,
      pagesAnalyzed: pages,
      allFieldNames: Array.from(allFields).sort(),

      hazardAnalysis: analyzeField(allRecords, [
        "hazard_category_name",
        "hazard_desc",
        "hazard",
        "hazards",
        "hazardCategory",
        "hazardName",
      ]),

      productCategoryAnalysis: analyzeField(allRecords, [
        "product_category_desc",
        "productCategory",
        "product_category",
      ]),

      productNameAnalysis: analyzeField(allRecords, [
        "product_name",
        "product",
        "productText",
        "productDescription",
        "subject",
      ]),

      originCountryAnalysis: analyzeField(allRecords, [
        "origin_country_desc",
        "originCountry",
        "countryOfOrigin",
        "country",
        "origin_country",
      ]),

      notifyingCountryAnalysis: analyzeField(allRecords, [
        "notifying_country_desc",
        "notifyingCountry",
        "notifying_member",
        "notifying_country",
      ]),

      dateAnalysis: analyzeField(allRecords, [
        "notif_date",
        "publishedAt",
        "alertDate",
        "date",
        "notification_date",
      ]),

      notificationTypeAnalysis: analyzeField(allRecords, [
        "notification_type_desc",
        "notificationType",
        "notification_type",
        "type",
      ]),

      riskDecisionAnalysis: analyzeField(allRecords, [
        "risk_decision_desc",
        "riskDecision",
        "risk_decision",
      ]),

      // Sample raw records for inspection
      sampleRecords: allRecords.slice(0, 5),
    };

    return NextResponse.json(analysis, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Analysis error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
