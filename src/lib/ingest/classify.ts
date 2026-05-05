import type { Category, Region } from "@/types";

// Mapping pays ISO -> région d'agrégation
const COUNTRY_REGION: Record<string, Region> = {
  FR: "FR",
  GB: "EU",
  DE: "EU",
  ES: "EU",
  IT: "EU",
  EU: "EU",
};

// Mots-clés (en + fr) pour classifier la catégorie d'une story
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  POLITICS: [
    "élection", "election", "président", "president", "gouvernement",
    "government", "parlement", "parliament", "ministre", "minister",
    "député", "senator", "macron", "biden", "trump", "vote", "campaign",
    "scrutin", "assemblée", "constitution", "congress", "labour", "tory",
  ],
  ECONOMY: [
    "économie", "economy", "inflation", "marché", "market", "bourse",
    "stocks", "bce", "ecb", "fed", "taux", "rates", "récession",
    "recession", "pib", "gdp", "chômage", "unemployment", "banque",
    "banking", "bourse", "earnings", "revenue", "trade",
  ],
  TECH: [
    "tech", "ia", "ai", "artificial intelligence", "openai", "anthropic",
    "google", "apple", "microsoft", "meta", "startup", "logiciel",
    "software", "internet", "cloud", "cyberattaque", "cyber", "data",
    "smartphone", "réseau", "network", "iphone", "android", "chatgpt",
  ],
  WORLD: [
    "russie", "russia", "ukraine", "chine", "china", "iran", "israël",
    "israel", "gaza", "syria", "syrie", "afghanistan", "north korea",
    "diplomatie", "diplomacy", "guerre", "war", "conflit", "conflict",
    "onu", "un ", "nato", "otan", "sanctions", "treaty", "traité",
  ],
  SCIENCE: [
    "science", "espace", "space", "nasa", "esa", "spacex", "climat",
    "climate", "biodiversité", "biodiversity", "physique", "physics",
    "chimie", "chemistry", "découverte", "discovery", "recherche",
    "research", "fusion", "exoplanète", "exoplanet",
  ],
  CULTURE: [
    "culture", "cinéma", "cinema", "film", "musique", "music", "festival",
    "livre", "book", "art", "exposition", "exhibition", "concert",
    "théâtre", "theater", "literature", "littérature", "oscar", "cannes",
    "césar",
  ],
  SPORTS: [
    "football", "rugby", "tennis", "olympic", "olympique", "ligue",
    "league", "world cup", "coupe du monde", "psg", "om", "real madrid",
    "match", "championnat", "championship", "f1", "formula", "nba",
    "nfl", "uefa", "fifa",
  ],
  HEALTH: [
    "santé", "health", "vaccin", "vaccine", "covid", "épidémie",
    "epidemic", "hôpital", "hospital", "médecin", "doctor", "cancer",
    "alzheimer", "obesity", "obésité", "mental", "psychiatrie",
    "psychiatry", "pandemic", "pandémie", "oms", "who",
  ],
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function inferRegion(country: string, text: string): Region {
  const t = normalize(text);
  if (
    /\b(france|french|française|francais|paris|hexagone|elysee|elysée|matignon)\b/.test(
      t,
    )
  ) {
    return "FR";
  }
  if (
    /\b(europe|european|européen|eu |union européenne|brussels|bruxelles|nato|otan|euro)\b/.test(
      t,
    )
  ) {
    return "EU";
  }
  return COUNTRY_REGION[country] ?? "WORLD";
}

export function inferCategory(text: string): Category {
  const t = normalize(text);
  const scores: Record<Category, number> = {
    POLITICS: 0,
    ECONOMY: 0,
    TECH: 0,
    WORLD: 0,
    SCIENCE: 0,
    CULTURE: 0,
    SPORTS: 0,
    HEALTH: 0,
  };
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    Category,
    string[],
  ][]) {
    for (const kw of keywords) {
      if (t.includes(normalize(kw))) scores[category]++;
    }
  }
  let best: Category = "WORLD";
  let bestScore = 0;
  for (const [cat, score] of Object.entries(scores) as [Category, number][]) {
    if (score > bestScore) {
      best = cat;
      bestScore = score;
    }
  }
  return best;
}
