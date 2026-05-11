import Link from "next/link";
import { CATEGORY_THEME } from "@/lib/category-theme";
import type { Category } from "@/types";

type Topic = {
  id: string;
  title: string;
  slug: string;
  category: string;
  articleCount: number;
};

type Props = { topics: Topic[] };

export function HotTopics({ topics }: Props) {
  if (topics.length === 0) return null;
  return (
    <section
      aria-label="Sujets chauds du moment"
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <header className="mb-3 flex items-center gap-2">
        <span aria-hidden className="text-xl">
          🔥
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
          Sujets chauds du moment
        </h2>
      </header>
      <ul className="flex flex-wrap gap-2">
        {topics.map((t) => {
          const theme = CATEGORY_THEME[t.category as Category];
          return (
            <li key={t.id}>
              <Link
                href={`/story/${t.slug}`}
                className={`group inline-flex max-w-md items-center gap-2 rounded-full bg-gradient-to-r ${theme.gradient} px-3 py-1.5 text-sm text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
              >
                <span aria-hidden className="text-base">
                  {theme.emoji}
                </span>
                <span className="line-clamp-1 font-medium">{t.title}</span>
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-black/30 px-2 py-0.5 text-[11px] font-semibold backdrop-blur">
                  {t.articleCount}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
