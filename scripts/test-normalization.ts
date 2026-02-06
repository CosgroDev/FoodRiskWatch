/**
 * Test script to verify RASFF data normalization
 * Run with: npx tsx scripts/test-normalization.ts
 */

import { normalizeHazard, normalizeCategory, normalizeCountry } from "../lib/normalize";

const RASFF_URL =
  "https://api.datalake.sante.service.ec.europa.eu/rasff/irasff-general-info-view?format=json&api-version=v1.0";

type RawRecord = Record<string, unknown>;

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

async function main() {
  console.log("Fetching RASFF data...\n");

  const res = await fetch(RASFF_URL);
  if (!res.ok) {
    console.error("Failed to fetch:", res.status);
    return;
  }

  const json = await res.json();
  const records: RawRecord[] = json.value || json.records || [];

  console.log(`Got ${records.length} records\n`);

  if (records.length === 0) {
    console.log("No records found");
    return;
  }

  // Show first record's keys
  console.log("=== FIRST RECORD KEYS ===");
  console.log(Object.keys(records[0]).join(", "));
  console.log("\n=== FIRST RECORD VALUES ===");
  console.log(JSON.stringify(records[0], null, 2));

  // Collect unique values
  const hazards = new Set<string>();
  const categories = new Set<string>();
  const countries = new Set<string>();

  const rawHazards = new Set<string>();
  const rawCategories = new Set<string>();
  const rawCountries = new Set<string>();

  for (const record of records.slice(0, 50)) {
    // Extract raw values using the same logic as ingest
    const rawHazard = pick(record, ["hazard_category_name", "hazard_desc", "hazard"]) as string | undefined;
    const rawCategory = pick(record, ["product_category_desc", "productCategory", "product_category"]) as string | undefined;
    const rawCountry = pick(record, ["origin_country_desc", "originCountry", "countryOfOrigin", "country"]) as string | undefined;

    if (rawHazard) {
      rawHazards.add(rawHazard);
      const normalized = normalizeHazard(rawHazard);
      if (normalized) hazards.add(normalized);
    }

    if (rawCategory) {
      rawCategories.add(rawCategory);
      const normalized = normalizeCategory(rawCategory);
      if (normalized) categories.add(normalized);
    }

    if (rawCountry) {
      rawCountries.add(rawCountry);
      const normalized = normalizeCountry(rawCountry);
      if (normalized) countries.add(normalized);
    }
  }

  console.log("\n=== RAW vs NORMALIZED HAZARDS ===");
  Array.from(rawHazards).sort().forEach(raw => {
    const normalized = normalizeHazard(raw);
    const changed = raw !== normalized;
    console.log(`${changed ? "✓" : "✗"} "${raw}" → "${normalized}"`);
  });

  console.log("\n=== RAW vs NORMALIZED CATEGORIES ===");
  Array.from(rawCategories).sort().forEach(raw => {
    const normalized = normalizeCategory(raw);
    const changed = raw !== normalized;
    console.log(`${changed ? "✓" : "✗"} "${raw}" → "${normalized}"`);
  });

  console.log("\n=== RAW vs NORMALIZED COUNTRIES ===");
  Array.from(rawCountries).sort().forEach(raw => {
    const normalized = normalizeCountry(raw);
    const changed = raw !== normalized;
    console.log(`${changed ? "✓" : "✗"} "${raw}" → "${normalized}"`);
  });

  console.log("\n=== FINAL NORMALIZED VALUES ===");
  console.log("Hazards:", Array.from(hazards).sort().join(", "));
  console.log("Categories:", Array.from(categories).sort().join(", "));
  console.log("Countries:", Array.from(countries).sort().join(", "));
}

main().catch(console.error);
