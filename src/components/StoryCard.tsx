import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { BiasBar } from "./BiasBar";
import { BlindspotBadge } from "./BlindspotBadge";
import { countByBias, detectBlindspot, totalSources } from "@/lib/bias";
import { CATEGORY_THEME, REGION_LABEL } from "@/lib/category-theme";
import type { Category, Region } from "@/types";

type Props = {
  story: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    category: string;
    region: string;
    imageUrl: string | null;
    lastUpdatedAt: Date;
    articles: Array<{
      imageUrl: string | null;
      source: { bias: string };
    }>;
  };
};

export function StoryCard({ story }: Props) {
  const counts = countByBias(story.articles.map((a) => a.source.bias));
  const total = totalSources(counts);
  const blindspot = detectBlindspot(counts);
  const ago = formatDistanceToNow(story.lastUpdatedAt, {
    addSuffix: true,
    locale: fr,
  });
  const theme = CATEGORY_THEME[story.category as Category];
  const heroImage =
    story.imageUrl ?? story.articles.find((a) => a.imageUrl)?.imageUrl ?? null;

  return (
    <Link
      href={`/story/${story.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* Visual hero (image RSS si disponible, sinon gradient + emoji) */}
      <div
        className={`relative h-32 overflow-hidden bg-gradient-to-br ${theme.gradient}`}
      >
        {heroImage ? (
          <>
            <Image
              src={heroImage}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover opacity-80 mix-blend-luminosity"
              unoptimized
            />
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-60`} />
          </>
        ) : (
          /* SVG dot pattern décoratif */
          <svg
            className="absolute inset-0 h-full w-full opacity-30"
            viewBox="0 0 200 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <pattern
                id={`dots-${story.id}`}
                x="0"
                y="0"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="1" cy="1" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#dots-${story.id})`} />
          </svg>
        )}
        <span className="absolute right-3 top-3 text-3xl drop-shadow" aria-hidden>
          {theme.emoji}
        </span>
        <div className="absolute bottom-2 left-3 flex flex-wrap gap-1.5 text-[10px] uppercase tracking-widest text-white/95">
          <span className="rounded-full bg-black/30 px-2 py-0.5 backdrop-blur">
            {REGION_LABEL[story.region as Region] ?? story.region}
          </span>
          <span className="rounded-full bg-black/30 px-2 py-0.5 backdrop-blur">
            {theme.label}
          </span>
          {blindspot && <BlindspotBadge side={blindspot} />}
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-3 text-base font-semibold leading-snug text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
          {story.title}
        </h3>

        {story.summary ? (
          <p className="line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
            {story.summary}
          </p>
        ) : (
          <p className="text-xs italic text-zinc-400">
            Synthèse en cours de rédaction…
          </p>
        )}

        <div className="mt-auto space-y-2">
          <BiasBar counts={counts} />
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-400" />
              {total} source{total > 1 ? "s" : ""}
            </span>
            <span>{ago}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
