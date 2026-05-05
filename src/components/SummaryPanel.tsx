type Props = { summary: string | null };

export function SummaryPanel({ summary }: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
        <span className="rounded-full bg-gradient-to-br from-blue-500 via-zinc-400 to-red-500 px-2 py-0.5 text-white">
          IA
        </span>
        Résumé neutre
      </div>
      {summary ? (
        <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
          {summary}
        </p>
      ) : (
        <p className="text-sm italic text-zinc-500">
          Pas encore de résumé pour cette story (il en faut au moins 2 articles
          pour en générer un, ou la clé API n'est pas configurée).
        </p>
      )}
      <p className="mt-3 text-[11px] text-zinc-400">
        Synthèse générée automatiquement à partir des extraits RSS — peut
        contenir des erreurs ou imprécisions. Cliquez les sources ci-dessous
        pour lire les articles originaux.
      </p>
    </div>
  );
}
