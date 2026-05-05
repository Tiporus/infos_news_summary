import { FiltersNav } from "@/components/FiltersNav";
import { StoryCard } from "@/components/StoryCard";
import { getDailyStats, getStories } from "@/lib/stories";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stories, stats] = await Promise.all([
    getStories({ limit: 36 }),
    getDailyStats(),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-blue-600 via-zinc-700 to-red-600 p-6 text-white shadow-md">
        <p className="text-xs uppercase tracking-widest opacity-80">
          Briefing du jour
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          Une vue panoramique de l'actualité
        </h1>
        <p className="mt-3 max-w-2xl text-sm opacity-90 md:text-base">
          Chaque story regroupe plusieurs articles parlant du même événement.
          La barre de couleur montre la répartition politique des sources qui
          la couvrent — bleu à gauche, gris au centre, rouge à droite.
        </p>
        <p className="mt-4 text-xs opacity-80">
          {stats.stories} stories · {stats.articles} articles ingérés ces
          dernières 24 h
        </p>
      </section>

      <FiltersNav />

      {stories.length === 0 ? (
        <EmptyState />
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

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
      <p className="mb-2 font-medium">Aucune story pour le moment.</p>
      <p>
        Lancez une ingestion RSS pour peupler la base :
        <code className="mx-1 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
          npm run ingest:once
        </code>
      </p>
    </div>
  );
}
