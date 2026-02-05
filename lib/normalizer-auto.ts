/**
 * Auto-Learning Normalizer
 *
 * Automatically cleans data with minimal human intervention using:
 * - Pattern-based rules (regex) for common variations
 * - Fuzzy matching with auto-apply for high-confidence matches
 * - Self-learning from existing clean data
 */

// ============================================================================
// Pattern-Based Auto-Normalization
// ============================================================================

// Hazard patterns - if raw value matches pattern, normalize to the canonical name
const HAZARD_PATTERNS: { pattern: RegExp; canonical: string; category: string }[] = [
  // Salmonella variants
  { pattern: /salmonella/i, canonical: "Salmonella", category: "Pathogen" },

  // Listeria variants
  { pattern: /listeria|l\.\s*monocytogenes/i, canonical: "Listeria", category: "Pathogen" },

  // E. coli variants
  { pattern: /e\.?\s*coli|escherichia/i, canonical: "E. coli", category: "Pathogen" },

  // Aflatoxin variants
  { pattern: /aflatoxin/i, canonical: "Aflatoxin", category: "Mycotoxin" },

  // Ochratoxin variants
  { pattern: /ochratoxin/i, canonical: "Ochratoxin", category: "Mycotoxin" },

  // Other mycotoxins
  { pattern: /mycotoxin|deoxynivalenol|zearalenone|fumonisin/i, canonical: "Mycotoxin", category: "Mycotoxin" },

  // Pesticides - keep specific name but categorize
  { pattern: /chlorpyrifos/i, canonical: "Chlorpyrifos", category: "Pesticide" },
  { pattern: /carbendazim/i, canonical: "Carbendazim", category: "Pesticide" },
  { pattern: /ethylene oxide/i, canonical: "Ethylene Oxide", category: "Pesticide" },
  { pattern: /pesticide/i, canonical: "Pesticide Residue", category: "Pesticide" },

  // Heavy metals
  { pattern: /mercury|hg\b/i, canonical: "Mercury", category: "Heavy Metal" },
  { pattern: /cadmium|cd\b/i, canonical: "Cadmium", category: "Heavy Metal" },
  { pattern: /lead|pb\b/i, canonical: "Lead", category: "Heavy Metal" },
  { pattern: /arsenic|as\b/i, canonical: "Arsenic", category: "Heavy Metal" },

  // Allergens
  { pattern: /allergen|undeclared\s+(milk|egg|peanut|nut|soy|wheat|gluten|sesame|fish|shellfish|sulphite)/i, canonical: "Undeclared Allergen", category: "Allergen" },
  { pattern: /milk.*not.*declared|undeclared.*milk/i, canonical: "Undeclared Milk", category: "Allergen" },
  { pattern: /peanut.*not.*declared|undeclared.*peanut/i, canonical: "Undeclared Peanut", category: "Allergen" },
  { pattern: /gluten.*not.*declared|undeclared.*gluten/i, canonical: "Undeclared Gluten", category: "Allergen" },

  // Foreign bodies
  { pattern: /foreign bod|glass|metal|plastic.*fragment|insect/i, canonical: "Foreign Body", category: "Foreign Body" },

  // Norovirus
  { pattern: /norovirus/i, canonical: "Norovirus", category: "Pathogen" },

  // Hepatitis
  { pattern: /hepatitis/i, canonical: "Hepatitis A", category: "Pathogen" },

  // Campylobacter
  { pattern: /campylobacter/i, canonical: "Campylobacter", category: "Pathogen" },

  // Clostridium
  { pattern: /clostridium|botul/i, canonical: "Clostridium", category: "Pathogen" },

  // Histamine
  { pattern: /histamine/i, canonical: "Histamine", category: "Natural Toxin" },

  // Dioxins/PCBs
  { pattern: /dioxin|pcb/i, canonical: "Dioxins/PCBs", category: "Pollutant" },

  // Migration from packaging
  { pattern: /migration|bpa|phthalate/i, canonical: "Migration", category: "Migration" },

  // Novel food / unauthorized
  { pattern: /novel food|unauthori[sz]ed/i, canonical: "Unauthorized Substance", category: "Novel Food" },

  // Labelling
  { pattern: /label|missing.*information|incorrect.*marking/i, canonical: "Labelling Issue", category: "Labelling" },
];

// Country patterns - normalize variations
const COUNTRY_PATTERNS: { pattern: RegExp; canonical: string }[] = [
  { pattern: /^türkiye$|^turkiye$|^turkey$/i, canonical: "Turkey" },
  { pattern: /^u\.?s\.?a?\.?$|^united\s*states/i, canonical: "USA" },
  { pattern: /^u\.?k\.?$|^united\s*kingdom|^great\s*britain/i, canonical: "UK" },
  { pattern: /^viet\s*nam$/i, canonical: "Vietnam" },
  { pattern: /^czech\s*republic$/i, canonical: "Czechia" },
  { pattern: /^the\s*netherlands$/i, canonical: "Netherlands" },
  { pattern: /^russian\s*federation$/i, canonical: "Russia" },
  { pattern: /^republic\s*of\s*korea|^korea.*republic/i, canonical: "South Korea" },
  { pattern: /^china|^people.*republic.*china/i, canonical: "China" },
  { pattern: /^india$/i, canonical: "India" },
  { pattern: /^brasil$/i, canonical: "Brazil" },
  { pattern: /^unknown|^not\s*determined|^n\/a$/i, canonical: "Unknown" },
];

// Product category simplifications
const CATEGORY_PATTERNS: { pattern: RegExp; canonical: string }[] = [
  { pattern: /meat.*product|meat.*poultry/i, canonical: "Meat Products" },
  { pattern: /poultry|chicken|turkey.*meat/i, canonical: "Poultry" },
  { pattern: /fish|seafood|crustacean|mollusc|cephalopod/i, canonical: "Fish & Seafood" },
  { pattern: /nut.*seed|seed.*nut/i, canonical: "Nuts & Seeds" },
  { pattern: /fruit.*vegetable|vegetable.*fruit|produce/i, canonical: "Fruits & Vegetables" },
  { pattern: /cereal.*bakery|bakery.*cereal|bread|pastry/i, canonical: "Cereals & Bakery" },
  { pattern: /milk.*product|dairy|cheese|yogurt/i, canonical: "Dairy" },
  { pattern: /herb.*spice|spice.*herb/i, canonical: "Herbs & Spices" },
  { pattern: /supplement|dietetic|vitamin/i, canonical: "Supplements" },
  { pattern: /cocoa|coffee|tea/i, canonical: "Cocoa, Coffee & Tea" },
  { pattern: /fat.*oil|oil.*fat/i, canonical: "Fats & Oils" },
  { pattern: /sauce|condiment|soup|broth/i, canonical: "Sauces & Condiments" },
  { pattern: /prepared.*dish|snack|ready.*eat/i, canonical: "Prepared Foods" },
  { pattern: /beverage|drink/i, canonical: "Beverages" },
  { pattern: /egg/i, canonical: "Eggs" },
  { pattern: /food.*contact|packaging.*material/i, canonical: "Food Contact Materials" },
  { pattern: /feed|animal.*feed/i, canonical: "Animal Feed" },
  { pattern: /pet.*food/i, canonical: "Pet Food" },
  { pattern: /additive|flavour/i, canonical: "Additives" },
  { pattern: /confection|sweet|candy|chocolate/i, canonical: "Confectionery" },
  { pattern: /ice.*cream|dessert|frozen.*dessert/i, canonical: "Desserts" },
];

// ============================================================================
// Auto-Normalize Functions
// ============================================================================

/**
 * Auto-normalize a hazard string using pattern matching
 */
export function autoNormalizeHazard(raw: string): { name: string; category: string } {
  if (!raw) return { name: "Unknown", category: "Unknown" };

  const cleaned = raw.trim();

  // Try pattern matching first
  for (const { pattern, canonical, category } of HAZARD_PATTERNS) {
    if (pattern.test(cleaned)) {
      return { name: canonical, category };
    }
  }

  // Extract category from {braces} if present
  const categoryMatch = cleaned.match(/\{([^}]+)\}/);
  let category = "Other";
  let name = cleaned;

  if (categoryMatch) {
    const rawCat = categoryMatch[1].toLowerCase();
    category = simplifyCategory(rawCat);
    name = cleaned.replace(/\s*-\s*\{[^}]+\}\s*$/, "").trim();
  }

  // Clean up the name
  name = name
    .replace(/\s+/g, " ")
    .replace(/^["']|["']$/g, "")
    .trim();

  // Title case if all caps
  if (name === name.toUpperCase() && name.length > 3) {
    name = titleCase(name);
  }

  return { name, category };
}

/**
 * Auto-normalize a country string using pattern matching
 */
export function autoNormalizeCountry(raw: string): string {
  if (!raw) return "Unknown";

  let cleaned = raw.trim();

  // Fix common UTF-8 issues
  cleaned = fixUtf8(cleaned);

  // Try pattern matching
  for (const { pattern, canonical } of COUNTRY_PATTERNS) {
    if (pattern.test(cleaned)) {
      return canonical;
    }
  }

  // Handle all-caps
  if (cleaned === cleaned.toUpperCase() && cleaned.length > 3) {
    cleaned = titleCase(cleaned);
  }

  return cleaned || "Unknown";
}

/**
 * Auto-normalize a product category
 */
export function autoNormalizeCategory(raw: string): string {
  if (!raw) return "Other";

  const cleaned = raw.trim().toLowerCase();

  // Try pattern matching
  for (const { pattern, canonical } of CATEGORY_PATTERNS) {
    if (pattern.test(cleaned)) {
      return canonical;
    }
  }

  // Simplify if it's a known verbose category
  return simplifyCategory(cleaned);
}

/**
 * Auto-normalize product text (name)
 */
export function autoNormalizeProductText(raw: string): string {
  if (!raw) return "Product not specified";

  let text = fixUtf8(raw.trim());

  // Handle all-caps
  if (text === text.toUpperCase() && text.length > 3) {
    text = titleCase(text);
  }

  // Clean up extra whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text || "Product not specified";
}

// ============================================================================
// Helper Functions
// ============================================================================

function simplifyCategory(raw: string): string {
  const simplifications: Record<string, string> = {
    "pathogenic micro-organisms": "Pathogen",
    "mycotoxins": "Mycotoxin",
    "pesticide residues": "Pesticide",
    "heavy metals": "Heavy Metal",
    "novel food": "Novel Food",
    "labelling absent/incomplete/incorrect": "Labelling",
    "natural toxins (other)": "Natural Toxin",
    "environmental pollutants": "Pollutant",
    "industrial contaminants": "Contaminant",
    "migration": "Migration",
    "composition": "Composition",
    "biological contaminants": "Biological",
    "chemical contamination (other)": "Chemical",
    "non-pathogenic micro-organisms": "Micro-organism",
    "food additives and flavourings": "Additive",
    "allergens": "Allergen",
    "foreign bodies": "Foreign Body",
    "gmo / novel food": "GMO/Novel Food",
    "parasitic infestation": "Parasite",
    "radiation": "Radiation",
    "tses": "TSE",
    "adulteration / fraud": "Fraud",
    "organoleptic aspects": "Quality",
    "packaging defective / incorrect": "Packaging",
    "poor or insufficient controls": "Controls",
  };

  return simplifications[raw.toLowerCase()] || titleCase(raw);
}

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const UTF8_FIXES: Record<string, string> = {
  "TÃ¼rkiye": "Türkiye",
  "CÃ´te d'Ivoire": "Côte d'Ivoire",
  "CuraÃ§ao": "Curaçao",
  "RÃ©union": "Réunion",
  "SÃ£o TomÃ©": "São Tomé",
  "Ã…land": "Åland",
  "Ã–sterreich": "Österreich",
  "fÃ¼r": "für",
  "Ã¤": "ä",
  "Ã¶": "ö",
  "Ã¼": "ü",
  "Ã©": "é",
  "Ã¨": "è",
  "Ã ": "à",
  "Ã¢": "â",
  "Ã®": "î",
  "Ã´": "ô",
  "Ã»": "û",
  "Ã±": "ñ",
  "Ã§": "ç",
};

function fixUtf8(str: string): string {
  let fixed = str;
  for (const [broken, correct] of Object.entries(UTF8_FIXES)) {
    fixed = fixed.replace(new RegExp(broken, "g"), correct);
  }
  return fixed;
}

// ============================================================================
// Main Auto-Clean Function
// ============================================================================

export type AutoCleanedAlert = {
  hazard: string;
  hazardCategory: string;
  productText: string;
  productCategory: string;
  originCountry: string;
  notifyingCountry: string;
  riskLevel: string;
  alertDate: string | null;
  link: string | null;
};

/**
 * Fully auto-clean a raw RASFF record with no manual intervention needed
 */
export function autoCleanRecord(record: Record<string, unknown>): AutoCleanedAlert {
  // Helper to get field value
  const pick = (candidates: string[]): string => {
    for (const key of candidates) {
      const found = Object.keys(record).find((k) => k.toLowerCase() === key.toLowerCase());
      if (found && record[found] != null) {
        return String(record[found]).trim();
      }
    }
    return "";
  };

  // Extract raw values
  const rawHazard = pick(["hazard_category_name", "hazard_desc", "hazard"]);
  const rawProduct = pick(["product_name", "product", "productText", "productDescription"]);
  const rawCategory = pick(["product_category_desc", "product_category"]);
  const rawOrigin = pick(["origin_country_desc", "origin_country"]);
  const rawNotifying = pick(["notifyng_country_desc", "notifying_country_desc", "notifying_country"]);
  const rawRisk = pick(["risk_decision_desc", "risk_decision"]);
  const rawDate = pick(["notif_date", "alertDate", "date"]);
  const rawRef = pick(["notification_reference", "referenceNumber"]);

  // Auto-clean each field
  const { name: hazard, category: hazardCategory } = autoNormalizeHazard(rawHazard);
  const productText = autoNormalizeProductText(rawProduct);
  const productCategory = autoNormalizeCategory(rawCategory);
  const originCountry = autoNormalizeCountry(rawOrigin);
  const notifyingCountry = autoNormalizeCountry(rawNotifying);

  // Normalize risk level
  let riskLevel = "Unknown";
  const risk = rawRisk.toLowerCase();
  if (risk.includes("serious") && !risk.includes("not")) {
    riskLevel = "Serious";
  } else if (risk.includes("potential")) {
    riskLevel = "Potential Risk";
  } else if (risk.includes("not serious")) {
    riskLevel = "Not Serious";
  } else if (risk.includes("no risk")) {
    riskLevel = "No Risk";
  } else if (risk.includes("undecided")) {
    riskLevel = "Under Review";
  }

  // Build link
  const link = rawRef
    ? `https://webgate.ec.europa.eu/rasff-window/screen/notification/${rawRef}`
    : null;

  return {
    hazard,
    hazardCategory,
    productText,
    productCategory,
    originCountry,
    notifyingCountry,
    riskLevel,
    alertDate: rawDate || null,
    link,
  };
}

/**
 * Parse multiple hazards from a *** separated string
 */
export function autoCleanHazards(raw: string): { name: string; category: string }[] {
  if (!raw) return [{ name: "Unknown", category: "Unknown" }];

  const hazardStrings = raw.split(/\s*\*\*\*\s*/);
  const results: { name: string; category: string }[] = [];
  const seen = new Set<string>();

  for (const str of hazardStrings) {
    const { name, category } = autoNormalizeHazard(str);
    if (!seen.has(name)) {
      seen.add(name);
      results.push({ name, category });
    }
  }

  return results.length > 0 ? results : [{ name: "Unknown", category: "Unknown" }];
}

/**
 * Parse multiple countries from a *** separated string
 */
export function autoCleanCountries(raw: string): string[] {
  if (!raw) return [];

  return raw
    .split(/\s*\*\*\*\s*/)
    .map(autoNormalizeCountry)
    .filter((c) => c !== "Unknown");
}
