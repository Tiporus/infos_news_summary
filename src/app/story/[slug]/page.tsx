import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { BiasBar } from "@/components/BiasBar";
import { BlindspotBadge } from "@/components/BlindspotBadge";
import { SourcesList } from "@/components/SourcesList";
import { SummaryPanel } from "@/components/SummaryPanel";
import { countByBias, detectBlindspot, totalSources } from "@/lib/bias";
import { getStoryBySlug } from "@/lib/stories";

export const dynamic = "force-dynamic";

const REGION_LABEL: Record<string, string> = {
  FR: "France",
  EU: "Europe",
  WORLD: "Monde",
};

const CATEGORY_LABEL: Record<string, string> = {
  POLITICS: "Politique",
  ECONOMY: "Économie",
  TECH: "Tech",
  WORLD: "International",
  SCIENCE: "Sciences",
  CULTURE: "Culture",
  SPORTS: "Sports",
  HEALTH: "Santé",
};

type Params = Promise<{ slug: string }>;

export default async function StoryPage({ params }: { params: Params }) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) notFound();

  const counts = countByBias(story.articles.map((a) => a.source.bias));
  const total = totalSources(counts);
  const blindspot = detectBlindspot(counts);
  const ago = formatDistanceToNow(story.lastUpdatedAt, {
    addSuffix: true,
    locale: fr,
  });

  return (
    <article className="space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
          <Link
            href={`/region/${story.region}`}
            className="rounded-full bg-zinc-100 px-2 py-0.5 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            {REGION_LABEL[story.region] ?? story.region}
          </Link>
          <Link
            href={`/category/${story.category}`}
            className="rounded-full bg-zinc-100 px-2 py-0.5 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            {CATEGORY_LABEL[story.category] ?? story.category}
          </Link>
          {blindspot && <BlindspotBadge side={blindspot} />}
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {story.title}
        </h1>
        <p className="text-sm text-zinc-500">
          {total} source{total > 1 ? "s" : ""} · mis à jour {ago}
        </p>
        <BiasBar counts={counts} size="md" showLegend />
      </header>

      <SummaryPanel summary={story.summary} />

      <section>
        <h2 className="mb-4 text-lg font-semibold">
          Articles ({story.articles.length})
        </h2>
        <SourcesList articles={story.articles} />
      </section>
    </article>
  );
}
