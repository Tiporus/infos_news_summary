import { prisma } from "@/lib/db";

async function main() {
  const stories = await prisma.story.findMany({
    include: { _count: { select: { articles: true } } },
    orderBy: { lastUpdatedAt: "desc" },
  });
  const buckets: Record<string, number> = {
    "1": 0,
    "2": 0,
    "3-5": 0,
    "6+": 0,
  };
  for (const s of stories) {
    const n = s._count.articles;
    if (n === 1) buckets["1"]++;
    else if (n === 2) buckets["2"]++;
    else if (n <= 5) buckets["3-5"]++;
    else buckets["6+"]++;
  }
  console.log("Total stories:", stories.length);
  console.log("Distribution articles/story:", buckets);

  const top = await prisma.story.findMany({
    take: 10,
    orderBy: { articles: { _count: "desc" } },
    include: { articles: { include: { source: true } } },
  });
  console.log("\nTop 10 stories par nb d articles:");
  for (const s of top) {
    const sources = s.articles
      .map((a) => `${a.source.name}[${a.source.bias}]`)
      .slice(0, 6)
      .join(", ");
    console.log(
      `  ${s.articles.length}x | [${s.region}/${s.category}] ${s.title.slice(0, 70)}`,
    );
    console.log(`     -> ${sources}`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
