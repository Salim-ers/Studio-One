import { cn } from "@/lib/utils";

/**
 * Signature visuelle Studio One : règle graduée façon timeline de montage,
 * reprise du motif du logo. Utilisée comme séparateur de sections.
 */
export function FilmRule({ className }: { className?: string }) {
  return <div aria-hidden className={cn("film-rule w-full", className)} />;
}
