// Clustering léger : TF-IDF + cosine sur titre + excerpt,
// avec un bonus si au moins une entité nommée (token capitalisé non-stopword) est partagée.

const STOPWORDS_FR = new Set([
  "le", "la", "les", "un", "une", "des", "de", "du", "et", "à", "au", "aux",
  "en", "dans", "pour", "par", "sur", "avec", "sans", "que", "qui", "quoi",
  "dont", "où", "ou", "mais", "donc", "or", "ni", "car", "si", "ne", "pas",
  "plus", "moins", "se", "sa", "son", "ses", "leur", "leurs", "ce", "cet",
  "cette", "ces", "il", "elle", "ils", "elles", "on", "nous", "vous", "je",
  "tu", "y", "est", "sont", "été", "était", "être", "avoir", "fait", "va",
  "vont", "doit", "peut", "très", "tout", "tous", "toute", "toutes", "selon",
  "après", "avant", "comme", "entre", "vers", "contre", "depuis", "lors",
  "alors", "déjà", "encore", "aussi", "pendant", "sous",
]);

const STOPWORDS_EN = new Set([
  "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at", "by",
  "for", "with", "without", "about", "as", "is", "are", "was", "were", "be",
  "been", "being", "have", "has", "had", "do", "does", "did", "this", "that",
  "these", "those", "it", "its", "he", "she", "they", "we", "you", "i",
  "their", "his", "her", "our", "your", "my", "from", "into", "after",
  "before", "between", "than", "then", "so", "if", "not", "no", "yes", "out",
  "up", "down", "over", "under", "more", "most", "less", "least", "very",
  "such", "via", "amid", "amidst", "while", "during",
]);

function tokenize(text: string): string[] {
  const lower = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  return (lower.match(/[a-z0-9]{3,}/g) ?? []).filter(
    (t) => !STOPWORDS_FR.has(t) && !STOPWORDS_EN.has(t),
  );
}

function namedEntities(text: string): Set<string> {
  // Heuristique : tokens commençant par une majuscule, plus de 2 lettres,
  // qui ne sont pas en début de phrase isolé. Marche raisonnablement
  // sur les titres de news.
  const out = new Set<string>();
  const matches = text.match(/[A-ZÀ-Ý][a-zà-ÿ'’\-]{2,}/g) ?? [];
  for (const m of matches) {
    const norm = m
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
    if (STOPWORDS_FR.has(norm) || STOPWORDS_EN.has(norm)) continue;
    out.add(norm);
  }
  return out;
}

export type Doc = {
  id: string;
  text: string;
  tokens: string[];
  entities: Set<string>;
};

export function makeDoc(id: string, title: string, excerpt?: string | null): Doc {
  const text = `${title} ${excerpt ?? ""}`;
  return { id, text, tokens: tokenize(text), entities: namedEntities(text) };
}

function tf(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
  for (const [k, v] of m) m.set(k, v / tokens.length);
  return m;
}

function buildIdf(docs: Doc[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const d of docs) {
    for (const tok of new Set(d.tokens)) df.set(tok, (df.get(tok) ?? 0) + 1);
  }
  const idf = new Map<string, number>();
  const N = Math.max(docs.length, 1);
  for (const [tok, count] of df) idf.set(tok, Math.log(1 + N / count));
  return idf;
}

function tfidfVector(
  doc: Doc,
  idf: Map<string, number>,
): Map<string, number> {
  const out = new Map<string, number>();
  const termFreq = tf(doc.tokens);
  for (const [tok, freq] of termFreq) {
    const w = (idf.get(tok) ?? 0) * freq;
    if (w > 0) out.set(tok, w);
  }
  return out;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const v of a.values()) na += v * v;
  for (const v of b.values()) nb += v * v;
  if (na === 0 || nb === 0) return 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  for (const [k, v] of small) {
    const w = large.get(k);
    if (w !== undefined) dot += v * w;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export type Cluster = {
  /** Index of the seed doc that defined this cluster (in `docs`) */
  seed: number;
  /** All doc indices belonging to this cluster (including the seed) */
  members: number[];
};

const SIMILARITY_THRESHOLD = 0.32;
const MIN_SHARED_ENTITIES = 1;

/**
 * Greedy clustering: iterate documents in order, attach to the best
 * existing cluster if similarity is high enough and at least one entity
 * is shared, otherwise start a new cluster.
 *
 * `seedVectors` lets you pre-attach docs to existing stories without
 * mutating them — pass the canonical title (+ summary?) of each story.
 */
export function clusterDocs(
  docs: Doc[],
  seeds: Array<{ key: string; doc: Doc }> = [],
): {
  clusters: Cluster[];
  /** For each doc index, which seed.key it was attached to (if any) */
  seedAttachments: Map<number, string>;
} {
  const allDocs = [...seeds.map((s) => s.doc), ...docs];
  const idf = buildIdf(allDocs);

  const seedVectors = seeds.map((s) => ({
    key: s.key,
    vec: tfidfVector(s.doc, idf),
    entities: s.doc.entities,
  }));

  const seedAttachments = new Map<number, string>();
  const clusters: Cluster[] = [];
  const clusterVectors: Array<{
    centroid: Map<string, number>;
    entities: Set<string>;
  }> = [];

  docs.forEach((doc, i) => {
    const v = tfidfVector(doc, idf);

    // 1. Try existing stories first (seeds)
    let bestSeed: { key: string; sim: number } | null = null;
    for (const s of seedVectors) {
      const shared = countShared(doc.entities, s.entities);
      if (shared < MIN_SHARED_ENTITIES) continue;
      const sim = cosine(v, s.vec);
      if (sim >= SIMILARITY_THRESHOLD && (!bestSeed || sim > bestSeed.sim)) {
        bestSeed = { key: s.key, sim };
      }
    }

    if (bestSeed) {
      seedAttachments.set(i, bestSeed.key);
      return;
    }

    // 2. Try existing fresh clusters
    let bestCluster: { idx: number; sim: number } | null = null;
    for (let c = 0; c < clusters.length; c++) {
      const cv = clusterVectors[c];
      const shared = countShared(doc.entities, cv.entities);
      if (shared < MIN_SHARED_ENTITIES) continue;
      const sim = cosine(v, cv.centroid);
      if (
        sim >= SIMILARITY_THRESHOLD &&
        (!bestCluster || sim > bestCluster.sim)
      ) {
        bestCluster = { idx: c, sim };
      }
    }

    if (bestCluster) {
      const c = clusters[bestCluster.idx];
      c.members.push(i);
      const cv = clusterVectors[bestCluster.idx];
      mergeInto(cv.centroid, v);
      for (const e of doc.entities) cv.entities.add(e);
    } else {
      clusters.push({ seed: i, members: [i] });
      clusterVectors.push({ centroid: new Map(v), entities: new Set(doc.entities) });
    }
  });

  return { clusters, seedAttachments };
}

function countShared<T>(a: Set<T>, b: Set<T>): number {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n;
}

function mergeInto(centroid: Map<string, number>, v: Map<string, number>) {
  for (const [k, val] of v) centroid.set(k, (centroid.get(k) ?? 0) + val);
}
