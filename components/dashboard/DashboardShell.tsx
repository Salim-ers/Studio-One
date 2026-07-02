"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import type { SubscriptionState } from "@/types/billing";

export interface ShellUser {
  name: string;
  email: string;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function DashboardShell({
  title,
  subtitle,
  actions,
  user,
  subscription,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  user?: ShellUser;
  subscription?: SubscriptionState;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const displayName = user?.name ?? "Invité";
  const displayEmail = user?.email ?? "";

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <div className="flex min-h-screen bg-cream/40">
      <Sidebar subscription={subscription} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-hairline bg-ivory/90 px-5 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="lg:hidden" aria-label="Studio One — tableau de bord">
              <Image src="/brand/logo-bronze.png" alt="" width={32} height={32} className="rounded-full" />
            </Link>
            <div>
              <h1 className="font-display text-lg leading-tight text-coffee md:text-xl">{title}</h1>
              {subtitle && <p className="hidden text-xs text-warm-gray md:block">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {actions}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
                aria-label="Menu utilisateur"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline-strong bg-cream font-display text-sm text-bronze-deep transition-all hover:border-bronze"
              >
                {initialsOf(displayName)}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-hairline bg-ivory p-2 shadow-lifted">
                  <div className="border-b border-hairline px-3 py-2.5">
                    <p className="text-sm font-medium text-coffee">{displayName}</p>
                    {displayEmail && <p className="text-xs text-warm-gray">{displayEmail}</p>}
                  </div>
                  {[
                    { href: "/dashboard/billing", label: "Facturation" },
                    { href: "/pricing", label: "Changer d'offre" },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-coffee transition-colors hover:bg-cream"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className={cn(
                      "block w-full rounded-lg px-3 py-2 text-left text-sm text-warm-gray transition-colors hover:bg-cream",
                      loggingOut && "opacity-60"
                    )}
                  >
                    {loggingOut ? "Déconnexion…" : "Se déconnecter"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Navigation mobile */}
        <nav className="flex gap-1 overflow-x-auto border-b border-hairline bg-ivory px-4 py-2 lg:hidden" aria-label="Navigation mobile">
          {[
            { href: "/dashboard", label: "Vue d'ensemble" },
            { href: "/dashboard/new-video", label: "Nouvelle vidéo" },
            { href: "/dashboard/billing", label: "Facturation" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-xs text-warm-gray transition-colors hover:bg-cream hover:text-coffee"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 px-5 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
