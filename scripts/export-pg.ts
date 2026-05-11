/**
 * Exporte le contenu de la base SQLite locale en deux fichiers SQL
 * directement injectables dans Postgres (Supabase) :
 *   - data/export-pg/01-sources.sql
 *   - data/export-pg/02-stories.sql
 *   - data/export-pg/03-articles.sql
 *
 * Pourquoi 3 fichiers : pour respecter les FKs (sources → stories → articles)
 * et pouvoir injecter chacun en plusieurs morceaux côté Supabase si besoin.
 */

import { prisma } from "@/lib/db";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function pgString(s: string | null | undefined): string {
  if (s === null || s === undefined) return "NULL";
  return "'" + s.replace(/'/g, "''") + "'";
}

function pgBool(b: boolean): string {
  return b ? "TRUE" : "FALSE";
}

function pgTimestamp(d: Date): string {
  return "'" + d.toISOString() + "'";
}

async function main() {
  const outDir = resolve(process.cwd(), "data/export-pg");
  mkdirSync(outDir, { recursive: true });

  // ── Sources
  const sources = await prisma.source.findMany();
  const sourcesSql = [
    "-- Sources (regenerated)",
    "BEGIN;",
    'TRUNCATE "Source", "Article", "Story" RESTART IDENTITY CASCADE;',
    ...sources.map(
      (s) =>
        `INSERT INTO "Source" (id,name,"rssUrl",homepage,country,language,bias,factuality,active) VALUES (${[
          pgString(s.id),
          pgString(s.name),
          pgString(s.rssUrl),
          pgString(s.homepage),
          pgString(s.country),
          pgString(s.language),
          pgString(s.bias),
          pgString(s.factuality),
          pgBool(s.active),
        ].join(",")});`,
    ),
    "COMMIT;",
  ].join("\n");
  writeFileSync(resolve(outDir, "01-sources.sql"), sourcesSql + "\n", "utf-8");
  console.log(`Wrote ${sources.length} sources`);

  // ── Stories
  const stories = await prisma.story.findMany();
  const storiesSql = [
    "-- Stories",
    "BEGIN;",
    ...stories.map(
      (s) =>
        `INSERT INTO "Story" (id,title,slug,summary,"synthesisPoints","viewLeft","viewRight",category,region,"firstSeenAt","lastUpdatedAt") VALUES (${[
          pgString(s.id),
          pgString(s.title),
          pgString(s.slug),
          pgString(s.summary),
          pgString(s.synthesisPoints),
          pgString(s.viewLeft),
          pgString(s.viewRight),
          pgString(s.category),
          pgString(s.region),
          pgTimestamp(s.firstSeenAt),
          pgTimestamp(s.lastUpdatedAt),
        ].join(",")});`,
    ),
    "COMMIT;",
  ].join("\n");
  writeFileSync(resolve(outDir, "02-stories.sql"), storiesSql + "\n", "utf-8");
  console.log(`Wrote ${stories.length} stories`);

  // ── Articles (chunked — la base en compte ~1300)
  const articles = await prisma.article.findMany();
  const CHUNK = 200;
  const chunks: string[] = [];
  for (let i = 0; i < articles.length; i += CHUNK) {
    chunks.push(
      [
        `-- Articles batch ${i / CHUNK + 1}`,
        "BEGIN;",
        ...articles.slice(i, i + CHUNK).map(
          (a) =>
            `INSERT INTO "Article" (id,"sourceId",title,url,excerpt,"publishedAt","fetchedAt","storyId") VALUES (${[
              pgString(a.id),
              pgString(a.sourceId),
              pgString(a.title),
              pgString(a.url),
              pgString(a.excerpt),
              pgTimestamp(a.publishedAt),
              pgTimestamp(a.fetchedAt),
              pgString(a.storyId),
            ].join(",")});`,
        ),
        "COMMIT;",
      ].join("\n"),
    );
  }
  writeFileSync(
    resolve(outDir, "03-articles.sql"),
    chunks.join("\n\n") + "\n",
    "utf-8",
  );
  console.log(
    `Wrote ${articles.length} articles in ${chunks.length} chunk(s) of ${CHUNK}`,
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
