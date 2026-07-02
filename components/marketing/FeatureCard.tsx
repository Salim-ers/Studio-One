interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <article className="group rounded-2xl border border-hairline bg-ivory p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-bronze/30 hover:shadow-lifted">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-cream text-bronze transition-colors duration-300 group-hover:bg-[#F3E9DC]">
        {icon}
      </span>
      <h3 className="mt-5 font-display text-lg text-coffee">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-warm-gray">{description}</p>
    </article>
  );
}
