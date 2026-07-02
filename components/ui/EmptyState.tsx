import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon,
}: EmptyStateProps) {
  return (
    <div className="card-surface flex flex-col items-center gap-4 px-8 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-hairline bg-cream text-bronze">
        {icon ?? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <rect x="3" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M17 10l4-2.5v9L17 14" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div>
        <h3 className="font-display text-xl text-coffee">{title}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-warm-gray">
          {description}
        </p>
      </div>
      {actionLabel && actionHref && (
        <Button href={actionHref} size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
