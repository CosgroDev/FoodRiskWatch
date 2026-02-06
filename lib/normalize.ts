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
  "united kingdom (northern ireland)": "UK (Northern Ireland)",
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
  "côte d'ivoire": "Côte d'Ivoire",
  "cã´te d'ivoire": "Côte d'Ivoire", // UTF-8 encoding issue
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
  "tã¼rkiye": "Turkey", // UTF-8 encoding issue
  "republic of türkiye": "Turkey",
  "unknown origin": "Unknown",
};

// Product category mappings (raw value -> display name)
const CATEGORY_MAP: Record<string, string> = {
  // Food categories
  "cereals and bakery products": "Cereals & Bakery",
  "fruits and vegetables": "Fruits & Vegetables",
  "meat and meat products (other than poultry)": "Meat Products",
  "meat and meat products": "Meat Products",
  "poultry meat and poultry meat products": "Poultry",
  "fish and fish products": "Fish & Seafood",
  "fish, crustaceans and molluscs": "Fish & Seafood",
  "crustaceans and products thereof": "Shellfish",
  "molluscs and products thereof": "Shellfish",
  "bivalve molluscs and products thereof": "Shellfish",
  "cephalopods and products thereof": "Seafood",
  "gastropods": "Seafood",
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
  "natural mineral waters": "Mineral Water",
  "natural mineral water": "Mineral Water",
  "soups, broths, sauces and condiments": "Sauces & Condiments",
  "sauces and condiments": "Sauces & Condiments",
  "prepared dishes and snacks": "Prepared Foods",
  "ices and desserts": "Desserts & Ice Cream",
  "honey and royal jelly": "Honey",
  "wine": "Wine",
  // Supplements & additives
  "food supplements": "Supplements",
  "dietetic foods, food supplements, fortified foods": "Dietary & Supplements",
  "dietetic foods, food supplements and fortified foods": "Dietary & Supplements",
  "dietetic foods and food supplements": "Dietary & Supplements",
  "food additives and flavourings": "Additives & Flavourings",
  "food contact materials": "Food Contact Materials",
  // Animal feed categories
  "pet food": "Pet Food",
  "animal feed": "Animal Feed",
  "feed additives": "Feed Additives",
  "feed materials": "Feed Materials",
  "feed premixtures": "Feed Premixtures",
  "compound feeds": "Compound Feeds",
  // Animal categories
  "live animals": "Live Animals",
  "animal by-products": "Animal By-Products",
  "beef cattle": "Cattle",
  "dairy cow": "Cattle",
  "broiler - fattening": "Poultry (Live)",
  "other poultry": "Poultry (Live)",
  "pig - fattening pig": "Pigs",
  "equine": "Horses",
  "other animals": "Other Animals",
  // Plant categories
  "other living plants: leaves": "Plants",
  "other living plants: ware potatoes": "Plants",
  // Other
  "other food product / mixed": "Other Foods",
  "other": "Other",
  "not determined / other": "Other",
};

// Hazard CATEGORY mappings - these are the {category} values from RASFF
const HAZARD_CATEGORY_MAP: Record<string, string> = {
  "pesticide residues": "Pesticides",
  "pathogenic micro-organisms": "Pathogens",
  "mycotoxins": "Mycotoxins",
  "heavy metals": "Heavy Metals",
  "migration": "Chemical Migration",
  "food additives and flavourings": "Additives",
  "allergens": "Allergens",
  "foreign bodies": "Foreign Bodies",
  "novel food": "Novel Food",
  "biological contaminants": "Biological Contaminants",
  "environmental pollutants": "Environmental Pollutants",
  "industrial contaminants": "Industrial Contaminants",
  "residues of veterinary medicinal products": "Veterinary Residues",
  "chemical contamination (other)": "Chemical Contamination",
  "natural toxins (other)": "Natural Toxins",
  "composition": "Composition Issues",
  "labelling absent/incomplete/incorrect": "Labelling Issues",
  "labelling absent": "Labelling Issues",
  "packaging defective": "Packaging Issues",
  "non-pathogenic micro-organisms": "Microbiological",
  "parasitic infestation": "Parasites",
  "genetically modified": "GMO",
  "radiation": "Radiation",
  "organoleptic aspects": "Quality Issues",
  "not determined (other)": "Other",
};

// Specific hazard name mappings for common pathogens
const HAZARD_NAME_MAP: Record<string, string> = {
  "salmonella": "Salmonella",
  "listeria": "Listeria",
  "e. coli": "E. coli",
  "escherichia coli": "E. coli",
  "campylobacter": "Campylobacter",
  "norovirus": "Norovirus",
  "bacillus cereus": "Bacillus cereus",
  "vibrio": "Vibrio",
  "aflatoxin": "Aflatoxins",
  "ochratoxin": "Ochratoxin",
  "mercury": "Mercury",
  "lead": "Lead",
  "cadmium": "Cadmium",
  "arsenic": "Arsenic",
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
 * Normalize a single country name
 */
function normalizeSingleCountry(country: string): string {
  const cleaned = country.trim();
  if (!cleaned) return "";

  const lower = cleaned.toLowerCase();

  // Check for direct mapping
  if (COUNTRY_MAP[lower]) {
    return COUNTRY_MAP[lower];
  }

  // Title case the country name
  return toTitleCase(cleaned);
}

/**
 * Normalize a country name to a user-friendly display format
 * Handles multi-country format like "Belgium *** Turkey"
 */
export function normalizeCountry(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const cleaned = raw.trim();
  if (!cleaned) return null;

  // Handle multi-country format with *** separator
  if (cleaned.includes(" *** ")) {
    const countries = cleaned.split(" *** ")
      .map(c => normalizeSingleCountry(c))
      .filter(c => c && c !== "Unknown");

    // Return unique countries, comma-separated
    const unique = Array.from(new Set(countries));
    if (unique.length === 0) return "Unknown";
    if (unique.length === 1) return unique[0];
    // For 2-3 countries, show all; for more, show first 2 + count
    if (unique.length <= 3) return unique.join(", ");
    return `${unique[0]}, ${unique[1]} +${unique.length - 2} more`;
  }

  return normalizeSingleCountry(cleaned);
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
 * Extract category from RASFF hazard format like "Chlorpyrifos - {pesticide residues}"
 */
function extractHazardCategory(hazardString: string): string | null {
  // Look for {category} pattern
  const match = hazardString.match(/\{([^}]+)\}/);
  if (match) {
    const category = match[1].toLowerCase().trim();
    return HAZARD_CATEGORY_MAP[category] || null;
  }
  return null;
}

/**
 * Check if hazard contains a known pathogen/specific hazard name
 */
function extractSpecificHazard(hazardString: string): string | null {
  const lower = hazardString.toLowerCase();

  // Check for specific known hazards
  for (const [pattern, name] of Object.entries(HAZARD_NAME_MAP)) {
    if (lower.includes(pattern)) {
      return name;
    }
  }
  return null;
}

/**
 * Normalize a hazard name to a user-friendly display format
 * Handles RASFF format like "Chlorpyrifos - {pesticide residues}"
 */
export function normalizeHazard(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const cleaned = raw.trim();
  if (!cleaned) return null;

  // If it contains ***, take only the first hazard for simplicity
  const firstHazard = cleaned.split(" *** ")[0].trim();
  const lower = firstHazard.toLowerCase();

  // First, check for specific known pathogens/hazards (priority)
  const specific = extractSpecificHazard(firstHazard);
  if (specific) return specific;

  // Try to extract category from {category} format
  const category = extractHazardCategory(firstHazard);
  if (category) return category;

  // Fallback pattern matching for common hazard types
  if (lower.includes("salmonella")) return "Salmonella";
  if (lower.includes("listeria")) return "Listeria";
  if (lower.includes("e.coli") || lower.includes("e. coli") || lower.includes("escherichia")) return "E. coli";
  if (lower.includes("aflatoxin")) return "Aflatoxins";
  if (lower.includes("ochratoxin")) return "Ochratoxin";
  if (lower.includes("mycotoxin")) return "Mycotoxins";
  if (lower.includes("pesticide")) return "Pesticides";
  if (lower.includes("allergen") || lower.includes("undeclared")) return "Allergens";
  if (lower.includes("foreign bod") || lower.includes("fragment")) return "Foreign Bodies";
  if (lower.includes("mercury") || lower.includes("lead") || lower.includes("cadmium") || lower.includes("arsenic")) return "Heavy Metals";
  if (lower.includes("migration") || lower.includes("phthalate") || lower.includes("bisphenol") || lower.includes("melamine")) return "Chemical Migration";
  if (lower.includes("dioxin") || lower.includes("polycyclic") || lower.includes("mineral oil")) return "Environmental Pollutants";
  if (lower.includes("novel food") || lower.includes("cbd") || lower.includes("thc")) return "Novel Food";
  if (lower.includes("labelling") || lower.includes("mislabel")) return "Labelling Issues";
  if (lower.includes("packaging")) return "Packaging Issues";
  if (lower.includes("colour") || lower.includes("sweetener") || lower.includes("e ")) return "Additives";
  if (lower.includes("sibutramine") || lower.includes("sildenafil") || lower.includes("tadalafil")) return "Adulteration";
  if (lower.includes("parasit") || lower.includes("anisakis")) return "Parasites";
  if (lower.includes("histamine")) return "Histamine";
  if (lower.includes("campylobacter")) return "Campylobacter";
  if (lower.includes("norovirus")) return "Norovirus";
  if (lower.includes("vibrio")) return "Vibrio";
  if (lower.includes("bacillus")) return "Bacillus cereus";
  if (lower.includes("enterobacteriaceae") || lower.includes("aerobic") || lower.includes("coliform")) return "Microbiological";
  if (lower.includes("tropane") || lower.includes("pyrrolizidine") || lower.includes("opium") || lower.includes("ergot")) return "Natural Toxins";
  if (lower.includes("genetically modified")) return "GMO";
  if (lower.includes("irradiation")) return "Radiation";
  if (lower.includes("trans fatty") || lower.includes("glycidyl")) return "Industrial Contaminants";
  if (lower.includes("smell") || lower.includes("organoleptic")) return "Quality Issues";
  if (lower.includes("not in catalogue") || lower.includes("import declaration")) return "Documentation";

  // If nothing matched and it's a simple string, return as-is with title case
  if (!cleaned.includes("{") && !cleaned.includes("-")) {
    return toTitleCase(cleaned);
  }

  // Last resort: try to extract the main hazard name before the dash
  const beforeDash = cleaned.split(" - ")[0].trim();
  if (beforeDash && beforeDash.length < 50) {
    return toTitleCase(beforeDash);
  }

  return "Other";
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
