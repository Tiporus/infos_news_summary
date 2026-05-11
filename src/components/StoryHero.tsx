import Image from "next/image";
import { CATEGORY_THEME, REGION_LABEL } from "@/lib/category-theme";
import type { Category, Region } from "@/types";

type Props = {
  title: string;
  region: Region;
  category: Category;
  imageUrl: string | null;
  totalSources: number;
  ago: string;
  blindspot: "LEFT" | "RIGHT" | null;
};

export function StoryHero({
  title,
  region,
  category,
  imageUrl,
  totalSources,
  ago,
  blindspot,
}: Props) {
  const theme = CATEGORY_THEME[category];
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.gradient} text-white shadow-lg`}
    >
      {/* Decorative SVG dots overlay */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
        viewBox="0 0 600 300"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <pattern
            id="dots"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.5" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* Optional real photo on the right (RSS thumbnail) */}
      {imageUrl && (
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-2/5 md:block">
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="40vw"
            className="object-cover opacity-50 mix-blend-luminosity"
            unoptimized
          />
          <div
            className={`absolute inset-0 bg-gradient-to-l ${
              theme.gradient.includes("from-")
                ? `from-transparent to-${theme.gradient.split(" ")[0].replace("from-", "")}`
                : ""
            }`}
          />
          <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-current to-transparent opacity-90" />
        </div>
      )}

      <div className="relative px-6 py-8 md:px-10 md:py-12">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest opacity-90">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 backdrop-blur">
            <span aria-hidden>{theme.emoji}</span>
            {theme.label}
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur">
            {REGION_LABEL[region]}
          </span>
          {blindspot && (
            <span className="rounded-full bg-black/30 px-3 py-1 backdrop-blur">
              ⊘ Angle mort à {blindspot === "LEFT" ? "droite" : "gauche"}
            </span>
          )}
        </div>

        <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight md:text-4xl">
          {title}
        </h1>

        <div className="mt-4 flex items-center gap-3 text-sm opacity-90">
          <span className="inline-flex items-center gap-1.5">
            <DotIcon />
            {totalSources} source{totalSources > 1 ? "s" : ""}
          </span>
          <span aria-hidden>·</span>
          <span>{ago}</span>
        </div>
      </div>
    </div>
  );
}

function DotIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      aria-hidden
      className="opacity-80"
    >
      <circle cx="7" cy="7" r="3" fill="currentColor" />
    </svg>
  );
}
