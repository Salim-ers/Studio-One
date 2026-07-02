interface TestimonialCardProps {
  quote: string;
  name: string;
  role: string;
}

export function TestimonialCard({ quote, name, role }: TestimonialCardProps) {
  return (
    <figure className="flex flex-col rounded-2xl border border-hairline bg-ivory p-8 shadow-soft">
      <svg width="26" height="20" viewBox="0 0 26 20" fill="none" aria-hidden className="text-bronze/40">
        <path d="M0 20V12.4C0 5.6 3.8 1.2 10.4 0l1.4 3.2C7.6 4.6 5.6 7 5.4 10H11v10H0zm15 0V12.4C15 5.6 18.8 1.2 25.4 0l1.4 3.2c-4.2 1.4-6.2 3.8-6.4 6.8H26v10H15z" fill="currentColor" transform="scale(0.9)" />
      </svg>
      <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-coffee/90">
        {quote}
      </blockquote>
      <figcaption className="mt-6 border-t border-hairline pt-4">
        <p className="text-sm font-semibold text-coffee">{name}</p>
        <p className="text-xs text-warm-gray">{role}</p>
      </figcaption>
    </figure>
  );
}
