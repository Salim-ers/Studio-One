"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/ui/LogoMark";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/#workflow", label: "Workflow" },
  { href: "/#exemples", label: "Exemples" },
  { href: "/#durees", label: "Formats" },
  { href: "/pricing", label: "Tarifs" },
  { href: "/#faq", label: "FAQ" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-hairline bg-ivory/90 backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6">
        <LogoMark size={40} />

        <nav className="hidden items-center gap-8 md:flex" aria-label="Navigation principale">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-warm-gray transition-colors hover:text-bronze-deep"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button href="/login" variant="ghost" size="sm">
            Se connecter
          </Button>
          <Button href="/register" size="sm">
            Créer ma première vidéo
          </Button>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline md:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            {open ? (
              <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.5" />
            ) : (
              <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="1.5" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-hairline bg-ivory px-6 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-4" aria-label="Navigation mobile">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-sm text-coffee"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 flex flex-col gap-3">
            <Button href="/login" variant="secondary">
              Se connecter
            </Button>
            <Button href="/register">Créer ma première vidéo</Button>
          </div>
        </div>
      )}
    </header>
  );
}
