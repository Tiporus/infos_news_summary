/**
 * Pour chaque Story sans imageUrl, va chercher le premier article récent dont
 * la page web expose une `og:image` (ou twitter:image, ou première <img>).
 * Met à jour Story.imageUrl ET Article.imageUrl.
 *
 * Concurrence limitée à 8 fetchs en parallèle, timeout 8 s par requête.
 */

import { prisma } from "@/lib/db";

const CONCURRENCY = 8;
const FETCH_TIMEOUT_MS = 8_000;

const META_OG_IMAGE =
  /<meta[^>]+(?:property|name)\s*=\s*["'](?:og:image|twitter:image)["'][^>]*content\s*=\s*["']([^"']+)["']/i;
const META_OG_IMAGE_REVERSE =
  /<meta[^>]+content\s*=\s*["']([^"']+)["'][^>]*(?:property|name)\s*=\s*["'](?:og:image|twitter:image)["']/i;
const FIRST_IMG =
  /<img[^>]+src\s*=\s*["']([^"']+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^"']*)?)["']/i;

async function fetchImage(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PrismeNewsBot/0.1; +https://github.com/local)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("html")) return null;
    // Lit ~200 KB max ; les balises og: sont toujours dans le <head>.
    const buf = await res.arrayBuffer();
    const html = new TextDecoder("utf-8", { fatal: false })
      .decode(buf.slice(0, 200_000))
      .replace(/\s+/g, " ");
    const m =
      META_OG_IMAGE.exec(html) ?? META_OG_IMAGE_REVERSE.exec(html) ?? FIRST_IMG.exec(html);
    if (!m) return null;
    let img = m[1];
    if (img.startsWith("//")) img = "https:" + img;
    if (img.startsWith("/")) {
      const u = new URL(url);
      img = `${u.protocol}//${u.host}${img}`;
    }
    if (!img.startsWith("http")) return null;
    return img;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function processStory(story: {
  id: string;
  articles: Array<{ id: string; url: string; imageUrl: string | null }>;
}) {
  // Si un article a déjà une image, la propager et terminer
  const withImg = story.articles.find((a) => a.imageUrl);
  if (withImg && withImg.imageUrl) {
    await prisma.story.update({
      where: { id: story.id },
      data: { imageUrl: withImg.imageUrl },
    });
    return { id: story.id, status: "from-existing" as const };
  }

  // Sinon, fetch les pages des articles dans l'ordre, jusqu'à trouver une image
  for (const a of story.articles) {
    const img = await fetchImage(a.url);
    if (img) {
      await prisma.$transaction([
        prisma.article.update({
          where: { id: a.id },
          data: { imageUrl: img },
        }),
        prisma.story.update({
          where: { id: story.id },
          data: { imageUrl: img },
        }),
      ]);
      return { id: story.id, status: "fetched" as const, url: img };
    }
  }
  return { id: story.id, status: "no-image" as const };
}

async function main() {
  const stories = await prisma.story.findMany({
    where: { imageUrl: null },
    select: {
      id: true,
      articles: {
        select: { id: true, url: true, imageUrl: true },
        orderBy: { publishedAt: "desc" },
        take: 3, // on essaie 3 articles max par story
      },
    },
    orderBy: { articleCount: "desc" },
  });

  console.log(`→ ${stories.length} stories sans image — backfill démarré`);

  let done = 0;
  let success = 0;
  const queue = [...stories];

  async function worker() {
    while (queue.length > 0) {
      const s = queue.shift();
      if (!s) break;
      const r = await processStory(s);
      done++;
      if (r.status !== "no-image") success++;
      if (done % 25 === 0) {
        console.log(
          `  ${done}/${stories.length} traitées (${success} avec image)`,
        );
      }
    }
  }

  await Promise.all(
    Array.from({ length: CONCURRENCY }, () => worker()),
  );

  console.log(
    `\n✓ ${success} / ${stories.length} stories ont désormais une image`,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
