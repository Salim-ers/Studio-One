import Image from "next/image";
import Link from "next/link";
import { FilmRule } from "@/components/ui/FilmRule";

/**
 * Cadre commun aux pages login / register :
 * scène ivoire, halo bronze, logo au-dessus de la carte.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-cream/50 px-6 py-16">
      <div
        aria-hidden
        className="bronze-halo absolute left-1/2 top-1/3 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/2"
      />

      <Link href="/" aria-label="Retour à l'accueil Studio One" className="relative">
        <Image
          src="/brand/logo-bronze.png"
          alt="Studio One"
          width={72}
          height={72}
          className="rounded-full shadow-soft"
          priority
        />
      </Link>

      <div className="relative mt-8 w-full max-w-[420px]">
        <div className="card-surface overflow-hidden">
          <div className="px-8 pt-8 text-center">
            <h1 className="font-display text-2xl text-coffee">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-warm-gray">{subtitle}</p>
          </div>
          <div className="px-8 py-8">{children}</div>
          <FilmRule />
        </div>
        <p className="mt-6 text-center text-sm text-warm-gray">{footer}</p>
      </div>
    </main>
  );
}

export function GoogleButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-full border border-hairline-strong bg-ivory text-sm font-medium text-coffee transition-all duration-300 hover:border-bronze hover:shadow-soft"
    >
      <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
        <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" fill="#4285F4" />
        <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 009 18z" fill="#34A853" />
        <path d="M3.97 10.72a5.4 5.4 0 010-3.44V4.95H.96a9 9 0 000 8.1l3-2.33z" fill="#FBBC05" />
        <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 00.96 4.95l3 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335" />
      </svg>
      {label}
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-4" aria-hidden>
      <span className="h-px flex-1 bg-[rgba(154,106,58,0.18)]" />
      <span className="text-[11px] uppercase tracking-caps text-warm-gray">ou</span>
      <span className="h-px flex-1 bg-[rgba(154,106,58,0.18)]" />
    </div>
  );
}
