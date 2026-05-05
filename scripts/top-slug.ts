import { prisma } from "@/lib/db";

async function main() {
  const x = await prisma.story.findFirst({
    orderBy: { articles: { _count: "desc" } },
  });
  console.log(x?.slug);
  await prisma.$disconnect();
}
main();
