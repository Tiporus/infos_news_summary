/**
 * Exporte les stories les plus couvertes (et sans résumé) vers
 * `data/candidates.json` — pour rédaction manuelle des titres+résumés.
 */

import { prisma } from "@/lib/db";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

async function main() {
  const TOP = Number(process.env.TOP ?? 30);

  const stories = await prisma.story.findMany({
    where: { summary: null },
    include: {
      articles: {
        include: { source: true },
        orderBy: { publishedAt: "desc" },
      },
    },
  });

  // Filtre stories ≥ 2 articles, tri par nb d'articles desc
  const candidates = stories
    .filter((s) => s.articles.length >= 2)
    .sort((a, b) => b.articles.length - a.articles.length)
    .slice(0, TOP)
    .map((s) => ({
      id: s.id,
      slug: s.slug,
      currentTitle: s.title,
      region: s.region,
      category: s.category,
      articleCount: s.articles.length,
      articles: s.articles.slice(0, 6).map((a) => ({
        source: a.source.name,
        bias: a.source.bias,
        language: a.source.language,
        title: a.title,
        excerpt: a.excerpt?.slice(0, 400) ?? null,
        publishedAt: a.publishedAt.toISOString(),
      })),
    }));

  const out = resolve(process.cwd(), "data/candidates.json");
  writeFileSync(out, JSON.stringify(candidates, null, 2), "utf-8");
  console.log(`Wrote ${candidates.length} candidates to ${out}`);
  for (const c of candidates) {
    console.log(`  ${c.articleCount}x [${c.region}/${c.category}] ${c.id}  ${c.currentTitle.slice(0, 60)}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
