import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prisme — agrégateur de news transparent",
  description:
    "Agrégation d'actualités françaises, européennes et mondiales avec indication du biais des sources et résumé neutre.",
};

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/region/FR", label: "France" },
  { href: "/region/EU", label: "Europe" },
  { href: "/region/WORLD", label: "Monde" },
  { href: "/blindspots", label: "Angles morts" },
  { href: "/sources", label: "Sources" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-block h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 via-zinc-400 to-red-500" />
              <span className="text-lg font-semibold tracking-tight">
                Prisme
              </span>
              <span className="hidden text-xs text-zinc-500 md:inline">
                — vue panoramique de l'info
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto mt-16 max-w-6xl border-t border-zinc-200 px-4 py-8 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
          <p>
            Prisme agrège des flux RSS publics. Les classifications de biais
            sont curées à la main et inspirées d'AllSides et Media Bias Fact
            Check. Les résumés sont générés par IA et peuvent contenir des
            erreurs.
          </p>
        </footer>
      </body>
    </html>
  );
}
