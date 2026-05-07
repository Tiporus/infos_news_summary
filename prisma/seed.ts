import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const prisma = new PrismaClient();

type SourceSeed = {
  id: string;
  name: string;
  rssUrl: string;
  homepage: string;
  country: string;
  language: string;
  bias: string;
  factuality: string;
};

async function main() {
  const file = resolve(process.cwd(), "data/sources.json");
  const sources = JSON.parse(readFileSync(file, "utf-8")) as SourceSeed[];

  for (const s of sources) {
    await prisma.source.upsert({
      where: { id: s.id },
      update: {
        name: s.name,
        rssUrl: s.rssUrl,
        homepage: s.homepage,
        country: s.country,
        language: s.language,
        bias: s.bias,
        factuality: s.factuality,
        active: true,
      },
      create: { ...s, active: true },
    });
  }

  console.log(`Seeded ${sources.length} sources`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
