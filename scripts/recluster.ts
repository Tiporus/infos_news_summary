/**
 * Purge stories + relink all articles + relancer une ingestion fraîche.
 *
 * Usage : `npm run recluster` (équivalent à `npx tsx scripts/recluster.ts`).
 *
 * Étapes :
 *  1. Détache tous les articles de leur story (storyId = null)
 *  2. Supprime toutes les stories existantes
 *  3. Relance le pipeline d'ingestion (fetch RSS frais + clustering avec
 *     les nouveaux paramètres) sur une fenêtre de 7 jours pour rattraper
 *     les anciens articles aussi.
 */

import { prisma } from "@/lib/db";
import { runIngest } from "@/lib/ingest/pipeline";

async function main() {
  console.log("→ Reset des stories existantes…");
  const detached = await prisma.article.updateMany({
    where: { storyId: { not: null } },
    data: { storyId: null },
  });
  const deleted = await prisma.story.deleteMany({});
  console.log(`  ${detached.count} articles détachés, ${deleted.count} stories supprimées.`);

  console.log("→ Reingest + recluster (fenêtre 7 jours)…");
  const t0 = Date.now();
  const stats = await runIngest({ windowHours: 24 * 7 });
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`Done in ${dt}s`);
  console.log(JSON.stringify(stats, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
