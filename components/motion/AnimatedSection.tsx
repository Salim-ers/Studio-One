"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  /** Sélecteur des enfants à faire entrer en stagger (optionnel). */
  stagger?: string;
  delay?: number;
  as?: "section" | "div" | "li" | "article";
}

/**
 * Révélation au scroll : translation douce + fondu, stagger optionnel.
 * Respecte prefers-reduced-motion via gsap.matchMedia.
 */
export function AnimatedSection({
  children,
  className,
  stagger,
  delay = 0,
  as: Tag = "section",
}: AnimatedSectionProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const targets = stagger ? el.querySelectorAll(stagger) : el;
      gsap.fromTo(
        targets,
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          delay,
          ease: "power3.out",
          stagger: stagger ? 0.12 : 0,
          scrollTrigger: { trigger: el, start: "top 82%", once: true },
        }
      );
    });

    return () => mm.revert();
  }, [stagger, delay]);

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}
