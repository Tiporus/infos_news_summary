import { prisma } from "@/lib/db";
import type { Category, Region } from "@/types";

export type StoryFilter = {
  region?: Region;
  category?: Category;
  blindspotsOnly?: boolean;
  limit?: number;
};

/**
 * Fetch stories with their articles (and source info needed for bias display).
 * Sorted by lastUpdatedAt desc, with a recency window of 7 days.
 */
export async function getStories(filter: StoryFilter = {}) {
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  return prisma.story.findMany({
    where: {
      lastUpdatedAt: { gte: since },
      region: filter.region,
      category: filter.category,
    },
    include: {
      articles: {
        orderBy: { publishedAt: "desc" },
        include: {
          source: {
            select: { id: true, name: true, bias: true, homepage: true },
          },
        },
      },
    },
    orderBy: [{ lastUpdatedAt: "desc" }],
    take: filter.limit ?? 60,
  });
}

export async function getStoryBySlug(slug: string) {
  return prisma.story.findUnique({
    where: { slug },
    include: {
      articles: {
        orderBy: { publishedAt: "desc" },
        include: {
          source: {
            select: {
              id: true,
              name: true,
              bias: true,
              homepage: true,
              factuality: true,
              country: true,
            },
          },
        },
      },
    },
  });
}

export async function getDailyStats() {
  const since = new Date(Date.now() - 24 * 3600 * 1000);
  const [stories, articles] = await Promise.all([
    prisma.story.count({ where: { lastUpdatedAt: { gte: since } } }),
    prisma.article.count({ where: { fetchedAt: { gte: since } } }),
  ]);
  return { stories, articles };
}
