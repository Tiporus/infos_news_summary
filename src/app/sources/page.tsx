import { prisma } from "@/lib/db";
import { BIASES } from "@/types";
import type { Bias } from "@/types";
import { BIAS_BG, BIAS_LABEL } from "@/lib/bias";

export const revalidate = 600;

const FACTUALITY_LABEL: Record<string, string> = {
  HIGH: "Haute",
  MIXED: "Mixte",
  LOW: "Basse",
};

export default async function SourcesPage() {
  const sources = await prisma.source.findMany({
    orderBy: [{ bias: "asc" }, { name: "asc" }],
    include: { _count: { select: { articles: true } } },
  });

  const grouped = new Map<Bias, typeof sources>();
  for (const s of sources) {
    const key = s.bias as Bias;
    const arr = grouped.get(key) ?? [];
    arr.push(s);
    grouped.set(key, arr);
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Annuaire
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Sources agrégées</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          {sources.length} sources actives. La classification politique est
          curée à la main et inspirée d'AllSides et Media Bias Fact Check ;
          elle est forcément discutable, n'hésitez pas à la challenger.
        </p>
      </header>

      <div className="space-y-6">
        {BIASES.map((bias) => {
          const list = grouped.get(bias);
          if (!list || list.length === 0) return null;
          return (
            <section key={bias}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
                <span
                  className={`inline-block h-3 w-3 rounded-sm ${BIAS_BG[bias]}`}
                />
                {BIAS_LABEL[bias]}
                <span className="text-xs font-normal text-zinc-500">
                  · {list.length}
                </span>
              </h2>
              <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                {list.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={s.homepage}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        {s.name} ↗
                      </a>
                      <span className="text-[11px] text-zinc-500">
                        {s.country} · {s.language}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
                      <span>
                        Factualité : {FACTUALITY_LABEL[s.factuality] ?? s.factuality}
                      </span>
                      <span>{s._count.articles} articles</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
