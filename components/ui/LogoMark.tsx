import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoMarkProps {
  variant?: "bronze" | "white";
  size?: number;
  withWordmark?: boolean;
  href?: string;
  className?: string;
}

export function LogoMark({
  variant = "bronze",
  size = 44,
  withWordmark = true,
  href = "/",
  className,
}: LogoMarkProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Image
        src={variant === "bronze" ? "/brand/logo-bronze.png" : "/brand/logo-white.png"}
        alt="Studio One"
        width={size}
        height={size}
        className="rounded-full"
        priority
      />
      {withWordmark && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-semibold tracking-tight text-coffee">
            Studio One
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-caps text-warm-gray">
            Démos vidéo 4K
          </span>
        </span>
      )}
    </span>
  );

  return href ? (
    <Link href={href} aria-label="Studio One — accueil">
      {content}
    </Link>
  ) : (
    content
  );
}
