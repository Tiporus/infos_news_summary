import { prisma } from "@/lib/db";
import { fetchFeed } from "./rss";
import { clusterDocs, makeDoc, type Doc } from "./cluster";
import { inferCategory, inferRegion } from "./classify";
import { uniqueSlug } from "@/lib/slugify";
import {
  isAnthropicConfigured,
  summarizeStory,
  type ArticleForSummary,
} from "@/lib/anthropic";
import type { Bias } from "@/types";

export type IngestStats = {
  articlesAdded: number;
  storiesCreated: number;
  storiesUpdated: number;
  summariesGenerated: number;
  feedErrors: Array<{ sourceId: string; message: string }>;
};

const RECENT_WINDOW_HOURS = 48;
const BIAS_PRIORITY: Bias[] = ["CENTER", "CENTER_LEFT", "CENTER_RIGHT", "LEFT", "RIGHT"];

export async function runIngest(): Promise<IngestStats> {
  const stats: IngestStats = {
    articlesAdded: 0,
    storiesCreated: 0,
    storiesUpdated: 0,
    summariesGenerated: 0,
    feedErrors: [],
  };

  const sources = await prisma.source.findMany({ where: { active: true } });

  // 1. Fetch RSS in parallel
  const feeds = await Promise.allSettled(
    sources.map(async (s) => {
      const items = await fetchFeed(s.rssUrl);
      return { source: s, items };
    }),
  );

  // 2. Persist new articles (deduplication on URL)
  for (const result of feeds) {
    if (result.status === "rejected") {
      stats.feedErrors.push({
        sourceId: "?",
        message: String(result.reason),
      });
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
            publishedAt: item.publishedAt,
          },
        });
        stats.articlesAdded++;
      } catch (e) {
        // unique violation on url -> already known, ignore
        if (!String(e).includes("Unique constraint")) {
          stats.feedErrors.push({
            sourceId: source.id,
            message: String(e),
          });
        }
      }
    }
  }

  // 3. Clustering pass on articles from the recent window
  const since = new Date(Date.now() - RECENT_WINDOW_HOURS * 3600 * 1000);

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
    doc: makeDoc(s.id, s.title, s.summary ?? ""),
  }));

  const { clusters, seedAttachments } = clusterDocs(docs, seeds);

  // Map of slugs already taken (avoid extra DB roundtrips)
  const existingSlugs = new Set(
    (await prisma.story.findMany({ select: { slug: true } })).map((s) => s.slug),
  );

  // 3a. Attach articles to existing stories
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

  // 3b. Create new stories from fresh clusters
  const newStoryIds: string[] = [];
  for (const cluster of clusters) {
    if (cluster.members.length < 1) continue;

    const memberArticles = cluster.members.map((i) => unclustered[i]);
    const seedArticle = memberArticles[0];
    const title = seedArticle.title;
    const slug = uniqueSlug(title, existingSlugs);
    existingSlugs.add(slug);

    const aggregateText = memberArticles
      .map((a) => `${a.title} ${a.excerpt ?? ""}`)
      .join(" ");

    const region = inferRegion(seedArticle.source.country, aggregateText);
    const category = inferCategory(aggregateText);

    const story = await prisma.story.create({
      data: { title, slug, category, region },
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

  // 4. Generate AI summaries for stories with >= 2 articles & no summary yet
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
          .slice(0, 6)
          .map((a) => ({
            source: a.source.name,
            bias: a.source.bias,
            title: a.title,
            excerpt: a.excerpt,
          }));
        const summary = await summarizeStory(story.title, articles);

        // refresh canonical title using bias priority
        const canonicalTitle = pickCanonicalTitle(story.articles);

        await prisma.story.update({
          where: { id: story.id },
          data: { summary, title: canonicalTitle },
        });
        stats.summariesGenerated++;
      } catch (e) {
        stats.feedErrors.push({
          sourceId: `story:${story.id}`,
          message: `summary failed: ${String(e)}`,
        });
      }
    }
  }

  return stats;
}

function pickCanonicalTitle(
  articles: Array<{ title: string; publishedAt: Date; source: { bias: string } }>,
): string {
  for (const bias of BIAS_PRIORITY) {
    const match = articles
      .filter((a) => a.source.bias === bias)
      .sort((a, b) => +b.publishedAt - +a.publishedAt)[0];
    if (match) return match.title;
  }
  return articles[0]?.title ?? "(sans titre)";
}
