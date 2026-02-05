-- Adaptive Normalizer Tables
-- Run this migration to enable database-driven normalization rules

-- Custom mappings table (overrides hardcoded rules)
CREATE TABLE IF NOT EXISTS normalization_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_type TEXT NOT NULL CHECK (mapping_type IN ('country', 'hazard', 'category', 'product')),
  raw_value TEXT NOT NULL,
  normalized_value TEXT NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mapping_type, raw_value)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_norm_mappings_lookup
  ON normalization_mappings(mapping_type, lower(raw_value));
CREATE INDEX IF NOT EXISTS idx_norm_mappings_confidence
  ON normalization_mappings(confidence DESC);

-- Unknown/unmatched values for review
CREATE TABLE IF NOT EXISTS unknown_normalization_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value_type TEXT NOT NULL CHECK (value_type IN ('country', 'hazard', 'category', 'product')),
  raw_value TEXT NOT NULL,
  occurrence_count INTEGER DEFAULT 1,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  suggested_mapping TEXT,
  is_reviewed BOOLEAN DEFAULT FALSE,
  UNIQUE(value_type, raw_value)
);

-- Index for finding high-frequency unknowns
CREATE INDEX IF NOT EXISTS idx_unknown_values_frequency
  ON unknown_normalization_values(value_type, occurrence_count DESC)
  WHERE is_reviewed = FALSE;

-- RPC function to efficiently track unknown values (upsert with increment)
CREATE OR REPLACE FUNCTION track_unknown_normalization_value(
  p_value_type TEXT,
  p_raw_value TEXT,
  p_suggested_mapping TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO unknown_normalization_values (value_type, raw_value, suggested_mapping)
  VALUES (p_value_type, p_raw_value, p_suggested_mapping)
  ON CONFLICT (value_type, raw_value) DO UPDATE SET
    occurrence_count = unknown_normalization_values.occurrence_count + 1,
    last_seen = NOW(),
    suggested_mapping = COALESCE(p_suggested_mapping, unknown_normalization_values.suggested_mapping);
END;
$$ LANGUAGE plpgsql;

-- RPC function to increment mapping usage count
CREATE OR REPLACE FUNCTION increment_mapping_usage(
  p_mapping_type TEXT,
  p_raw_value TEXT
) RETURNS VOID AS $$
BEGIN
  UPDATE normalization_mappings
  SET usage_count = usage_count + 1, updated_at = NOW()
  WHERE mapping_type = p_mapping_type AND lower(raw_value) = lower(p_raw_value);
END;
$$ LANGUAGE plpgsql;

-- Add some starter mappings based on common patterns
-- These supplement the hardcoded ones and can be extended via the database

INSERT INTO normalization_mappings (mapping_type, raw_value, normalized_value, confidence) VALUES
  -- Country variations often seen in RASFF data
  ('country', 'Viet nam', 'Vietnam', 1.0),
  ('country', 'VIETNAM', 'Vietnam', 1.0),
  ('country', 'INDIA', 'India', 1.0),
  ('country', 'CHINA', 'China', 1.0),
  ('country', 'U.S.A.', 'USA', 1.0),
  ('country', 'UNITED STATES OF AMERICA', 'USA', 1.0),

  -- Hazard variations
  ('hazard', 'SALMONELLA', 'Salmonella', 1.0),
  ('hazard', 'Salmonella species', 'Salmonella', 1.0),
  ('hazard', 'L. monocytogenes', 'Listeria', 1.0),
  ('hazard', 'LISTERIA MONOCYTOGENES', 'Listeria', 1.0),
  ('hazard', 'Aflatoxin B1 and total', 'Aflatoxin', 1.0),

  -- Product category simplifications
  ('category', 'fish and fish products', 'Fish & Seafood', 1.0),
  ('category', 'FISH AND FISH PRODUCTS', 'Fish & Seafood', 1.0),
  ('category', 'nuts, nut products and seeds', 'Nuts & Seeds', 1.0)
ON CONFLICT (mapping_type, raw_value) DO NOTHING;

-- View to see most common unknown values needing review
CREATE OR REPLACE VIEW unknown_values_to_review AS
SELECT
  value_type,
  raw_value,
  occurrence_count,
  suggested_mapping,
  first_seen,
  last_seen
FROM unknown_normalization_values
WHERE is_reviewed = FALSE
ORDER BY occurrence_count DESC;

COMMENT ON TABLE normalization_mappings IS 'Custom normalization rules that supplement/override hardcoded mappings';
COMMENT ON TABLE unknown_normalization_values IS 'Tracks unmapped values for review and potential rule creation';
