import { NextRequest, NextResponse } from "next/server";
import { renderDigestEmail, type AlertItem } from "../../../lib/email/digest-template";
import { autoCleanRecord, autoCleanHazards } from "../../../lib/normalizer-auto";

export const dynamic = "force-dynamic";

type RawRecord = Record<string, unknown>;

const RASFF_URL =
  "https://api.datalake.sante.service.ec.europa.eu/rasff/irasff-general-info-view?format=json&api-version=v1.0";

// Helper to get field value case-insensitively
function pick(record: RawRecord, candidates: string[]): string {
  for (const key of candidates) {
    const found = Object.keys(record).find((k) => k.toLowerCase() === key.toLowerCase());
    if (found && record[found] != null) {
      return String(record[found]).trim();
    }
  }
  return "";
}

// Parse a raw RASFF record into AlertItem(s) using auto-normalizer
function parseRasffRecord(record: RawRecord): AlertItem[] {
  const cleaned = autoCleanRecord(record);

  // Extract and clean hazards (may contain multiple *** separated)
  const rawHazard = pick(record, ["hazard_category_name", "hazard_desc", "hazard"]);
  const hazards = autoCleanHazards(rawHazard);

  // Create one AlertItem per hazard with fully cleaned data
  return hazards.map((hazard) => ({
    hazard: hazard.name,
    hazard_category: hazard.category,
    product_category: cleaned.productCategory,
    product_text: cleaned.productText,
    origin_country: cleaned.originCountry,
    notifying_country: cleaned.notifyingCountry,
    alert_date: cleaned.alertDate,
    link: cleaned.link,
    risk_level: cleaned.riskLevel,
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
    hazard_category: "Pathogen",
    product_category: "Poultry",
    product_text: "Frozen Chicken Breast Fillets",
    origin_country: "Poland",
    notifying_country: "Germany",
    alert_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    link: "https://webgate.ec.europa.eu/rasff-window/screen/notification/2024.0001",
    risk_level: "serious",
  },
  {
    hazard: "Listeria",
    hazard_category: "Pathogen",
    product_category: "Dairy",
    product_text: "Soft Cheese (Brie Style)",
    origin_country: "France",
    notifying_country: "Belgium",
    alert_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    link: "https://webgate.ec.europa.eu/rasff-window/screen/notification/2024.0002",
    risk_level: "serious",
  },
  {
    hazard: "Aflatoxin",
    hazard_category: "Mycotoxin",
    product_category: "Nuts & Seeds",
    product_text: "Roasted Peanuts In Shell",
    origin_country: "Egypt",
    notifying_country: "Netherlands",
    alert_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    link: "https://webgate.ec.europa.eu/rasff-window/screen/notification/2024.0003",
    risk_level: "potentially-serious",
  },
  {
    hazard: "E. coli (STEC)",
    hazard_category: "Pathogen",
    product_category: "Fruits & Vegetables",
    product_text: "Fresh Spinach Leaves (Pre-packed)",
    origin_country: "Spain",
    notifying_country: "UK",
    alert_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    link: null,
    risk_level: "serious",
  },
  {
    hazard: "Undeclared Allergen (Milk)",
    hazard_category: "Allergen",
    product_category: "Cereals & Bakery",
    product_text: "Chocolate Chip Cookies",
    origin_country: "Italy",
    notifying_country: "France",
    alert_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    link: "https://webgate.ec.europa.eu/rasff-window/screen/notification/2024.0005",
    risk_level: "not-serious",
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
