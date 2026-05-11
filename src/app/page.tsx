import { FiltersNav } from "@/components/FiltersNav";
import { HotTopics } from "@/components/HotTopics";
import { StoryCard } from "@/components/StoryCard";
import { getDailyStats, getHotTopics, getStories } from "@/lib/stories";

export const revalidate = 60;

export default async function HomePage() {
  const [stories, hotTopics, stats] = await Promise.all([
    getStories({ limit: 30, withSummaryOnly: true }),
    getHotTopics(8),
    getDailyStats(),
  ]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-red-600 via-zinc-700 to-blue-600 p-6 text-white shadow-md">
        <p className="text-xs uppercase tracking-widest opacity-80">
          Briefing du jour
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          Une vue panoramique de l'actualité
        </h1>
        <p className="mt-3 max-w-2xl text-sm opacity-90 md:text-base">
          Chaque story regroupe plusieurs articles parlant du même événement.
          La barre de couleur montre la répartition politique des sources qui
          la couvrent — rouge à gauche, gris au centre, bleu à droite.
        </p>
        <p className="mt-4 text-xs opacity-80">
          {stats.stories} stories · {stats.articles} articles ingérés ces
          dernières 24 h
        </p>
      </section>

      <HotTopics topics={hotTopics} />

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
      <p className="mb-2 font-medium">Aucune story avec synthèse rédigée pour le moment.</p>
      <p>
        Lancez une ingestion ou rédigez des synthèses :
        <code className="mx-1 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800">
          npm run ingest:once
        </code>
      </p>
    </div>
  );
}
