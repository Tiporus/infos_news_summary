import { notFound } from "next/navigation";
import { FiltersNav } from "@/components/FiltersNav";
import { StoryCard } from "@/components/StoryCard";
import { getStories } from "@/lib/stories";
import { CATEGORIES } from "@/types";
import type { Category } from "@/types";

export const revalidate = 60;

const CATEGORY_LABEL: Record<Category, string> = {
  POLITICS: "Politique",
  ECONOMY: "Économie",
  TECH: "Tech",
  WORLD: "International",
  SCIENCE: "Sciences",
  CULTURE: "Culture",
  SPORTS: "Sports",
  HEALTH: "Santé",
};

type Params = Promise<{ cat: string }>;

export default async function CategoryPage({ params }: { params: Params }) {
  const { cat } = await params;
  if (!CATEGORIES.includes(cat as Category)) notFound();
  const c = cat as Category;

  const stories = await getStories({ category: c, limit: 60 });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Sujet
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          {CATEGORY_LABEL[c]}
        </h1>
      </header>

      <FiltersNav activeCategory={c} />

      {stories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          Aucune story pour ce sujet récemment.
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </section>
      )}
    </div>
  );
}
