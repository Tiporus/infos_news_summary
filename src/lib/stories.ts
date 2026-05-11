import { prisma } from "@/lib/db";
import type { Category, Region } from "@/types";

export type StoryFilter = {
  region?: Region;
  category?: Category;
  /** Si true (par défaut sur la home), n'inclut que les stories ayant déjà
   * une synthèse rédigée (champ `summary` non null). */
  withSummaryOnly?: boolean;
  /** Fenêtre de récence en jours (défaut 14, aligné sur la rétention). */
  daysWindow?: number;
  limit?: number;
};

/**
 * Stories paginées triées par couverture décroissante (articleCount desc),
 * avec un payload `select` minimal pour le rendu des cards.
 */
export async function getStories(filter: StoryFilter = {}) {
  const days = filter.daysWindow ?? 14;
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);
  return prisma.story.findMany({
    where: {
      lastUpdatedAt: { gte: since },
      region: filter.region,
      category: filter.category,
      ...(filter.withSummaryOnly ? { summary: { not: null } } : {}),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      category: true,
      region: true,
      imageUrl: true,
      articleCount: true,
      lastUpdatedAt: true,
      articles: {
        select: {
          imageUrl: true,
          source: { select: { bias: true } },
        },
      },
    },
    orderBy: [
      { articleCount: "desc" },
      { lastUpdatedAt: "desc" },
    ],
    take: filter.limit ?? 24,
  });
}

/** Top N stories pour le bloc "Sujets chauds" — payload encore plus léger. */
export async function getHotTopics(limit = 6) {
  const since = new Date(Date.now() - 14 * 24 * 3600 * 1000);
  return prisma.story.findMany({
    where: {
      lastUpdatedAt: { gte: since },
      summary: { not: null },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      articleCount: true,
    },
    orderBy: [
      { articleCount: "desc" },
      { lastUpdatedAt: "desc" },
    ],
    take: limit,
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
    prisma.story.count({
      where: { lastUpdatedAt: { gte: since } },
    }),
    prisma.article.count({ where: { fetchedAt: { gte: since } } }),
  ]);
  return { stories, articles };
}
