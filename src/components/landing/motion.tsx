"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Primitives d'animation de la page d'accueil.
 *
 * Chacune respecte `prefers-reduced-motion` : la préférence système est lue via
 * `useReducedMotion` et neutralise l'effet plutôt que de le raccourcir — une
 * animation deux fois plus rapide reste une animation.
 */

/** Apparition à l'entrée dans le champ de vision, une seule fois. */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduit = useReducedMotion();

  return (
    <motion.div
      initial={reduit ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Inclinaison 3D suivant le pointeur.
 *
 * Désactivée au toucher : sans survol, l'effet ne se déclencherait qu'au moment
 * du tap et donnerait l'impression que la carte glisse sous le doigt.
 */
export function TiltCard({
  children,
  className,
  intensite = 8,
}: {
  children: React.ReactNode;
  className?: string;
  intensite?: number;
}) {
  const reduit = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 160, damping: 18 });
  const sry = useSpring(ry, { stiffness: 160, damping: 18 });

  if (reduit) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      onPointerMove={(event: React.PointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== "mouse") return;
        const rect = event.currentTarget.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        ry.set(px * intensite);
        rx.set(-py * intensite);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      style={{
        rotateX: srx,
        rotateY: sry,
        transformPerspective: 1100,
        transformStyle: "preserve-3d",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Compteur qui s'incrémente à l'entrée dans le champ de vision. */
export function Counter({
  to,
  duree = 1.5,
  suffixe = "",
}: {
  to: number;
  duree?: number;
  suffixe?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true, margin: "-40px" });
  const reduit = useReducedMotion();
  const [valeur, setValeur] = useState(0);

  useEffect(() => {
    // Mouvement réduit : la valeur finale est rendue directement, sans passer
    // par l'état — inutile d'animer ce que l'on affichera d'emblée.
    if (!visible || reduit) return;

    let frame = 0;
    let debut: number | null = null;

    const etape = (t: number) => {
      debut ??= t;
      const p = Math.min((t - debut) / (duree * 1000), 1);
      // Courbe d'amortissement : le compteur ralentit en fin de course.
      setValeur(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) frame = requestAnimationFrame(etape);
    };

    frame = requestAnimationFrame(etape);
    return () => cancelAnimationFrame(frame);
  }, [visible, to, duree, reduit]);

  return (
    <span ref={ref} className="tabular-nums">
      {new Intl.NumberFormat("fr-FR").format(reduit ? to : valeur)}
      {suffixe}
    </span>
  );
}

/**
 * Défilement horizontal continu.
 *
 * Le contenu est dupliqué et la translation s'arrête à -50 % : au moment où la
 * première copie sort du champ, la seconde occupe exactement sa place, et la
 * boucle est invisible.
 */
export function Marquee({
  children,
  duree = "42s",
  className,
}: {
  children: React.ReactNode;
  duree?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
      }}
    >
      <div
        className="anim-marquee flex w-max items-center gap-3"
        style={{ "--dur": duree } as React.CSSProperties & Record<string, string>}
      >
        <div className="flex items-center gap-3">{children}</div>
        <div className="flex items-center gap-3" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
