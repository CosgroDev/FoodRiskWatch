/**
 * Normalization utilities for RASFF data
 * Transforms raw API values into user-friendly display names
 */

// Country name mappings (raw value -> display name)
const COUNTRY_MAP: Record<string, string> = {
  // Common abbreviations
  "usa": "United States",
  "us": "United States",
  "united states of america": "United States",
  "uk": "United Kingdom",
  "united kingdom of great britain and northern ireland": "United Kingdom",
  "great britain": "United Kingdom",
  "uae": "United Arab Emirates",
  "united arab emirates": "United Arab Emirates",
  "prc": "China",
  "people's republic of china": "China",
  "roc": "Taiwan",
  "republic of china": "Taiwan",
  "drc": "DR Congo",
  "democratic republic of the congo": "DR Congo",
  "cote d'ivoire": "Côte d'Ivoire",
  "ivory coast": "Côte d'Ivoire",
  "czech republic": "Czechia",
  "the netherlands": "Netherlands",
  "holland": "Netherlands",
  "republic of korea": "South Korea",
  "korea, republic of": "South Korea",
  "democratic people's republic of korea": "North Korea",
  "korea, democratic people's republic of": "North Korea",
  "russian federation": "Russia",
  "viet nam": "Vietnam",
  "türkiye": "Turkey",
  "republic of türkiye": "Turkey",
};

// Product category mappings (raw value -> display name)
const CATEGORY_MAP: Record<string, string> = {
  // Standardize common categories
  "cereals and bakery products": "Cereals & Bakery",
  "fruits and vegetables": "Fruits & Vegetables",
  "meat and meat products (other than poultry)": "Meat Products",
  "meat and meat products": "Meat Products",
  "poultry meat and poultry meat products": "Poultry",
  "fish and fish products": "Fish & Seafood",
  "fish, crustaceans and molluscs": "Fish & Seafood",
  "crustaceans and products thereof": "Shellfish",
  "molluscs and products thereof": "Shellfish",
  "milk and milk products": "Dairy",
  "dairy products": "Dairy",
  "eggs and egg products": "Eggs",
  "fats and oils": "Fats & Oils",
  "nuts, nut products and seeds": "Nuts & Seeds",
  "nuts and nut products": "Nuts & Seeds",
  "herbs and spices": "Herbs & Spices",
  "confectionery": "Confectionery",
  "cocoa and cocoa preparations, coffee and tea": "Cocoa, Coffee & Tea",
  "cocoa and cocoa preparations": "Cocoa & Chocolate",
  "coffee and tea": "Coffee & Tea",
  "alcoholic beverages": "Alcoholic Beverages",
  "non-alcoholic beverages": "Non-Alcoholic Beverages",
  "beverages and bottled water": "Beverages",
  "soups, broths, sauces and condiments": "Sauces & Condiments",
  "sauces and condiments": "Sauces & Condiments",
  "prepared dishes and snacks": "Prepared Foods",
  "food supplements": "Supplements",
  "dietetic foods, food supplements, fortified foods": "Dietary & Supplements",
  "dietetic foods and food supplements": "Dietary & Supplements",
  "food additives and flavourings": "Additives & Flavourings",
  "ices and desserts": "Desserts & Ice Cream",
  "pet food": "Pet Food",
  "animal feed": "Animal Feed",
  "feed additives": "Feed Additives",
  "feed materials": "Feed Materials",
  "food contact materials": "Food Contact Materials",
  "honey and royal jelly": "Honey",
  "natural mineral water": "Mineral Water",
  "wine": "Wine",
  "bivalve molluscs and products thereof": "Shellfish",
  "cephalopods and products thereof": "Seafood",
  "gastropods": "Seafood",
  "other food product / mixed": "Other Foods",
  "other": "Other",
  "not determined / other": "Other",
};

// Hazard mappings for additional normalization
const HAZARD_MAP: Record<string, string> = {
  "salmonella spp.": "Salmonella",
  "salmonella typhimurium": "Salmonella",
  "salmonella enteritidis": "Salmonella",
  "listeria monocytogenes": "Listeria",
  "escherichia coli": "E. coli",
  "shiga toxin-producing escherichia coli": "E. coli (STEC)",
  "stec": "E. coli (STEC)",
  "aflatoxins": "Aflatoxin",
  "aflatoxin b1": "Aflatoxin",
  "ochratoxin a": "Ochratoxin",
  "pesticide residues": "Pesticides",
  "too high content of pesticide residues": "Pesticides",
  "migration": "Chemical Migration",
  "heavy metals": "Heavy Metals",
  "mercury": "Mercury",
  "cadmium": "Cadmium",
  "lead": "Lead",
  "arsenic": "Arsenic",
  "food additive": "Food Additives",
  "unauthorised colour": "Unauthorised Additives",
  "unauthorised substance": "Unauthorised Substances",
  "undeclared allergen": "Undeclared Allergens",
  "allergens": "Allergens",
  "foreign body": "Foreign Bodies",
  "foreign bodies": "Foreign Bodies",
  "glass": "Foreign Bodies",
  "metal": "Foreign Bodies",
  "plastic": "Foreign Bodies",
  "genetically modified": "GMO",
  "gmo": "GMO",
  "norovirus": "Norovirus",
  "hepatitis a virus": "Hepatitis A",
  "clostridium": "Clostridium",
  "clostridium botulinum": "Botulism Risk",
  "bacillus cereus": "Bacillus cereus",
  "campylobacter": "Campylobacter",
  "vibrio": "Vibrio",
  "parasites": "Parasites",
  "anisakis": "Parasites",
  "histamine": "Histamine",
  "biotoxins": "Biotoxins",
  "mycotoxins": "Mycotoxins",
  "poor or insufficient controls": "Control Failures",
  "adulteration/fraud": "Food Fraud",
  "fraud": "Food Fraud",
  "packaging defective / missing": "Packaging Issues",
  "labelling absent/incomplete/incorrect": "Labelling Issues",
};

/**
 * Title case a string, handling special cases
 */
function toTitleCase(str: string): string {
  // Words that should stay lowercase (unless first word)
  const lowercase = new Set(["and", "or", "the", "of", "in", "on", "at", "to", "for", "with", "a", "an"]);

  // Words that should stay uppercase
  const uppercase = new Set(["uk", "usa", "us", "eu", "uae", "gmo", "dna", "bse", "cjd"]);

  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (uppercase.has(word)) return word.toUpperCase();
      if (index > 0 && lowercase.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

/**
 * Normalize a country name to a user-friendly display format
 */
export function normalizeCountry(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const cleaned = raw.trim();
  if (!cleaned) return null;

  const lower = cleaned.toLowerCase();

  // Check for direct mapping
  if (COUNTRY_MAP[lower]) {
    return COUNTRY_MAP[lower];
  }

  // Title case the country name
  return toTitleCase(cleaned);
}

/**
 * Normalize a product category to a user-friendly display format
 */
export function normalizeCategory(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const cleaned = raw.trim();
  if (!cleaned) return null;

  const lower = cleaned.toLowerCase();

  // Check for direct mapping
  if (CATEGORY_MAP[lower]) {
    return CATEGORY_MAP[lower];
  }

  // Title case and clean up
  return toTitleCase(cleaned)
    .replace(/\s+And\s+/g, " & ")
    .replace(/\s+Or\s+/g, " / ");
}

/**
 * Normalize a hazard name to a user-friendly display format
 */
export function normalizeHazard(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const cleaned = raw.trim();
  if (!cleaned) return null;

  const lower = cleaned.toLowerCase();

  // Check for direct mapping
  if (HAZARD_MAP[lower]) {
    return HAZARD_MAP[lower];
  }

  // Common patterns
  if (lower.includes("salmonella")) return "Salmonella";
  if (lower.includes("listeria")) return "Listeria";
  if (lower.includes("e.coli") || lower.includes("e. coli") || lower.includes("escherichia")) return "E. coli";
  if (lower.includes("aflatoxin")) return "Aflatoxin";
  if (lower.includes("mycotoxin")) return "Mycotoxins";
  if (lower.includes("pesticide")) return "Pesticides";
  if (lower.includes("allergen")) return "Allergens";
  if (lower.includes("foreign bod")) return "Foreign Bodies";

  // Title case for unknown hazards
  return toTitleCase(cleaned);
}

/**
 * Normalize all fields in a record
 */
export function normalizeAlertData(data: {
  hazard?: string | null;
  product_category?: string | null;
  origin_country?: string | null;
  notifying_country?: string | null;
}): {
  hazard: string | null;
  product_category: string | null;
  origin_country: string | null;
  notifying_country: string | null;
} {
  return {
    hazard: normalizeHazard(data.hazard),
    product_category: normalizeCategory(data.product_category),
    origin_country: normalizeCountry(data.origin_country),
    notifying_country: normalizeCountry(data.notifying_country),
  };
}
