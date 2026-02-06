import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase/server";
import { normalizeHazard, normalizeCategory, normalizeCountry } from "../../../../lib/normalize";
import crypto from "crypto";

type RawRecord = Record<string, unknown>;

type ParsedFact = {
  hazard: string;
  product_category?: string | null;
  product_text?: string | null;
  origin_country?: string | null;
  notifying_country?: string | null;
  alert_date?: string | null;
  link?: string | null;
};

const RASFF_BASE_URL =
  "https://api.datalake.sante.service.ec.europa.eu/rasff/irasff-general-info-view";

// Environment variable for how many days back to fetch (default 7)
const INGEST_DAYS_BACK = Number(process.env.INGEST_DAYS_BACK || "7");

// Build URL with date filter to get recent alerts
function buildRasffUrl(): string {
  const now = new Date();
  const fromDate = new Date();
  fromDate.setDate(now.getDate() - INGEST_DAYS_BACK);

  // Format as ISO datetime with Z suffix
  const dateFrom = fromDate.toISOString().split(".")[0] + "Z";
  const dateTo = now.toISOString().split(".")[0] + "Z";

  return `${RASFF_BASE_URL}?NOTIF_DATE_FROM=${dateFrom}&NOTIF_DATE_TO=${dateTo}&format=json&api-version=v1.0`;
}

// Reduced page limit to ensure job completes within timeout
const PAGE_LIMIT = Number(process.env.INGEST_PAGE_LIMIT || "10");

// Case-insensitive field getter
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

function hashToUUID(input: string): string {
  const hex = crypto.createHash("sha256").update(input).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function deriveSourceId(record: RawRecord): string {
  const id = pick(record, ["id", "notif_id", "notification_reference", "referenceNumber"]);
  if (id) return String(id);
  const pieces = [
    pick(record, ["notification_reference", "referenceNumber"]),
    pick(record, ["notification_type_desc", "notificationType"]),
    pick(record, ["product_category_desc", "productCategory"]),
    pick(record, ["origin_country_desc", "country"]),
  ];
  return crypto.createHash("sha1").update(JSON.stringify(pieces)).digest("hex");
}

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
        else if ((item as Record<string, unknown>)?.["name"]) candidates.push(String((item as Record<string, unknown>)["name"]));
      });
    } else if (typeof field === "string") {
      field
        .split(/[;,/|]/)
        .map((v) => v.trim())
        .filter(Boolean)
        .forEach((v) => candidates.push(v));
    }
  });

  // Clean up and normalize hazards
  const cleaned = Array.from(
    new Set(
      candidates
        .map((v) => v.trim())
        .filter(Boolean)
        .map((v) => v.replace(/\s+/g, " "))
        .map((v) => v.replace(/^["']|["']$/g, "")) // drop surrounding quotes
        .map((v) => normalizeHazard(v) || v)
    )
  );

  return cleaned.length > 0 ? cleaned : ["Unknown"];
}

function buildRasffLink(record: RawRecord): string | null {
  // First check for an explicit URL
  const explicitLink = pick(record, ["link", "url"]) as string | undefined;
  if (explicitLink && explicitLink.startsWith("http")) {
    return explicitLink;
  }

  // Build link from notification reference
  const notifRef = pick(record, ["notification_reference", "notif_id", "referenceNumber"]) as string | undefined;
  if (notifRef) {
    return `https://webgate.ec.europa.eu/rasff-window/screen/notification/${encodeURIComponent(notifRef)}`;
  }

  return null;
}

function parseFact(record: RawRecord): Omit<ParsedFact, "hazard"> {
  const rawCategory = pick(record, ["product_category_desc", "productCategory", "product_category"]) as string | undefined;
  const rawOriginCountry = pick(record, ["origin_country_desc", "originCountry", "countryOfOrigin", "country"]) as string | undefined;
  const rawNotifyingCountry = pick(record, ["notifying_country_desc", "notifyingCountry", "notifying_member"]) as string | undefined;

  return {
    product_category: normalizeCategory(rawCategory),
    product_text:
      (pick(record, ["product_name", "product", "productText", "productDescription"]) as string) || null,
    origin_country: normalizeCountry(rawOriginCountry),
    notifying_country: normalizeCountry(rawNotifyingCountry),
    alert_date:
      (pick(record, ["notif_date", "publishedAt", "alertDate", "date"]) as string) ||
      null,
    link: buildRasffLink(record),
  };
}

export async function GET(req: NextRequest) {
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
  let nextUrl: string | null = buildRasffUrl();
  let page = 0;
  let insertedFacts = 0;

  while (nextUrl && page < PAGE_LIMIT) {
    page += 1;
    const res: Response = await fetch(nextUrl);
    if (!res.ok) {
      console.error("RASFF fetch failed", res.status, await res.text());
      break;
    }

    const json = await res.json();
    const records: RawRecord[] = json.value || json.records || [];
    nextUrl = json["@odata.nextLink"] || json.nextLink || null;

    for (const record of records) {
      console.log("Ingesting record keys", Object.keys(record));
      const sourceId = deriveSourceId(record);
      const payload = {
        id: hashToUUID(sourceId),
        source_id: sourceId,
        payload_json: record,
        published_at: record.publishedAt || record.alertDate || record.date || null,
      };

      const { data: rawRow, error: rawErr } = await sb
        .from("alerts_raw")
        .upsert(payload, { onConflict: "source_id" })
        .select("id")
        .single();

      if (rawErr || !rawRow) {
        console.error("alerts_raw error", rawErr);
        continue;
      }

      const hazards = extractHazards(record);
      const common = parseFact(record);

      const factRows = hazards.map((hazard, idx) => ({
        id: hashToUUID(`${payload.source_id}-${hazard}-${idx}`),
        raw_id: rawRow.id,
        hazard,
        ...common,
      }));

      const { error: factErr } = await sb.from("alerts_fact").upsert(factRows, { onConflict: "id" });
      if (factErr) console.error("alerts_fact error", factErr);
      else insertedFacts += factRows.length;
    }
  }

  return NextResponse.json({ ok: true, pagesProcessed: page, factsUpserted: insertedFacts });
}
