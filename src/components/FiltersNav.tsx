import Link from "next/link";
import { CATEGORIES, REGIONS } from "@/types";
import type { Category, Region } from "@/types";

const REGION_LABEL: Record<Region, string> = {
  FR: "France",
  EU: "Europe",
  WORLD: "Monde",
};

const CATEGORY_LABEL: Record<Category, string> = {
  POLITICS: "Politique",
  ECONOMY: "Économie",
  TECH: "Tech",
  WORLD: "International",
  SCIENCE: "Sciences",
  CULTURE: "Culture",
  SPORTS: "Sports",
  HEALTH: "Santé",
};

type Props = {
  activeRegion?: Region | null;
  activeCategory?: Category | null;
};

export function FiltersNav({ activeRegion, activeCategory }: Props) {
  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-1 text-xs">
        <span className="mr-1 text-zinc-500">Région :</span>
        <Pill href="/" active={!activeRegion}>
          Tout
        </Pill>
        {REGIONS.map((r) => (
          <Pill key={r} href={`/region/${r}`} active={activeRegion === r}>
            {REGION_LABEL[r]}
          </Pill>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1 text-xs">
        <span className="mr-1 text-zinc-500">Sujet :</span>
        <Pill href="/" active={!activeCategory}>
          Tout
        </Pill>
        {CATEGORIES.map((c) => (
          <Pill key={c} href={`/category/${c}`} active={activeCategory === c}>
            {CATEGORY_LABEL[c]}
          </Pill>
        ))}
      </div>
    </div>
  );
}

function Pill({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full bg-zinc-900 px-2.5 py-1 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "rounded-full px-2.5 py-1 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      }
    >
      {children}
    </Link>
  );
}
