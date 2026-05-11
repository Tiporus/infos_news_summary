import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { BiasBar } from "@/components/BiasBar";
import { SourcesList } from "@/components/SourcesList";
import { SummaryPanel } from "@/components/SummaryPanel";
import { StoryHero } from "@/components/StoryHero";
import { countByBias, detectBlindspot, totalSources } from "@/lib/bias";
import { getStoryBySlug } from "@/lib/stories";
import type { Category, Region } from "@/types";

export const revalidate = 120;

type Params = Promise<{ slug: string }>;

function parsePoints(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === "string");
    }
  } catch {
    // ignore
  }
  return [];
}

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
  const heroImage =
    story.imageUrl ?? story.articles.find((a) => a.imageUrl)?.imageUrl ?? null;

  return (
    <article className="space-y-6">
      <StoryHero
        title={story.title}
        region={story.region as Region}
        category={story.category as Category}
        imageUrl={heroImage}
        totalSources={total}
        ago={ago}
        blindspot={blindspot}
      />

      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <BiasBar counts={counts} size="md" showLegend />
      </div>

      <SummaryPanel
        intro={story.summary}
        points={parsePoints(story.synthesisPoints)}
        viewLeft={story.viewLeft}
        viewRight={story.viewRight}
        category={story.category as Category}
      />

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <span aria-hidden>📰</span>
          Articles ({story.articles.length})
        </h2>
        <SourcesList articles={story.articles} />
        <p className="mt-4 text-xs text-zinc-500">
          <Link
            href={`/category/${story.category}`}
            className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Voir toutes les stories de la même catégorie →
          </Link>
        </p>
      </section>
    </article>
  );
}
