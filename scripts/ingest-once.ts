import { runIngest } from "@/lib/ingest/pipeline";
import { prisma } from "@/lib/db";

async function main() {
  console.log("Starting one-shot ingest…");
  const t0 = Date.now();
  const stats = await runIngest();
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
