"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mockSubscription } from "@/lib/mock-data";

const nav = [
  {
    href: "/dashboard",
    label: "Vue d'ensemble",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="9" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    href: "/dashboard/new-video",
    label: "Nouvelle vidéo",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/dashboard/projects/prj-nova-crm",
    label: "Projets",
    match: "/dashboard/projects",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="1.5" y="3" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M11.5 6.5l3-2v7l-3-2" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/dashboard/billing",
    label: "Facturation",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const creditsLeft = mockSubscription.creditsTotal - mockSubscription.creditsUsed;

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-ivory lg:flex">
      <div className="flex h-[68px] items-center gap-3 border-b border-hairline px-5">
        <Image src="/brand/logo-bronze.png" alt="Studio One" width={34} height={34} className="rounded-full" />
        <span className="font-display text-base font-semibold text-coffee">Studio One</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Navigation du tableau de bord">
        {nav.map((item) => {
          const active = item.match
            ? pathname.startsWith(item.match)
            : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors duration-200",
                active
                  ? "bg-cream font-medium text-bronze-deep"
                  : "text-warm-gray hover:bg-cream/60 hover:text-coffee"
              )}
            >
              <span className={cn(active ? "text-bronze" : "text-warm-gray")}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-hairline p-4">
        <div className="rounded-xl border border-hairline bg-cream/70 p-4">
          <p className="text-[11px] uppercase tracking-caps text-bronze">
            Plan {mockSubscription.planName}
          </p>
          <p className="mt-2 text-sm text-coffee">
            <span className="font-display text-2xl">{creditsLeft}</span>{" "}
            <span className="text-warm-gray">
              vidéo{creditsLeft > 1 ? "s" : ""} restante{creditsLeft > 1 ? "s" : ""} ce mois
            </span>
          </p>
          <div className="mt-3 h-1.5 rounded-full bg-ivory" aria-hidden>
            <div
              className="h-full rounded-full bg-bronze"
              style={{
                width: `${(creditsLeft / mockSubscription.creditsTotal) * 100}%`,
              }}
            />
          </div>
          <Link
            href="/dashboard/billing"
            className="mt-3 inline-block text-xs font-medium text-bronze-deep underline-offset-4 hover:underline"
          >
            Gérer mon abonnement
          </Link>
        </div>
      </div>
    </aside>
  );
}
