import { prisma } from "@/lib/db";
import { fetchFeed } from "./rss";
import { clusterDocs, makeDoc, type Doc } from "./cluster";
import { inferCategory, inferRegion } from "./classify";
import { uniqueSlug } from "@/lib/slugify";
import {
  isAnthropicConfigured,
  synthesizeStory,
  type ArticleForSummary,
} from "@/lib/anthropic";
import type { Bias } from "@/types";

export type IngestStats = {
  articlesAdded: number;
  storiesCreated: number;
  storiesUpdated: number;
  storiesSynthesized: number;
  articlesPurged: number;
  storiesPurged: number;
  feedErrors: Array<{ sourceId: string; message: string }>;
};

const RETENTION_DAYS = 14;

export type IngestOptions = {
  /** Skip RSS fetch step (useful when reclustering existing articles). */
  skipFetch?: boolean;
  /** Recency window for clustering, in hours. Default 48. */
  windowHours?: number;
};

const BIAS_PRIORITY: Bias[] = [
  "CENTER",
  "CENTER_LEFT",
  "CENTER_RIGHT",
  "LEFT",
  "RIGHT",
];

export async function runIngest(opts: IngestOptions = {}): Promise<IngestStats> {
  const { skipFetch = false, windowHours = 48 } = opts;
  const stats: IngestStats = {
    articlesAdded: 0,
    storiesCreated: 0,
    storiesUpdated: 0,
    storiesSynthesized: 0,
    articlesPurged: 0,
    storiesPurged: 0,
    feedErrors: [],
  };

  const sources = await prisma.source.findMany({ where: { active: true } });
  const sourcesById = new Map(sources.map((s) => [s.id, s]));

  // 1. Fetch RSS in parallel
  if (!skipFetch) {
    const feeds = await Promise.allSettled(
      sources.map(async (s) => {
        const items = await fetchFeed(s.rssUrl);
        return { source: s, items };
      }),
    );

    for (const result of feeds) {
      if (result.status === "rejected") {
        stats.feedErrors.push({ sourceId: "?", message: String(result.reason) });
        continue;
      }
      const { source, items } = result.value;
      for (const item of items) {
        try {
          await prisma.article.create({
            data: {
              sourceId: source.id,
              title: item.title,
              url: item.link,
              excerpt: item.excerpt,
              imageUrl: item.imageUrl,
              publishedAt: item.publishedAt,
            },
          });
          stats.articlesAdded++;
        } catch (e) {
          if (!String(e).includes("Unique constraint")) {
            stats.feedErrors.push({
              sourceId: source.id,
              message: String(e),
            });
          }
        }
      }
    }
  }

  // 2. Clustering pass
  const since = new Date(Date.now() - windowHours * 3600 * 1000);

  const unclustered = await prisma.article.findMany({
    where: { storyId: null, publishedAt: { gte: since } },
    include: { source: true },
    orderBy: { publishedAt: "desc" },
  });

  const recentStories = await prisma.story.findMany({
    where: { lastUpdatedAt: { gte: since } },
    include: { articles: { include: { source: true } } },
  });

  const docs: Doc[] = unclustered.map((a) =>
    makeDoc(a.id, a.title, a.excerpt),
  );
  const seeds = recentStories.map((s) => ({
    key: s.id,
    doc: makeDoc(
      s.id,
      `${s.title} ${s.summary ?? ""}`,
      s.articles.map((a) => a.title).join(" · "),
    ),
  }));

  const { clusters, seedAttachments } = clusterDocs(docs, seeds);

  const existingSlugs = new Set(
    (await prisma.story.findMany({ select: { slug: true } })).map((s) => s.slug),
  );

  // 2a. Attach articles to existing stories
  const updatedStoryIds = new Set<string>();
  for (const [docIdx, storyId] of seedAttachments) {
    const article = unclustered[docIdx];
    await prisma.article.update({
      where: { id: article.id },
      data: { storyId },
    });
    await prisma.story.update({
      where: { id: storyId },
      data: { lastUpdatedAt: new Date() },
    });
    updatedStoryIds.add(storyId);
    stats.storiesUpdated++;
  }

  // 2b. Create new stories from fresh clusters
  const newStoryIds: string[] = [];
  for (const cluster of clusters) {
    if (cluster.members.length < 1) continue;

    const memberArticles = cluster.members.map((i) => unclustered[i]);
    const fallbackTitle = pickCanonicalTitle(memberArticles);
    const slug = uniqueSlug(fallbackTitle, existingSlugs);
    existingSlugs.add(slug);

    const aggregateText = memberArticles
      .map((a) => `${a.title} ${a.excerpt ?? ""}`)
      .join(" ");

    const region = inferRegion(memberArticles[0].source.country, aggregateText);
    const category = inferCategory(aggregateText);

    const story = await prisma.story.create({
      data: { title: fallbackTitle, slug, category, region },
    });

    for (const a of memberArticles) {
      await prisma.article.update({
        where: { id: a.id },
        data: { storyId: story.id },
      });
    }

    stats.storiesCreated++;
    newStoryIds.push(story.id);
  }

  // 3. AI synthesis (titre généraliste FR + résumé global)
  if (isAnthropicConfigured()) {
    const candidates = await prisma.story.findMany({
      where: {
        id: { in: [...updatedStoryIds, ...newStoryIds] },
        summary: null,
      },
      include: { articles: { include: { source: true } } },
    });

    for (const story of candidates) {
      if (story.articles.length < 2) continue;
      try {
        const articles: ArticleForSummary[] = story.articles
          .slice(0, 8)
          .map((a) => ({
            source: a.source.name,
            bias: a.source.bias,
            language: a.source.language,
            title: a.title,
            excerpt: a.excerpt,
          }));

        const synthesis = await synthesizeStory(story.title, articles);

        await prisma.story.update({
          where: { id: story.id },
          data: {
            title: synthesis.title || story.title,
            summary: synthesis.intro,
            synthesisPoints: JSON.stringify(synthesis.points),
            viewLeft: synthesis.viewLeft,
            viewRight: synthesis.viewRight,
          },
        });
        stats.storiesSynthesized++;
      } catch (e) {
        stats.feedErrors.push({
          sourceId: `story:${story.id}`,
          message: `synthesis failed: ${String(e)}`,
        });
      }
    }
  } else {
    // Pas de clé Claude → on garantit au moins un titre français quand
    // une story regroupe plusieurs articles en mélangeant des sources FR/EN.
    const candidates = await prisma.story.findMany({
      where: { id: { in: [...updatedStoryIds, ...newStoryIds] } },
      include: { articles: { include: { source: true } } },
    });
    for (const story of candidates) {
      const better = pickCanonicalTitle(story.articles);
      if (better && better !== story.title) {
        await prisma.story.update({
          where: { id: story.id },
          data: { title: better },
        });
      }
    }
  }

  // 5. Cleanup : purge articles older than RETENTION_DAYS, then orphan stories.
  //    Le trigger Postgres maintient automatiquement Story.articleCount à jour.
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 3600 * 1000);
  const purgedArticles = await prisma.article.deleteMany({
    where: { publishedAt: { lt: cutoff } },
  });
  stats.articlesPurged = purgedArticles.count;

  const purgedStories = await prisma.story.deleteMany({
    where: { articleCount: 0 },
  });
  stats.storiesPurged = purgedStories.count;

  // Avoid unused var lint when no fetch happened
  void sourcesById;
  return stats;
}

/**
 * Choose a fallback title for a story (used when Claude isn't configured).
 * Strong preference: French-language sources, then by political-bias priority,
 * then by recency. Falls back to the first article when nothing matches.
 */
function pickCanonicalTitle(
  articles: Array<{
    title: string;
    publishedAt: Date;
    source: { bias: string; language: string };
  }>,
): string {
  if (articles.length === 0) return "(sans titre)";

  const french = articles.filter((a) => a.source.language === "fr");
  const pool = french.length > 0 ? french : articles;

  for (const bias of BIAS_PRIORITY) {
    const match = pool
      .filter((a) => a.source.bias === bias)
      .sort((a, b) => +b.publishedAt - +a.publishedAt)[0];
    if (match) return match.title;
  }
  return pool[0].title;
}
