import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-cream/50 px-6 text-center">
      <div aria-hidden className="bronze-halo absolute left-1/2 top-1/2 h-[420px] w-[680px] -translate-x-1/2 -translate-y-1/2" />
      <Image src="/brand/logo-bronze.png" alt="Studio One" width={64} height={64} className="relative rounded-full shadow-soft" />
      <h1 className="relative mt-8 font-display text-4xl text-coffee">Cette page n&apos;existe pas.</h1>
      <p className="relative mt-3 max-w-md text-sm leading-relaxed text-warm-gray">
        Le lien est peut-être ancien ou incorrect. Retrouvez votre chemin
        depuis l&apos;accueil ou votre tableau de bord.
      </p>
      <div className="relative mt-8 flex gap-3">
        <Button href="/">Retour à l&apos;accueil</Button>
        <Button href="/dashboard" variant="secondary">Mon tableau de bord</Button>
      </div>
    </main>
  );
}
