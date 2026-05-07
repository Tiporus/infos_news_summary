import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { BiasBar } from "./BiasBar";
import { BlindspotBadge } from "./BlindspotBadge";
import { countByBias, detectBlindspot, totalSources } from "@/lib/bias";

type Props = {
  story: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    category: string;
    region: string;
    lastUpdatedAt: Date;
    articles: Array<{ source: { bias: string } }>;
  };
};

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

export function StoryCard({ story }: Props) {
  const counts = countByBias(story.articles.map((a) => a.source.bias));
  const total = totalSources(counts);
  const blindspot = detectBlindspot(counts);
  const ago = formatDistanceToNow(story.lastUpdatedAt, {
    addSuffix: true,
    locale: fr,
  });

  return (
    <Link
      href={`/story/${story.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-zinc-500">
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
          {REGION_LABEL[story.region] ?? story.region}
        </span>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
          {CATEGORY_LABEL[story.category] ?? story.category}
        </span>
        {blindspot && <BlindspotBadge side={blindspot} />}
      </div>

      <h3 className="text-base font-semibold leading-snug text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
        {story.title}
      </h3>

      {story.summary ? (
        <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
          {story.summary}
        </p>
      ) : (
        <p className="text-xs italic text-zinc-400">
          Résumé en cours de génération…
        </p>
      )}

      <div className="mt-auto space-y-2">
        <BiasBar counts={counts} />
        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <span>
            {total} source{total > 1 ? "s" : ""}
          </span>
          <span>{ago}</span>
        </div>
      </div>
    </Link>
  );
}
