/**
 * Importe les fichiers SQL `data/export-pg/*.sql` dans la base Postgres
 * dont l'URL est dans `process.env.SUPABASE_DATABASE_URL` (format
 * `postgresql://...`, soit pooler soit direct).
 *
 * Usage : `SUPABASE_DATABASE_URL=... npx tsx scripts/import-to-supabase.ts`
 */

import { Client } from "pg";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Lightweight .env loader (no dotenv dep). Reads KEY=value or KEY="value" lines
// from .env at the project root and merges them into process.env (without
// overwriting existing values).
function loadDotEnv() {
  const file = resolve(process.cwd(), ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf-8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
loadDotEnv();

async function main() {
  const url = process.env.SUPABASE_DATABASE_URL;
  if (!url) {
    throw new Error(
      "SUPABASE_DATABASE_URL is not set. Pass it via env, e.g.:\n" +
        '  $env:SUPABASE_DATABASE_URL = "postgresql://..."',
    );
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  console.log("→ connected");

  // Quick sanity check
  const before = await client.query(
    'SELECT (SELECT count(*) FROM "Source")::int AS sources, ' +
      '(SELECT count(*) FROM "Story")::int  AS stories, ' +
      '(SELECT count(*) FROM "Article")::int AS articles',
  );
  console.log("  before:", before.rows[0]);

  const dir = resolve(process.cwd(), "data/export-pg");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort(); // 01- … 02- … 03-

  for (const file of files) {
    const sql = readFileSync(resolve(dir, file), "utf-8");
    console.log(`→ executing ${file} (${(sql.length / 1024).toFixed(1)} KB)…`);
    await client.query(sql);
  }

  const after = await client.query(
    'SELECT (SELECT count(*) FROM "Source")::int AS sources, ' +
      '(SELECT count(*) FROM "Story")::int  AS stories, ' +
      '(SELECT count(*) FROM "Article")::int AS articles',
  );
  console.log("  after :", after.rows[0]);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
