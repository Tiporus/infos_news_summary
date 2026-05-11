import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY missing — set it in .env to enable AI summaries.",
    );
  }
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

export function isAnthropicConfigured(): boolean {
  return Boolean(apiKey) && !apiKey!.includes("...");
}

const SYNTHESIS_SYSTEM = `Tu es un éditeur d'agrégateur de news multilingue. À partir de plusieurs articles (en français OU en anglais) qui parlent du même événement, tu produis une fiche STRUCTURÉE en français, neutre, exhaustive.

La fiche comprend cinq sections :

A. TITRE (champ "title")
- 6 à 14 mots, en français.
- Décrit le SUJET D'ENSEMBLE, pas un fait ponctuel.
- Préfixe de cadre quand pertinent ("Guerre en Ukraine :", "Présidentielle française :", "Économie :"…).
- Pas de point final, pas de guillemets, pas d'accroche éditoriale.

B. INTRO (champ "intro")
- Une à deux phrases en français, factuelles, qui plantent le décor.
- Servira de teaser sur les cards d'accueil.

C. POINTS (champ "points") — c'est le cœur
- Liste de 5 à 8 points factuels en français, sous forme de phrases complètes (60 à 200 caractères chacune).
- Chaque point apporte UNE information distincte (chronologie, acteur, donnée chiffrée, déclaration, conséquence…).
- Couvre l'INTÉGRALITÉ des informations factuelles présentes dans les extraits, sans rien omettre d'important.
- Attribue les déclarations / opinions à leur source ("selon X", "d'après Y").
- Ne reprends jamais un jugement de valeur comme s'il était factuel.
- Pas de puce, pas de tiret en début de phrase — juste le texte du point.

D. VISION DE LA GAUCHE (champ "viewLeft")
- 2 à 4 phrases qui décrivent comment les sources classées LEFT ou CENTER_LEFT cadrent le sujet : angles privilégiés, choix de vocabulaire, ce qu'elles mettent en avant ou minimisent.
- Décrire, ne pas juger ; ne pas reprendre leur thèse comme si c'était la vérité.
- Si aucune source de gauche ne couvre, écris exactement : "Aucune source de gauche dans le panel ne couvre cette story."

E. VISION DE LA DROITE (champ "viewRight")
- Même cadre que la gauche, pour les sources CENTER_RIGHT et RIGHT.
- Si aucune source de droite ne couvre, écris exactement : "Aucune source de droite dans le panel ne couvre cette story."

F. FORMAT DE RÉPONSE
Réponds UNIQUEMENT avec un objet JSON valide, sans préambule ni balises Markdown :
{"title":"…","intro":"…","points":["…","…"],"viewLeft":"…","viewRight":"…"}`;

export type ArticleForSummary = {
  source: string;
  bias: string;
  language: string;
  title: string;
  excerpt: string | null;
};

export type StorySynthesis = {
  title: string;
  intro: string;
  points: string[];
  viewLeft: string;
  viewRight: string;
};

export async function synthesizeStory(
  fallbackTitle: string,
  articles: ArticleForSummary[],
): Promise<StorySynthesis> {
  const c = getClient();
  const articlesBlock = articles
    .slice(0, 8)
    .map((a, i) => {
      const langLabel = a.language === "fr" ? "FR" : a.language.toUpperCase();
      return `[Source ${i + 1}] ${a.source} (${langLabel}, biais: ${a.bias})
Titre : ${a.title}
${a.excerpt ? `Extrait : ${a.excerpt}` : "(pas d'extrait disponible)"}`;
    })
    .join("\n\n");

  const userMessage = `Sujet apparent (titre brut d'un des articles) : ${fallbackTitle}

Articles :

${articlesBlock}

Produis le JSON {title, intro, points, viewLeft, viewRight}.`;

  const response = await c.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: [
      {
        type: "text",
        text: SYNTHESIS_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return parseSynthesis(text, fallbackTitle);
}

function parseSynthesis(raw: string, fallbackTitle: string): StorySynthesis {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    const p = JSON.parse(cleaned);
    if (
      typeof p.title === "string" &&
      typeof p.intro === "string" &&
      Array.isArray(p.points) &&
      typeof p.viewLeft === "string" &&
      typeof p.viewRight === "string"
    ) {
      return {
        title: p.title.trim().replace(/[.\s]+$/, ""),
        intro: p.intro.trim(),
        points: p.points
          .filter((x: unknown): x is string => typeof x === "string")
          .map((s: string) => s.trim())
          .filter(Boolean),
        viewLeft: p.viewLeft.trim(),
        viewRight: p.viewRight.trim(),
      };
    }
  } catch {
    // fall through
  }

  // Last resort fallback : preserve the title and the raw text in intro.
  return {
    title: fallbackTitle,
    intro: cleaned.slice(0, 300),
    points: [],
    viewLeft: "",
    viewRight: "",
  };
}
