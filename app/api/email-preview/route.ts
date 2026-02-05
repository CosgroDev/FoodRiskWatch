import { NextRequest, NextResponse } from "next/server";
import { renderDigestEmail, type AlertItem } from "../../../lib/email/digest-template";

export const dynamic = "force-dynamic";

type RawRecord = Record<string, unknown>;

const RASFF_URL =
  "https://api.datalake.sante.service.ec.europa.eu/rasff/irasff-general-info-view?format=json&api-version=v1.0";

// Case-insensitive field getter (same as ingest route)
function pick(record: RawRecord, candidates: string[]): unknown {
  const lookup: Record<string, unknown> = {};
  Object.keys(record).forEach((k) => {
    lookup[k.toLowerCase()] = record[k];
  });
  for (const key of candidates) {
    const hit = lookup[key.toLowerCase()];
    if (hit !== undefined && hit !== null) return hit;
  }
  return undefined;
}

// Extract hazards (same logic as ingest route)
function extractHazards(record: RawRecord): string[] {
  const candidates: string[] = [];
  const hazardFields = [
    pick(record, ["hazard_category_name", "hazard_desc", "hazard"]),
    pick(record, ["hazards", "hazard_categories", "hazardCategory", "hazardName"]),
  ];

  hazardFields.forEach((field) => {
    if (!field) return;
    if (Array.isArray(field)) {
      field.forEach((item) => {
        if (typeof item === "string") candidates.push(item);
        else if ((item as Record<string, unknown>)?.["name"])
          candidates.push(String((item as Record<string, unknown>)["name"]));
      });
    } else if (typeof field === "string") {
      field
        .split(/[;,/|]/)
        .map((v) => v.trim())
        .filter(Boolean)
        .forEach((v) => candidates.push(v));
    }
  });

  const cleaned = Array.from(
    new Set(
      candidates
        .map((v) => v.trim())
        .filter(Boolean)
        .map((v) => v.replace(/\s+/g, " "))
        .map((v) => v.replace(/^["']|["']$/g, ""))
        .map((v) => {
          const lower = v.toLowerCase();
          if (lower.includes("salmonella")) return "Salmonella";
          if (lower.includes("listeria")) return "Listeria";
          if (lower.includes("mycotoxin")) return "Mycotoxin";
          if (lower.includes("aflatoxin")) return "Aflatoxin";
          if (lower.includes("escherichia") || lower.includes("e.coli") || lower.includes("e coli"))
            return "E. coli";
          if (lower.includes("allergen")) return "Allergen";
          return v[0] ? v[0].toUpperCase() + v.slice(1) : v;
        })
    )
  );

  return cleaned.length > 0 ? cleaned : ["Unknown"];
}

// Parse a raw RASFF record into AlertItem(s)
function parseRasffRecord(record: RawRecord): AlertItem[] {
  const hazards = extractHazards(record);
  const common = {
    product_category:
      (pick(record, ["product_category_desc", "productCategory", "product_category"]) as string) || null,
    product_text:
      (pick(record, ["product_name", "product", "productText", "productDescription"]) as string) || null,
    origin_country:
      (pick(record, ["origin_country_desc", "originCountry", "countryOfOrigin", "country"]) as string) || null,
    notifying_country:
      (pick(record, ["notifying_country_desc", "notifyingCountry", "notifying_member"]) as string) || null,
    alert_date: (pick(record, ["notif_date", "publishedAt", "alertDate", "date"]) as string) || null,
    link: (pick(record, ["link", "url"]) as string) || null,
  };

  // Create one AlertItem per hazard
  return hazards.map((hazard) => ({
    hazard,
    ...common,
  }));
}

// Fetch live RASFF data
async function fetchRasffAlerts(limit: number = 10): Promise<AlertItem[]> {
  const res = await fetch(RASFF_URL);
  if (!res.ok) {
    throw new Error(`RASFF API returned ${res.status}`);
  }

  const json = await res.json();
  const records: RawRecord[] = json.value || json.records || [];

  const alerts: AlertItem[] = [];
  for (const record of records) {
    const parsed = parseRasffRecord(record);
    alerts.push(...parsed);
    if (alerts.length >= limit) break;
  }

  return alerts.slice(0, limit);
}

// Sample alerts for offline/fallback testing
const sampleAlerts: AlertItem[] = [
  {
    hazard: "Salmonella",
    product_category: "Meat and meat products",
    product_text: "Frozen chicken breast fillets",
    origin_country: "Poland",
    notifying_country: "Germany",
    alert_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    link: "https://example.com/alert/1",
  },
  {
    hazard: "Listeria monocytogenes",
    product_category: "Dairy products",
    product_text: "Soft cheese (Brie style)",
    origin_country: "France",
    notifying_country: "Belgium",
    alert_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    link: "https://example.com/alert/2",
  },
  {
    hazard: "Aflatoxins",
    product_category: "Nuts and seeds",
    product_text: "Roasted peanuts in shell",
    origin_country: "Egypt",
    notifying_country: "Netherlands",
    alert_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    link: "https://example.com/alert/3",
  },
  {
    hazard: "E. coli (STEC)",
    product_category: "Produce",
    product_text: "Fresh spinach leaves (pre-packed)",
    origin_country: "Spain",
    notifying_country: "United Kingdom",
    alert_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    link: null,
  },
  {
    hazard: "Undeclared allergen (milk)",
    product_category: "Bakery products",
    product_text: "Chocolate chip cookies",
    origin_country: "Italy",
    notifying_country: "France",
    alert_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    link: "https://example.com/alert/5",
  },
];

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const useLive = url.searchParams.get("live") === "true";
  const format = url.searchParams.get("format") || "html"; // html or json
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "10", 10), 50);

  let alerts: AlertItem[];
  let dataSource: string;

  if (useLive) {
    try {
      alerts = await fetchRasffAlerts(limit);
      dataSource = "RASFF API (live)";
    } catch (err) {
      console.error("Failed to fetch RASFF data, falling back to samples:", err);
      alerts = sampleAlerts;
      dataSource = "Sample data (RASFF fetch failed)";
    }
  } else {
    alerts = sampleAlerts;
    dataSource = "Sample data";
  }

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Return JSON if requested (useful for debugging)
  if (format === "json") {
    return NextResponse.json({
      dataSource,
      alertCount: alerts.length,
      alerts,
    });
  }

  // Return rendered HTML email
  const html = renderDigestEmail({
    recipientEmail: "user@example.com",
    alerts,
    dateRange: {
      start: weekAgo.toISOString(),
      end: now.toISOString(),
    },
    manageUrl: `${url.origin}/preferences?token=preview-token`,
    unsubscribeUrl: `${url.origin}/api/unsubscribe?token=preview-token`,
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
