/**
 * RASFF Data Normalizer
 * Transforms raw RASFF API data into clean, human-readable format
 */

type RawRecord = Record<string, unknown>;

// ============================================================================
// UTF-8 Encoding Fixes
// ============================================================================

const UTF8_FIXES: Record<string, string> = {
  // Common broken UTF-8 sequences
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
// Country Normalization
// ============================================================================

const COUNTRY_ALIASES: Record<string, string> = {
  // Standardize country names
  "Türkiye": "Turkey",
  "Turkiye": "Turkey",
  "TÃ¼rkiye": "Turkey",
  "United States": "USA",
  "United States of America": "USA",
  "United Kingdom": "UK",
  "Great Britain": "UK",
  "Czech Republic": "Czechia",
  "The Netherlands": "Netherlands",
  "Russian Federation": "Russia",
  "Republic of Korea": "South Korea",
  "Korea, Republic of": "South Korea",
  "Viet Nam": "Vietnam",
  "unknown origin": "Unknown",
  "Unknown origin": "Unknown",
};

export function normalizeCountry(country: string | null | undefined): string | null {
  if (!country) return null;

  let normalized = fixUtf8(country.trim());

  // Check for aliases
  if (COUNTRY_ALIASES[normalized]) {
    normalized = COUNTRY_ALIASES[normalized];
  }

  return normalized || null;
}

export function normalizeCountries(raw: string | null | undefined): string[] {
  if (!raw) return [];

  // Split by *** separator
  return raw
    .split(/\s*\*\*\*\s*/)
    .map((c) => normalizeCountry(c))
    .filter((c): c is string => c !== null && c !== "Unknown");
}

// ============================================================================
// Hazard Normalization
// ============================================================================

// Hazard category mappings for cleaner display
const HAZARD_CATEGORIES: Record<string, string> = {
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
  "GMO / novel food": "GMO/Novel Food",
  "parasitic infestation": "Parasite",
  "radiation": "Radiation",
  "TSEs": "TSE",
  "adulteration / fraud": "Fraud",
  "organoleptic aspects": "Quality",
  "packaging defective / incorrect": "Packaging",
  "poor or insufficient controls": "Controls",
};

// Hazard name normalization
const HAZARD_ALIASES: Record<string, string> = {
  // Salmonella variants
  "Salmonella spp.": "Salmonella",
  "Salmonella spp": "Salmonella",
  "Salmonella Enteritidis": "Salmonella",
  "Salmonella enteritidis": "Salmonella",
  "Salmonella Typhimurium": "Salmonella",
  "Salmonella group B": "Salmonella",
  "Salmonella group C": "Salmonella",
  "Salmonella chester": "Salmonella",

  // Listeria variants
  "Listeria monocytogenes": "Listeria",

  // E. coli variants
  "Escherichia coli shigatoxin-producing": "E. coli (STEC)",
  "Escherichia coli": "E. coli",
  "E.coli": "E. coli",

  // Aflatoxin variants
  "Aflatoxin B1": "Aflatoxin",
  "aflatoxin total": "Aflatoxin",
  "Aflatoxin total": "Aflatoxin",
  "aflatoxins": "Aflatoxin",

  // Other common normalizations
  "ochratoxin A": "Ochratoxin A",
  "Ochratoxin A": "Ochratoxin A",
};

export type ParsedHazard = {
  name: string;           // Clean hazard name (e.g., "Salmonella")
  category: string;       // Category (e.g., "Pathogen")
  qualifier: string | null; // Optional qualifier (e.g., "unauthorised substance")
  raw: string;            // Original raw string
};

function parseHazardString(hazardStr: string): ParsedHazard {
  // Format: "hazard_name qualifier - {category}"
  // Example: "Salmonella spp.  - {pathogenic micro-organisms}"
  // Example: "chlorpyrifos  unauthorised substance - {pesticide residues}"

  const raw = hazardStr.trim();
  let name = raw;
  let category = "Other";
  let qualifier: string | null = null;

  // Extract category from {braces}
  const categoryMatch = raw.match(/\{([^}]+)\}/);
  if (categoryMatch) {
    const rawCategory = categoryMatch[1].trim();
    category = HAZARD_CATEGORIES[rawCategory] || titleCase(rawCategory);
    name = raw.replace(/\s*-\s*\{[^}]+\}\s*$/, "").trim();
  }

  // Extract qualifier (words after main hazard name)
  // Common qualifiers: "unauthorised substance", "too high count", "prohibited substance", etc.
  const qualifierPatterns = [
    /\s+(unauthorised(?:\s+substance)?)/i,
    /\s+(prohibited(?:\s+substance)?)/i,
    /\s+(too high(?:\s+\w+)?)/i,
    /\s+(migration)/i,
    /\s+(incorrect)/i,
    /\s+(insufficient)/i,
  ];

  for (const pattern of qualifierPatterns) {
    const match = name.match(pattern);
    if (match) {
      qualifier = match[1].toLowerCase();
      name = name.replace(pattern, "").trim();
      break;
    }
  }

  // Clean up extra spaces
  name = name.replace(/\s+/g, " ").trim();

  // Apply aliases
  if (HAZARD_ALIASES[name]) {
    name = HAZARD_ALIASES[name];
  } else {
    // Title case if not in aliases
    name = titleCase(name);
  }

  return { name, category, qualifier, raw };
}

export function normalizeHazards(raw: string | null | undefined): ParsedHazard[] {
  if (!raw) return [];

  // Split by *** separator
  const hazardStrings = raw.split(/\s*\*\*\*\s*/);

  const parsed = hazardStrings.map(parseHazardString);

  // Deduplicate by name
  const seen = new Set<string>();
  return parsed.filter((h) => {
    if (seen.has(h.name)) return false;
    seen.add(h.name);
    return true;
  });
}

// Get a single clean hazard name for display (first/primary hazard)
export function getPrimaryHazard(raw: string | null | undefined): string {
  const hazards = normalizeHazards(raw);
  return hazards.length > 0 ? hazards[0].name : "Unknown";
}

// Get hazard with category badge text
export function getHazardDisplay(raw: string | null | undefined): { name: string; category: string }[] {
  return normalizeHazards(raw).map((h) => ({
    name: h.name,
    category: h.category,
  }));
}

// ============================================================================
// Product Normalization
// ============================================================================

export function normalizeProductName(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let name = fixUtf8(raw.trim());

  // Convert ALL CAPS to title case
  if (name === name.toUpperCase() && name.length > 3) {
    name = titleCase(name);
  }

  // Fix common inconsistencies
  name = name
    .replace(/\s+/g, " ")
    .trim();

  return name || null;
}

export function normalizeProductCategory(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let category = fixUtf8(raw.trim());

  // Simplify long category names
  const categorySimplifications: Record<string, string> = {
    "dietetic foods, food supplements and fortified foods": "Supplements & Dietetic Foods",
    "cocoa and cocoa preparations, coffee and tea": "Cocoa, Coffee & Tea",
    "meat and meat products (other than poultry)": "Meat Products",
    "poultry meat and poultry meat products": "Poultry",
    "nuts, nut products and seeds": "Nuts & Seeds",
    "fish and fish products": "Fish & Seafood",
    "cereals and bakery products": "Cereals & Bakery",
    "fruits and vegetables": "Fruits & Vegetables",
    "herbs and spices": "Herbs & Spices",
    "milk and milk products": "Dairy",
    "fats and oils": "Fats & Oils",
    "prepared dishes and snacks": "Prepared Foods",
    "soups, broths, sauces and condiments": "Sauces & Condiments",
    "food contact materials": "Food Contact Materials",
    "non-alcoholic beverages": "Beverages",
    "alcoholic beverages": "Alcoholic Beverages",
    "bivalve molluscs and products thereof": "Shellfish",
    "cephalopods and products thereof": "Cephalopods",
    "crustaceans and products thereof": "Crustaceans",
    "eggs and egg products": "Eggs",
    "ices and desserts": "Desserts",
    "food additives and flavourings": "Additives",
    "other food product / mixed": "Other",
    "live animals": "Live Animals",
    "feed materials": "Animal Feed",
    "compound feeds": "Animal Feed",
    "feed additives": "Feed Additives",
    "pet food": "Pet Food",
  };

  return categorySimplifications[category.toLowerCase()] || titleCase(category);
}

// ============================================================================
// Risk Level Normalization
// ============================================================================

export type RiskLevel = "serious" | "potentially-serious" | "not-serious" | "no-risk" | "undecided" | "unknown";

export function normalizeRiskLevel(raw: string | null | undefined): RiskLevel {
  if (!raw) return "unknown";

  const lower = raw.toLowerCase().trim();

  switch (lower) {
    case "serious":
      return "serious";
    case "potentially serious":
      return "potentially-serious";
    case "potential risk":
      return "potentially-serious";
    case "not serious":
      return "not-serious";
    case "no risk":
      return "no-risk";
    case "undecided":
      return "undecided";
    default:
      return "unknown";
  }
}

export function getRiskLevelDisplay(level: RiskLevel): { label: string; color: string } {
  switch (level) {
    case "serious":
      return { label: "Serious", color: "#dc2626" }; // red
    case "potentially-serious":
      return { label: "Potential Risk", color: "#f59e0b" }; // amber
    case "not-serious":
      return { label: "Not Serious", color: "#3b82f6" }; // blue
    case "no-risk":
      return { label: "No Risk", color: "#22c55e" }; // green
    case "undecided":
      return { label: "Under Review", color: "#6b7280" }; // gray
    default:
      return { label: "Unknown", color: "#6b7280" }; // gray
  }
}

// ============================================================================
// Date Normalization
// ============================================================================

export function normalizeDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;

  try {
    const date = new Date(raw);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

export function formatDateDisplay(raw: string | null | undefined): string {
  const date = normalizeDate(raw);
  if (!date) return "Unknown date";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Case-insensitive field getter for RASFF records
export function pickField(record: RawRecord, fieldNames: string[]): string | null {
  for (const field of fieldNames) {
    const key = Object.keys(record).find((k) => k.toLowerCase() === field.toLowerCase());
    if (key && record[key] !== null && record[key] !== undefined) {
      return String(record[key]).trim();
    }
  }
  return null;
}

// ============================================================================
// Complete Record Normalizer
// ============================================================================

export type NormalizedAlert = {
  hazards: ParsedHazard[];
  primaryHazard: string;
  hazardCategory: string;
  productName: string | null;
  productCategory: string | null;
  originCountries: string[];
  originCountry: string | null; // Primary/first country
  notifyingCountry: string | null;
  riskLevel: RiskLevel;
  riskDisplay: { label: string; color: string };
  alertDate: Date | null;
  alertDateDisplay: string;
  notificationRef: string | null;
  subject: string | null;
};

export function normalizeRasffRecord(record: RawRecord): NormalizedAlert {
  // Extract raw values
  const rawHazard = pickField(record, ["HAZARD_CATEGORY_NAME", "hazard_category_name", "hazard"]);
  const rawProduct = pickField(record, ["PRODUCT_NAME", "product_name", "product"]);
  const rawCategory = pickField(record, ["PRODUCT_CATEGORY_DESC", "product_category_desc"]);
  const rawOrigin = pickField(record, ["ORIGIN_COUNTRY_DESC", "origin_country_desc"]);
  const rawNotifying = pickField(record, ["NOTIFYNG_COUNTRY_DESC", "notifying_country_desc", "NOTIFYING_COUNTRY_DESC"]);
  const rawRisk = pickField(record, ["RISK_DECISION_DESC", "risk_decision_desc"]);
  const rawDate = pickField(record, ["NOTIF_DATE", "notif_date"]);
  const rawRef = pickField(record, ["NOTIFICATION_REFERENCE", "notification_reference"]);
  const rawSubject = pickField(record, ["NOTIF_SUBJECT", "notif_subject", "subject"]);

  // Normalize
  const hazards = normalizeHazards(rawHazard);
  const originCountries = normalizeCountries(rawOrigin);
  const riskLevel = normalizeRiskLevel(rawRisk);

  return {
    hazards,
    primaryHazard: hazards.length > 0 ? hazards[0].name : "Unknown",
    hazardCategory: hazards.length > 0 ? hazards[0].category : "Unknown",
    productName: normalizeProductName(rawProduct),
    productCategory: normalizeProductCategory(rawCategory),
    originCountries,
    originCountry: originCountries.length > 0 ? originCountries[0] : null,
    notifyingCountry: normalizeCountry(rawNotifying),
    riskLevel,
    riskDisplay: getRiskLevelDisplay(riskLevel),
    alertDate: normalizeDate(rawDate),
    alertDateDisplay: formatDateDisplay(rawDate),
    notificationRef: rawRef,
    subject: rawSubject ? fixUtf8(rawSubject) : null,
  };
}
