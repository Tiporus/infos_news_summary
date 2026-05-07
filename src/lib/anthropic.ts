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
  return Boolean(apiKey);
}

const SUMMARY_SYSTEM = `Tu es un rédacteur agrégateur d'actualités strictement neutre.

Règles :
1. Synthétise EXCLUSIVEMENT à partir des extraits fournis ; n'ajoute aucun fait extérieur.
2. Trois phrases maximum, en français, factuelles et neutres.
3. Si les sources divergent, attribue les opinions ("selon X...", "d'après Y...") plutôt que d'asséner.
4. Ne reprends jamais les jugements de valeur d'une source comme si c'était un fait.
5. Aucun ton éditorial, aucune accroche, aucune conclusion morale.

Réponds UNIQUEMENT avec le texte du résumé, sans préambule ni guillemets.`;

export type ArticleForSummary = {
  source: string;
  bias: string;
  title: string;
  excerpt: string | null;
};

export async function summarizeStory(
  storyTitle: string,
  articles: ArticleForSummary[],
): Promise<string> {
  const c = getClient();
  const articlesBlock = articles
    .slice(0, 6)
    .map(
      (a, i) =>
        `[Source ${i + 1}] ${a.source} (biais: ${a.bias})
Titre : ${a.title}
${a.excerpt ? `Extrait : ${a.excerpt}` : "(pas d'extrait disponible)"}`,
    )
    .join("\n\n");

  const userMessage = `Sujet apparent : ${storyTitle}

Articles :

${articlesBlock}

Rédige le résumé neutre.`;

  const response = await c.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: [
      {
        type: "text",
        text: SUMMARY_SYSTEM,
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

  return text;
}
