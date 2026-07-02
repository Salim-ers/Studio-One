import { cn } from "@/lib/utils";

type Tone = "neutral" | "bronze" | "progress" | "success";

const tones: Record<Tone, string> = {
  neutral: "border-hairline bg-cream text-warm-gray",
  bronze: "border-hairline-strong bg-[#F3E9DC] text-bronze-deep",
  progress: "border-hairline-strong bg-[#F3E9DC] text-bronze",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export function Badge({
  children,
  tone = "neutral",
  pulse = false,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-caps",
        tones[tone],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bronze opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bronze" />
        </span>
      )}
      {children}
    </span>
  );
}
