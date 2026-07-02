"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Orchestration du hero au chargement :
 * badge → titre → sous-titre → CTA → scène mockup → timeline qui se construit.
 */
export function HeroReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        el.querySelectorAll("[data-hero='fade']"),
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.14 }
      )
        .fromTo(
          el.querySelector("[data-hero='scene']"),
          { autoAlpha: 0, y: 40, scale: 0.985 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 1.1 },
          "-=0.5"
        )
        .fromTo(
          el.querySelectorAll("[data-hero='clip']"),
          { scaleX: 0, transformOrigin: "left center" },
          { scaleX: 1, duration: 0.7, stagger: 0.1, ease: "power2.inOut" },
          "-=0.6"
        )
        .fromTo(
          el.querySelectorAll("[data-hero='chip']"),
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.12 },
          "-=0.4"
        );

      // Dérive très lente des cartes flottantes — ambiance, pas spectacle.
      gsap.to(el.querySelectorAll("[data-float]"), {
        y: -8,
        duration: 4.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.8,
      });

      // Tête de lecture qui parcourt la timeline en boucle.
      const playhead = el.querySelector("[data-hero='playhead']");
      if (playhead) {
        gsap.fromTo(
          playhead,
          { left: "2%" },
          { left: "96%", duration: 12, ease: "none", repeat: -1 }
        );
      }
    });

    return () => mm.revert();
  }, []);

  return <div ref={ref}>{children}</div>;
}
