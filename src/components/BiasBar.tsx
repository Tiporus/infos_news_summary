import { BIASES } from "@/types";
import type { Bias, BiasCounts } from "@/types";
import { BIAS_BG, BIAS_LABEL, totalSources } from "@/lib/bias";

type Props = {
  counts: BiasCounts;
  size?: "sm" | "md";
  showLegend?: boolean;
};

export function BiasBar({ counts, size = "sm", showLegend = false }: Props) {
  const total = totalSources(counts);
  const height = size === "md" ? "h-3" : "h-1.5";

  return (
    <div className="space-y-1.5">
      <div
        className={`flex ${height} w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800`}
        role="img"
        aria-label={`Répartition: ${BIASES.map(
          (b) => `${counts[b]} ${BIAS_LABEL[b]}`,
        ).join(", ")}`}
      >
        {total === 0 ? null : (
          BIASES.map((b) => {
            const pct = (counts[b] / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={b}
                className={BIAS_BG[b]}
                style={{ width: `${pct}%` }}
                title={`${BIAS_LABEL[b]} : ${counts[b]} source${
                  counts[b] > 1 ? "s" : ""
                }`}
              />
            );
          })
        )}
      </div>
      {showLegend && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-600 dark:text-zinc-400">
          {BIASES.map((b: Bias) =>
            counts[b] === 0 ? null : (
              <span key={b} className="inline-flex items-center gap-1">
                <span
                  className={`inline-block h-2 w-2 rounded-sm ${BIAS_BG[b]}`}
                />
                {BIAS_LABEL[b]} · {counts[b]}
              </span>
            ),
          )}
        </div>
      )}
    </div>
  );
}
