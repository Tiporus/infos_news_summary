/**
 * Fusionne plusieurs Story en une seule (la "canonical"), réécrit la synthèse,
 * réassigne les Articles, puis supprime les Stories absorbées.
 *
 * Lit `data/merges.json` :
 *   [
 *     {
 *       "canonicalId": "...",
 *       "absorbedIds": ["...", "..."],
 *       "title": "...",
 *       "slug": "...",            // optionnel : nouveau slug
 *       "category": "...",        // optionnel : nouvelle catégorie
 *       "region": "...",          // optionnel
 *       "intro": "...",
 *       "points": ["..."],
 *       "viewLeft": "...",
 *       "viewRight": "..."
 *     }
 *   ]
 */

import { prisma } from "@/lib/db";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type MergeGroup = {
  canonicalId: string;
  absorbedIds: string[];
  title: string;
  slug?: string;
  category?: string;
  region?: string;
  intro: string;
  points: string[];
  viewLeft: string;
  viewRight: string;
  imageUrl?: string | null;
};

async function main() {
  const file = process.argv[2] ?? "data/merges.json";
  const path = resolve(process.cwd(), file);
  console.log(`→ reading ${path}`);
  const groups = JSON.parse(readFileSync(path, "utf-8")) as MergeGroup[];
  console.log(`→ ${groups.length} merge group(s)`);

  for (const g of groups) {
    const canonical = await prisma.story.findUnique({
      where: { id: g.canonicalId },
    });
    if (!canonical) {
      console.warn(`  ⚠ canonical ${g.canonicalId} not found — skipping group`);
      continue;
    }

    // 1. Reassign articles from absorbed → canonical
    let reassigned = 0;
    for (const id of g.absorbedIds) {
      const r = await prisma.article.updateMany({
        where: { storyId: id },
        data: { storyId: g.canonicalId },
      });
      reassigned += r.count;
    }

    // 2. Delete absorbed stories
    const del = await prisma.story.deleteMany({
      where: { id: { in: g.absorbedIds } },
    });

    // 3. Update canonical with new synthesis
    await prisma.story.update({
      where: { id: g.canonicalId },
      data: {
        title: g.title,
        slug: g.slug ?? canonical.slug,
        category: g.category ?? canonical.category,
        region: g.region ?? canonical.region,
        summary: g.intro,
        synthesisPoints: JSON.stringify(g.points),
        viewLeft: g.viewLeft,
        viewRight: g.viewRight,
        imageUrl: g.imageUrl ?? canonical.imageUrl,
      },
    });

    console.log(
      `✓ ${g.canonicalId} ← ${del.count} story merged (${reassigned} articles reassigned)`,
    );
  }

  // Re-count
  const total = await prisma.story.count();
  const withSynth = await prisma.story.count({
    where: { summary: { not: null } },
  });
  console.log(
    `\nTotal stories: ${total} (${withSynth} avec synthèse rédigée)`,
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
