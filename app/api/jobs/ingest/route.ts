import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase/server";
import crypto from "crypto";
import {
  autoCleanRecord,
  autoCleanHazards,
} from "../../../../lib/normalizer-auto";

type RawRecord = Record<string, unknown>;

type ParsedFact = {
  hazard: string;
  product_category?: string | null;
  product_text?: string | null;
  origin_country?: string | null;
  notifying_country?: string | null;
  alert_date?: string | null;
  link?: string | null;
  risk_level?: string | null;
  hazard_category?: string | null;
};

const RASFF_URL =
  "https://api.datalake.sante.service.ec.europa.eu/rasff/irasff-general-info-view?format=json&api-version=v1.0";

const PAGE_LIMIT = Number(process.env.INGEST_PAGE_LIMIT || "2");

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


export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_INGEST_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const sb = supabaseServer();
  let nextUrl: string | null = RASFF_URL;
  let page = 0;
  let insertedFacts = 0;

  while (nextUrl && page < PAGE_LIMIT) {
    page += 1;
    const fetchUrl: string = nextUrl;
    const fetchRes = await fetch(fetchUrl);
    if (!fetchRes.ok) {
      console.error("RASFF fetch failed", fetchRes.status, await fetchRes.text());
      break;
    }

    const json = await fetchRes.json();
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

      // Auto-clean the record with pattern-based normalization
      const cleaned = autoCleanRecord(record);

      // Extract hazards from raw field (may contain multiple *** separated)
      const rawHazard = pick(record, ["hazard_category_name", "hazard_desc", "hazard"]) as string || "";
      const hazards = autoCleanHazards(rawHazard);

      // Create one row per hazard for filtering
      const factRows = hazards.map((hazard, idx) => ({
        id: hashToUUID(`${payload.source_id}-${hazard.name}-${idx}`),
        raw_id: rawRow.id,
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

      const { error: factErr } = await sb.from("alerts_fact").upsert(factRows, { onConflict: "id" });
      if (factErr) console.error("alerts_fact error", factErr);
      else insertedFacts += factRows.length;
    }
  }

  return NextResponse.json({ ok: true, pagesProcessed: page, factsUpserted: insertedFacts });
}
