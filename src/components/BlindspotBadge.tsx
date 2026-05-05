type Props = { side: "LEFT" | "RIGHT" };

export function BlindspotBadge({ side }: Props) {
  const isLeft = side === "LEFT";
  const label = isLeft ? "Angle mort à droite" : "Angle mort à gauche";
  const cls = isLeft
    ? "bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900"
    : "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-900";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${cls}`}
      title={
        isLeft
          ? "Cette story est couverte uniquement par des sources de gauche/centre-gauche."
          : "Cette story est couverte uniquement par des sources de droite/centre-droit."
      }
    >
      ⊘ {label}
    </span>
  );
}
