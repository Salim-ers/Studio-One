import Link from "next/link";
import { LogoMark } from "@/components/ui/LogoMark";
import { FilmRule } from "@/components/ui/FilmRule";

const columns = [
  {
    title: "Produit",
    links: [
      { href: "/#workflow", label: "Workflow" },
      { href: "/#durees", label: "Formats 60 / 90 / 120 s" },
      { href: "/pricing", label: "Tarifs" },
      { href: "/#securite", label: "Sécurité" },
    ],
  },
  {
    title: "Compte",
    links: [
      { href: "/login", label: "Connexion" },
      { href: "/register", label: "Inscription" },
      { href: "/dashboard", label: "Tableau de bord" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { href: "/#exemples", label: "Exemples de vidéos" },
      { href: "/#faq", label: "FAQ" },
      { href: "/#pour-qui", label: "Pour qui ?" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-coffee text-cream">
      <FilmRule className="opacity-60" />
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <LogoMark variant="white" size={48} withWordmark={false} />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream/60">
            Votre SaaS mérite une démo aussi claire que votre produit. Des
            vidéos de démonstration 4K, structurées scène par scène.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="eyebrow text-bronze-light">{col.title}</p>
            <ul className="mt-4 space-y-3">
              {col.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream/70 transition-colors hover:text-ivory"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-cream/50 md:flex-row md:items-center md:justify-between">
          <span>© 2026 Studio One. Tous droits réservés.</span>
          <span>Fait pour les fondateurs, les équipes sales et les agences.</span>
        </div>
      </div>
    </footer>
  );
}
