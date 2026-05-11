import { StoryCard } from "@/components/StoryCard";
import { countByBias, detectBlindspot } from "@/lib/bias";
import { getStories } from "@/lib/stories";

export const revalidate = 60;

export default async function BlindspotsPage() {
  const stories = await getStories({ limit: 200 });

  const blindspots = stories
    .map((s) => {
      const counts = countByBias(s.articles.map((a) => a.source.bias));
      return { story: s, side: detectBlindspot(counts) };
    })
    .filter((x) => x.side !== null);

  const left = blindspots.filter((x) => x.side === "LEFT");
  const right = blindspots.filter((x) => x.side === "RIGHT");

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Angles morts
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Stories à couverture déséquilibrée
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Une story est marquée « angle mort » si au moins 75 % de ses sources
          sont d'un seul camp politique (et qu'aucune source de l'autre camp ne
          la couvre). Ce sont les sujets qui passeraient sous votre radar selon
          ce que vous lisez d'habitude.
        </p>
      </header>

      <Section
        title="Couvertes uniquement à droite"
        emptyLabel="Aucun angle mort à droite repéré pour le moment."
        items={right.map((x) => x.story)}
      />

      <Section
        title="Couvertes uniquement à gauche"
        emptyLabel="Aucun angle mort à gauche repéré pour le moment."
        items={left.map((x) => x.story)}
      />
    </div>
  );
}

function Section({
  title,
  emptyLabel,
  items,
}: {
  title: string;
  emptyLabel: string;
  items: Awaited<ReturnType<typeof getStories>>;
}) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">{emptyLabel}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      )}
    </section>
  );
}
