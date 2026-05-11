/**
 * Importe les titres + résumés rédigés à la main depuis data/summaries.json
 * et met à jour les Story correspondantes en base.
 */

import { prisma } from "@/lib/db";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type Synthesis = {
  title: string;
  intro: string;
  points: string[];
  viewLeft: string;
  viewRight: string;
};

async function main() {
  const file = process.argv[2] ?? "data/summaries.json";
  const path = resolve(process.cwd(), file);
  const data = JSON.parse(readFileSync(path, "utf-8")) as Record<string, Synthesis>;

  const ids = Object.keys(data);
  console.log(`→ ${ids.length} story syntheses to import`);

  let updated = 0;
  let missing = 0;
  for (const [id, s] of Object.entries(data)) {
    const exists = await prisma.story.findUnique({ where: { id } });
    if (!exists) {
      console.warn(`  ⚠ story ${id} not found — skipping`);
      missing++;
      continue;
    }
    await prisma.story.update({
      where: { id },
      data: {
        title: s.title,
        summary: s.intro,
        synthesisPoints: JSON.stringify(s.points ?? []),
        viewLeft: s.viewLeft,
        viewRight: s.viewRight,
      },
    });
    updated++;
  }

  console.log(`✓ ${updated} stories updated, ${missing} missing.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
