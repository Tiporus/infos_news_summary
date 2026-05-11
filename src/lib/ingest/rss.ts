import Parser from "rss-parser";

type CustomItem = {
  enclosure?: { url?: string; type?: string };
  "media:content"?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
  "media:thumbnail"?:
    | { $?: { url?: string } }
    | Array<{ $?: { url?: string } }>;
};

const parser = new Parser<unknown, CustomItem>({
  timeout: 10_000,
  headers: {
    "User-Agent":
      "infos-news-summary/0.1 (RSS aggregator; +https://github.com/local)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      ["media:content", "media:content", { keepArray: true }],
      ["media:thumbnail", "media:thumbnail", { keepArray: true }],
    ],
  },
});

export type ParsedItem = {
  title: string;
  link: string;
  excerpt: string | null;
  imageUrl: string | null;
  publishedAt: Date;
};

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractImage(item: Parser.Item & CustomItem): string | null {
  // 1. enclosure[type^=image]
  const encl = item.enclosure;
  if (encl?.url && (!encl.type || encl.type.startsWith("image/"))) {
    return encl.url;
  }

  // 2. media:content / media:thumbnail (custom-field, kept as array)
  const mediaCandidates = [
    ...(toArray(item["media:content"]) ?? []),
    ...(toArray(item["media:thumbnail"]) ?? []),
  ];
  for (const m of mediaCandidates) {
    const url = m?.$?.url;
    if (url) return url;
  }

  // 3. <img> dans content / contentSnippet
  const html =
    (item as { "content:encoded"?: string })["content:encoded"] ??
    item.content ??
    item.contentSnippet ??
    "";
  const m = /<img[^>]+src\s*=\s*["']([^"']+)["']/i.exec(html);
  if (m) return m[1];

  return null;
}

function toArray<T>(x: T | T[] | undefined | null): T[] | null {
  if (x === undefined || x === null) return null;
  return Array.isArray(x) ? x : [x];
}

export async function fetchFeed(rssUrl: string): Promise<ParsedItem[]> {
  const feed = await parser.parseURL(rssUrl);
  const out: ParsedItem[] = [];
  for (const item of feed.items) {
    const link = item.link?.trim();
    const title = item.title?.trim();
    if (!link || !title) continue;

    const rawDate = item.isoDate ?? item.pubDate;
    const publishedAt = rawDate ? new Date(rawDate) : new Date();
    if (Number.isNaN(publishedAt.getTime())) continue;

    const rawExcerpt =
      item.contentSnippet ?? item.summary ?? item.content ?? null;
    const excerpt = rawExcerpt ? stripHtml(rawExcerpt).slice(0, 600) : null;

    out.push({
      title: stripHtml(title),
      link,
      excerpt,
      imageUrl: extractImage(item),
      publishedAt,
    });
  }
  return out;
}
