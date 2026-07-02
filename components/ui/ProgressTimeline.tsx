import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types/video";

const steps: { key: ProjectStatus; label: string }[] = [
  { key: "draft", label: "Brief" },
  { key: "storyboard_ready", label: "Storyboard" },
  { key: "script_ready", label: "Script" },
  { key: "rendering", label: "Rendu" },
  { key: "export_ready", label: "Export" },
];

const order: ProjectStatus[] = [
  "draft",
  "storyboard_ready",
  "script_ready",
  "rendering",
  "export_ready",
];

export function ProgressTimeline({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const currentIndex = order.indexOf(status);

  return (
    <ol className={cn("flex items-center", className)} aria-label="Progression du projet">
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        return (
          <li key={step.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex h-3 w-3 items-center justify-center rounded-full border transition-colors",
                  done && "border-bronze bg-bronze",
                  current && "border-bronze bg-ivory ring-4 ring-bronze/15",
                  !done && !current && "border-hairline-strong bg-ivory"
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "text-[10px] uppercase tracking-caps",
                  current ? "font-semibold text-bronze-deep" : "text-warm-gray"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "mx-2 mb-5 h-px flex-1",
                  i < currentIndex ? "bg-bronze" : "bg-[rgba(154,106,58,0.18)]"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
