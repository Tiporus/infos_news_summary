/**
 * Cross-language token normalization.
 *
 * Maps the FR and EN variants of common entity / topic keywords to a single
 * canonical token, so the TF-IDF / entity-overlap clustering can match an
 * English Reuters article with a French Le Monde article about the same
 * subject (e.g. "Ukraine" + "war" + "Putin" appearing in both languages).
 */

const RAW_MAP: Array<[string, string[]]> = [
  // ───── Pays / régions
  ["ukraine",     ["ukraine", "ukrainian", "ukrainien", "ukrainienne", "ukrainians", "ukrainiens", "ukrainiennes", "kyiv", "kiev"]],
  ["russia",      ["russia", "russian", "russians", "russie", "russe", "russes", "moscow", "moscou", "kremlin"]],
  ["iran",        ["iran", "iranian", "iranians", "iranien", "iranienne", "iraniens", "iraniennes", "tehran", "teheran"]],
  ["israel",      ["israel", "israeli", "israelis", "israelien", "israelienne", "israeliens", "tel-aviv", "telaviv", "jerusalem"]],
  ["gaza",        ["gaza", "gazan", "rafah"]],
  ["palestine",   ["palestine", "palestinian", "palestinians", "palestinien", "palestinienne", "palestiniens", "hamas"]],
  ["lebanon",     ["lebanon", "lebanese", "liban", "libanais", "libanaise", "hezbollah"]],
  ["syria",       ["syria", "syrian", "syrians", "syrie", "syrien", "syriens"]],
  ["china",       ["china", "chinese", "chine", "chinois", "chinoise", "chinoises", "beijing", "pekin"]],
  ["taiwan",      ["taiwan", "taiwanese", "taiwanais", "taiwanaise"]],
  ["usa",         ["usa", "united", "states", "america", "american", "americans", "americain", "americaine", "americains", "etats-unis", "etatsunis", "washington"]],
  ["uk",          ["britain", "british", "uk", "england", "english", "britannique", "britanniques", "anglais", "anglaise", "london", "londres"]],
  ["germany",     ["germany", "german", "germans", "allemagne", "allemand", "allemande", "allemands", "berlin"]],
  ["france",      ["france", "french", "francais", "francaise", "francaises", "paris", "elysee"]],
  ["eu",          ["europe", "european", "europeans", "europeen", "europeenne", "europeens", "europeennes", "ue", "bruxelles", "brussels"]],
  ["nato",        ["nato", "otan"]],
  ["africa",      ["africa", "african", "afrique", "africain", "africaine", "africains"]],
  ["middleeast",  ["middle", "east", "middle-east", "middleeast", "moyen", "orient", "moyen-orient"]],

  // ───── Concepts / actions politiques
  ["war",         ["war", "wars", "guerre", "guerres", "conflict", "conflicts", "conflit", "conflits", "bataille", "battle", "battles", "invasion", "invasions", "fighting", "combats"]],
  ["ceasefire",   ["ceasefire", "ceasefires", "cessez-le-feu", "armistice", "truce", "treve"]],
  ["peace",       ["peace", "paix"]],
  ["treaty",      ["treaty", "treaties", "traite", "traites", "accord", "accords", "agreement", "agreements"]],
  ["sanctions",   ["sanctions", "sanction"]],
  ["election",    ["election", "elections", "presidential", "presidentielle", "presidentielles", "scrutin", "scrutins", "vote", "votes", "ballot", "ballots", "poll", "polls", "campaign", "campagne", "campagnes"]],
  ["government",  ["government", "governments", "gouvernement", "gouvernements", "etat", "etats", "state", "ministre", "minister", "ministers", "ministers", "ministry", "ministere", "cabinet"]],
  ["parliament",  ["parliament", "parliaments", "parlement", "parlements", "assemblee", "assembly", "congress", "senat", "senate"]],
  ["protest",     ["protest", "protests", "manifestation", "manifestations", "manif", "rally", "rallies", "demonstration", "demonstrations"]],
  ["strike",      ["strike", "strikes", "greve", "greves"]],
  ["coup",        ["coup", "putsch"]],
  ["arrest",      ["arrest", "arrests", "arrestation", "arrestations", "detention", "detenu", "detenue"]],
  ["court",       ["court", "tribunal", "tribunals", "judge", "juge", "magistrate", "magistrat"]],
  ["trial",       ["trial", "trials", "proces"]],
  ["attack",      ["attack", "attacks", "attaque", "attaques", "strike", "strikes", "frappe", "frappes", "bombing", "bombings", "bombardement", "bombardements"]],
  ["explosion",   ["explosion", "explosions", "blast", "blasts"]],

  // ───── Économie
  ["inflation",   ["inflation"]],
  ["recession",   ["recession", "recessions"]],
  ["rate",        ["rate", "rates", "taux", "interest"]],
  ["stocks",      ["stock", "stocks", "stockmarket", "bourse", "bourses", "shares", "actions"]],
  ["ecb",         ["ecb", "bce"]],
  ["fed",         ["fed", "federal", "reserve"]],
  ["budget",      ["budget", "budgets", "deficit", "deficits"]],
  ["tariff",      ["tariff", "tariffs", "tarif", "tarifs", "douane", "douanes", "customs"]],
  ["unemployment",["unemployment", "chomage", "jobless"]],
  ["gdp",         ["gdp", "pib"]],

  // ───── Tech
  ["ai",          ["ai", "artificial", "intelligence", "ia", "intelligence-artificielle", "chatgpt", "openai", "anthropic"]],
  ["cyber",       ["cyber", "cyberattack", "cyberattaque", "hacking", "hack", "ransomware"]],
  ["chip",        ["chip", "chips", "semiconductor", "semiconductors", "puce", "puces"]],

  // ───── Climat / sciences
  ["climate",     ["climate", "climat", "warming", "rechauffement"]],
  ["earthquake",  ["earthquake", "earthquakes", "seisme", "seismes", "tremor"]],
  ["flood",       ["flood", "floods", "inondation", "inondations", "flooding"]],
  ["fire",        ["fire", "fires", "wildfire", "wildfires", "incendie", "incendies"]],
  ["hurricane",   ["hurricane", "hurricanes", "cyclone", "typhoon", "ouragan", "ouragans"]],

  // ───── Santé
  ["covid",       ["covid", "coronavirus", "sars-cov-2"]],
  ["vaccine",     ["vaccine", "vaccines", "vaccin", "vaccins", "vaccination"]],
  ["outbreak",    ["outbreak", "outbreaks", "epidemie", "epidemies", "epidemic"]],
  ["hantavirus",  ["hantavirus"]],

  // ───── Personnalités politiques (déjà extraites comme entités, on garantit la canonicalisation)
  ["macron",      ["macron"]],
  ["lepen",       ["lepen", "le-pen"]],
  ["melenchon",   ["melenchon"]],
  ["barnier",     ["barnier"]],
  ["bayrou",      ["bayrou"]],
  ["trump",       ["trump"]],
  ["biden",       ["biden"]],
  ["harris",      ["harris", "kamala"]],
  ["vance",       ["vance"]],
  ["putin",       ["putin", "poutine"]],
  ["zelensky",    ["zelensky", "zelenskyy", "zelenskiy"]],
  ["netanyahu",   ["netanyahu", "netanyahou"]],
  ["xi",          ["xi", "jinping"]],
  ["starmer",     ["starmer"]],
  ["merz",        ["merz"]],
  ["scholz",      ["scholz"]],
  ["meloni",      ["meloni"]],
  ["modi",        ["modi"]],
  ["erdogan",     ["erdogan"]],
];

const NORMALIZATION_MAP: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const [canonical, variants] of RAW_MAP) {
    m.set(canonical, canonical);
    for (const v of variants) m.set(v, canonical);
  }
  return m;
})();

/** Lower-case, strip diacritics, then apply the canonical-form mapping. */
export function normalizeToken(raw: string): string {
  const k = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  return NORMALIZATION_MAP.get(k) ?? k;
}

/** Set of canonical topic tokens — used to weight entities heavier in clustering. */
export const TOPIC_CANONICAL_TOKENS: Set<string> = new Set(
  RAW_MAP.map(([canonical]) => canonical),
);
