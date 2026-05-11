import type { Category } from "@/types";
import { CATEGORY_THEME } from "@/lib/category-theme";

type Props = {
  intro: string | null;
  points: string[];
  viewLeft: string | null;
  viewRight: string | null;
  category: Category;
};

export function SummaryPanel({
  intro,
  points,
  viewLeft,
  viewRight,
  category,
}: Props) {
  const theme = CATEGORY_THEME[category];
  const hasSynthesis = points.length > 0 || (intro && intro.length > 0);
  const hasViews = Boolean(viewLeft) || Boolean(viewRight);

  return (
    <div className="space-y-6">
      {hasSynthesis && (
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          {/* Header coloré */}
          <header
            className={`flex items-center gap-3 border-b border-zinc-200/40 bg-gradient-to-r ${theme.gradient} px-5 py-3 text-white dark:border-zinc-800/40`}
          >
            <SparkleIcon />
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-widest opacity-80">
                Synthèse de la rédaction
              </span>
              <span className="text-sm font-medium">
                Vue d'ensemble construite à partir des {points.length || "?"} angles couverts
              </span>
            </div>
            <span className="ml-auto text-2xl" aria-hidden>
              {theme.emoji}
            </span>
          </header>

          <div className="space-y-5 px-5 py-5 md:px-7 md:py-6">
            {intro && (
              <p className="text-base leading-relaxed text-zinc-800 first-letter:text-2xl first-letter:font-bold first-letter:text-zinc-900 dark:text-zinc-100 dark:first-letter:text-white">
                {intro}
              </p>
            )}

            {points.length > 0 && (
              <ol className="space-y-3 border-l-2 border-zinc-200 pl-5 dark:border-zinc-700">
                {points.map((p, i) => (
                  <li
                    key={i}
                    className="relative text-sm leading-relaxed text-zinc-700 dark:text-zinc-300"
                  >
                    <span
                      aria-hidden
                      className={`absolute -left-[27px] top-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br ${theme.gradient} text-[11px] font-semibold text-white shadow`}
                    >
                      {i + 1}
                    </span>
                    {p}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <footer className="border-t border-zinc-100 bg-zinc-50/60 px-5 py-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-500">
            Synthèse rédigée à partir des extraits des sources listées plus bas.
            Les attributions explicites ne sont conservées que pour les éléments
            spécifiquement issus d'une source.
          </footer>
        </section>
      )}

      {hasViews && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ViewBlock
            side="LEFT"
            title="Vue de la gauche"
            text={viewLeft}
            placeholder="Aucune source de gauche n'a couvert cette story dans notre panel."
          />
          <ViewBlock
            side="RIGHT"
            title="Vue de la droite"
            text={viewRight}
            placeholder="Aucune source de droite n'a couvert cette story dans notre panel."
          />
        </section>
      )}
    </div>
  );
}

function ViewBlock({
  side,
  title,
  text,
  placeholder,
}: {
  side: "LEFT" | "RIGHT";
  title: string;
  text: string | null;
  placeholder: string;
}) {
  // Convention FR : rouge à gauche, bleu à droite
  const isLeft = side === "LEFT";
  const wrap = isLeft
    ? "border-red-200/70 bg-gradient-to-br from-red-50 via-white to-red-50/40 dark:border-red-900/70 dark:from-red-950/40 dark:via-zinc-900 dark:to-red-950/20"
    : "border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-blue-50/40 dark:border-blue-900/70 dark:from-blue-950/40 dark:via-zinc-900 dark:to-blue-950/20";
  const dot = isLeft ? "bg-red-600" : "bg-blue-600";
  const titleColor = isLeft
    ? "text-red-800 dark:text-red-300"
    : "text-blue-800 dark:text-blue-300";

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border ${wrap} p-5 shadow-sm transition hover:shadow-md`}
    >
      {/* Accent bar à gauche */}
      <div
        aria-hidden
        className={`absolute inset-y-0 ${isLeft ? "left-0" : "right-0"} w-1 ${dot}`}
      />

      <header className="mb-3 flex items-center gap-2">
        <span
          aria-hidden
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${dot} text-[11px] font-bold text-white`}
        >
          {isLeft ? "G" : "D"}
        </span>
        <h3 className={`text-sm font-semibold ${titleColor}`}>{title}</h3>
      </header>
      <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
        {text && text.length > 0 ? (
          text
        ) : (
          <span className="italic text-zinc-500">{placeholder}</span>
        )}
      </p>
    </article>
  );
}

function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z"
        fill="currentColor"
        opacity=".9"
      />
      <path
        d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z"
        fill="currentColor"
        opacity=".7"
      />
    </svg>
  );
}
