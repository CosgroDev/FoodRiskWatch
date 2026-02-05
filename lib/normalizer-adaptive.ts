/**
 * Adaptive Normalizer Extension
 *
 * This module extends the base normalizer with:
 * 1. Database-backed custom mappings (overrides hardcoded rules)
 * 2. Analytics tracking for unknown values
 * 3. Fuzzy matching for close matches
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// Types for database-stored mappings
export type NormalizationMapping = {
  id: string;
  mapping_type: "country" | "hazard" | "category" | "product";
  raw_value: string;
  normalized_value: string;
  confidence: number; // 0-1, how confident we are in this mapping
  usage_count: number;
  created_at: string;
  updated_at: string;
};

export type UnknownValue = {
  id: string;
  value_type: "country" | "hazard" | "category" | "product";
  raw_value: string;
  occurrence_count: number;
  first_seen: string;
  last_seen: string;
  suggested_mapping: string | null;
  is_reviewed: boolean;
};

// In-memory cache for mappings (refreshed periodically)
let mappingsCache: Map<string, Map<string, string>> = new Map();
let cacheLastRefresh = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Load custom mappings from database into cache
 */
export async function refreshMappingsCache(sb: SupabaseClient): Promise<void> {
  const { data, error } = await sb
    .from("normalization_mappings")
    .select("mapping_type, raw_value, normalized_value")
    .gte("confidence", 0.8) // Only use high-confidence mappings
    .order("usage_count", { ascending: false });

  if (error) {
    console.error("Failed to load normalization mappings:", error);
    return;
  }

  // Rebuild cache
  mappingsCache = new Map();
  for (const row of data || []) {
    if (!mappingsCache.has(row.mapping_type)) {
      mappingsCache.set(row.mapping_type, new Map());
    }
    const typeMap = mappingsCache.get(row.mapping_type)!;
    // Store lowercase key for case-insensitive lookup
    typeMap.set(row.raw_value.toLowerCase(), row.normalized_value);
  }

  cacheLastRefresh = Date.now();
}

/**
 * Get custom mapping from cache (with auto-refresh)
 */
export async function getCustomMapping(
  sb: SupabaseClient,
  type: "country" | "hazard" | "category" | "product",
  rawValue: string
): Promise<string | null> {
  // Refresh cache if stale
  if (Date.now() - cacheLastRefresh > CACHE_TTL_MS) {
    await refreshMappingsCache(sb);
  }

  const typeMap = mappingsCache.get(type);
  if (!typeMap) return null;

  return typeMap.get(rawValue.toLowerCase()) || null;
}

/**
 * Track an unknown/unmapped value for later review
 */
export async function trackUnknownValue(
  sb: SupabaseClient,
  type: "country" | "hazard" | "category" | "product",
  rawValue: string,
  suggestedMapping?: string
): Promise<void> {
  const normalizedRaw = rawValue.trim();
  if (!normalizedRaw || normalizedRaw.length < 2) return;

  // Upsert: increment count if exists, create if not
  const { error } = await sb.rpc("track_unknown_normalization_value", {
    p_value_type: type,
    p_raw_value: normalizedRaw,
    p_suggested_mapping: suggestedMapping || null,
  });

  if (error) {
    // Fallback to simple insert/update if RPC doesn't exist
    const { data: existing } = await sb
      .from("unknown_normalization_values")
      .select("id, occurrence_count")
      .eq("value_type", type)
      .eq("raw_value", normalizedRaw)
      .maybeSingle();

    if (existing) {
      await sb
        .from("unknown_normalization_values")
        .update({
          occurrence_count: existing.occurrence_count + 1,
          last_seen: new Date().toISOString(),
          suggested_mapping: suggestedMapping || undefined,
        })
        .eq("id", existing.id);
    } else {
      await sb.from("unknown_normalization_values").insert({
        value_type: type,
        raw_value: normalizedRaw,
        occurrence_count: 1,
        suggested_mapping: suggestedMapping || null,
      });
    }
  }
}

/**
 * Simple fuzzy match using Levenshtein distance
 * Returns the best match if similarity is above threshold
 */
export function fuzzyMatch(
  input: string,
  candidates: string[],
  threshold: number = 0.8
): { match: string; similarity: number } | null {
  const inputLower = input.toLowerCase();
  let bestMatch: string | null = null;
  let bestSimilarity = 0;

  for (const candidate of candidates) {
    const candidateLower = candidate.toLowerCase();
    const similarity = stringSimilarity(inputLower, candidateLower);

    if (similarity > bestSimilarity && similarity >= threshold) {
      bestSimilarity = similarity;
      bestMatch = candidate;
    }
  }

  return bestMatch ? { match: bestMatch, similarity: bestSimilarity } : null;
}

/**
 * Calculate string similarity (0-1) using Levenshtein distance
 */
function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const distance = matrix[b.length][a.length];
  const maxLength = Math.max(a.length, b.length);
  return 1 - distance / maxLength;
}

/**
 * Add a new confirmed mapping to the database
 */
export async function addMapping(
  sb: SupabaseClient,
  type: "country" | "hazard" | "category" | "product",
  rawValue: string,
  normalizedValue: string,
  confidence: number = 1.0
): Promise<boolean> {
  const { error } = await sb.from("normalization_mappings").upsert(
    {
      mapping_type: type,
      raw_value: rawValue.trim(),
      normalized_value: normalizedValue.trim(),
      confidence,
      usage_count: 1,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "mapping_type,raw_value" }
  );

  if (error) {
    console.error("Failed to add mapping:", error);
    return false;
  }

  // Mark as reviewed in unknown values if it exists
  await sb
    .from("unknown_normalization_values")
    .update({ is_reviewed: true })
    .eq("value_type", type)
    .eq("raw_value", rawValue.trim());

  // Invalidate cache
  cacheLastRefresh = 0;

  return true;
}

/**
 * Get analytics on normalization patterns
 */
export async function getNormalizationStats(sb: SupabaseClient): Promise<{
  totalMappings: number;
  unknownValues: { type: string; count: number; topValues: string[] }[];
  recentAdditions: NormalizationMapping[];
}> {
  // Count total mappings
  const { count: totalMappings } = await sb
    .from("normalization_mappings")
    .select("*", { count: "exact", head: true });

  // Get unknown values grouped by type
  const { data: unknownData } = await sb
    .from("unknown_normalization_values")
    .select("value_type, raw_value, occurrence_count")
    .eq("is_reviewed", false)
    .order("occurrence_count", { ascending: false })
    .limit(100);

  const unknownByType = new Map<string, { count: number; values: string[] }>();
  for (const row of unknownData || []) {
    if (!unknownByType.has(row.value_type)) {
      unknownByType.set(row.value_type, { count: 0, values: [] });
    }
    const entry = unknownByType.get(row.value_type)!;
    entry.count += row.occurrence_count;
    if (entry.values.length < 10) {
      entry.values.push(row.raw_value);
    }
  }

  const unknownValues = Array.from(unknownByType.entries()).map(([type, data]) => ({
    type,
    count: data.count,
    topValues: data.values,
  }));

  // Get recent mapping additions
  const { data: recentData } = await sb
    .from("normalization_mappings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    totalMappings: totalMappings || 0,
    unknownValues,
    recentAdditions: (recentData || []) as NormalizationMapping[],
  };
}
