import Parser from "rss-parser";

const parser = new Parser({
  timeout: 10_000,
  headers: {
    "User-Agent":
      "infos-news-summary/0.1 (RSS aggregator; +https://github.com/local)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

export type ParsedItem = {
  title: string;
  link: string;
  excerpt: string | null;
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

    out.push({ title: stripHtml(title), link, excerpt, publishedAt });
  }
  return out;
}
