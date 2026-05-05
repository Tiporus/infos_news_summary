import { notFound } from "next/navigation";
import { FiltersNav } from "@/components/FiltersNav";
import { StoryCard } from "@/components/StoryCard";
import { getStories } from "@/lib/stories";
import { REGIONS } from "@/types";
import type { Region } from "@/types";

export const dynamic = "force-dynamic";

const REGION_LABEL: Record<Region, string> = {
  FR: "France",
  EU: "Europe",
  WORLD: "Monde",
};

type Params = Promise<{ region: string }>;

export default async function RegionPage({ params }: { params: Params }) {
  const { region } = await params;
  if (!REGIONS.includes(region as Region)) notFound();
  const r = region as Region;

  const stories = await getStories({ region: r, limit: 60 });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Région
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          {REGION_LABEL[r]}
        </h1>
      </header>

      <FiltersNav activeRegion={r} />

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
      Aucune story pour cette région — lancez une ingestion ou patientez.
    </div>
  );
}
