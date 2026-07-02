import { cn } from "@/lib/utils";

interface VideoDurationCardProps {
  seconds: 60 | 90 | 120;
  title: string;
  description: string;
  bestFor: string;
  highlighted?: boolean;
}

export function VideoDurationCard({
  seconds,
  title,
  description,
  bestFor,
  highlighted,
}: VideoDurationCardProps) {
  return (
    <article
      className={cn(
        "group flex flex-col rounded-2xl border bg-ivory p-8 transition-all duration-300",
        highlighted
          ? "border-bronze/40 shadow-glow"
          : "border-hairline shadow-soft hover:-translate-y-1 hover:border-bronze/30 hover:shadow-lifted"
      )}
    >
      <p className="flex items-baseline gap-1">
        <span className="font-display text-5xl text-bronze">{seconds}</span>
        <span className="text-sm uppercase tracking-caps text-warm-gray">sec</span>
      </p>

      {/* Barre proportionnelle à la durée — l'échelle raconte le format */}
      <div className="mt-4 h-1.5 w-full rounded-full bg-cream" aria-hidden>
        <div
          className="h-full rounded-full bg-bronze/70 transition-all duration-500 group-hover:bg-bronze"
          style={{ width: `${(seconds / 120) * 100}%` }}
        />
      </div>

      <h3 className="mt-5 font-display text-xl text-coffee">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-warm-gray">{description}</p>
      <p className="mt-5 border-t border-hairline pt-4 text-xs text-bronze-deep">
        <span className="font-semibold">Idéale pour :</span> {bestFor}
      </p>
    </article>
  );
}
