"use client";

import { useRef } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

interface MagneticButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  strength?: number;
}

/**
 * Micro-interaction magnétique très légère (± quelques pixels).
 * Désactivée si l'utilisateur préfère réduire les animations.
 */
export function MagneticButton({
  children,
  className,
  strength = 10,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function onMove(e: React.MouseEvent) {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * strength;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * strength;
    gsap.to(ref.current, { x, y, duration: 0.4, ease: "power2.out" });
  }

  function onLeave() {
    if (!ref.current) return;
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
  }

  return (
    <button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(className)}
      {...props}
    >
      {children}
    </button>
  );
}
