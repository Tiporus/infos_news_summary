import { format } from "date-fns";
import { fr as frLocale } from "date-fns/locale";
import { BIASES } from "@/types";
import type { Bias } from "@/types";
import { BIAS_BG, BIAS_LABEL } from "@/lib/bias";

type Article = {
  id: string;
  title: string;
  url: string;
  publishedAt: Date;
  source: { id: string; name: string; bias: string };
};

type Props = { articles: Article[] };

export function SourcesList({ articles }: Props) {
  // Group by bias
  const byBias = new Map<Bias, Article[]>();
  for (const a of articles) {
    const bias = (a.source.bias as Bias) ?? "CENTER";
    const arr = byBias.get(bias) ?? [];
    arr.push(a);
    byBias.set(bias, arr);
  }

  return (
    <div className="space-y-6">
      {BIASES.map((bias) => {
        const list = byBias.get(bias);
        if (!list || list.length === 0) return null;
        return (
          <section key={bias}>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <span className={`inline-block h-3 w-3 rounded-sm ${BIAS_BG[bias]}`} />
              {BIAS_LABEL[bias]}
              <span className="text-xs text-zinc-500">· {list.length}</span>
            </h3>
            <ul className="space-y-2">
              {list.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-zinc-200 bg-white p-3 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {a.source.name}
                    </span>
                    <time dateTime={a.publishedAt.toISOString()}>
                      {format(a.publishedAt, "d MMM HH:mm", {
                        locale: frLocale,
                      })}
                    </time>
                  </div>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-sm leading-snug text-zinc-900 hover:text-blue-600 dark:text-zinc-100 dark:hover:text-blue-400"
                  >
                    {a.title} ↗
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
