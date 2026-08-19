"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Confettis pour les bonnes nouvelles : un poste décroché, un premier CV
 * enregistré, un retour partagé.
 *
 * Écrit à la main plutôt qu'en dépendance : le besoin tient en une centaine de
 * lignes, et une bibliothèque de confettis embarque un moteur de particules
 * complet pour un effet qui dure deux secondes.
 *
 * Le rendu passe par un `<canvas>` en superposition, sans interaction possible.
 * Une centaine de particules dessinées image par image ne touche jamais au DOM,
 * là où autant d'éléments animés en CSS forceraient un recalcul de style à
 * chaque image.
 */

interface Particule {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vitesseRotation: number;
  taille: number;
  couleur: string;
  forme: "carre" | "cercle";
}

/** Palette de la marque, plus quelques teintes chaudes pour la fête. */
const COULEURS = [
  "oklch(0.649 0.193 252)",
  "oklch(0.72 0.17 200)",
  "oklch(0.68 0.19 275)",
  "oklch(0.75 0.15 80)",
  "oklch(0.62 0.15 162)",
  "oklch(0.63 0.19 15)",
];

const GRAVITE = 0.32;
const FROTTEMENT = 0.992;

/**
 * Déclencheur global.
 *
 * Un événement plutôt qu'un contexte React : la célébration part depuis des
 * gestionnaires de mutation dispersés dans l'application, qui n'ont aucune
 * raison d'être branchés à un fournisseur pour émettre un signal ponctuel.
 */
const EVENEMENT = "noken:celebration";

export function celebrer(intensite: "normale" | "forte" = "normale") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENEMENT, { detail: { intensite } }));
}

export function Confettis() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [actif, setActif] = useState(false);

  useEffect(() => {
    // Toute la mécanique vit dans l'effet : la boucle d'animation se rappelle
    // elle-même, ce qu'une fonction mémoïsée entre rendus ne permet pas
    // d'exprimer sans se référencer avant sa propre déclaration.
    let particules: Particule[] = [];
    let frame = 0;

    function dessiner() {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const restantes: Particule[] = [];
      for (const p of particules) {
        p.vy += GRAVITE;
        p.vx *= FROTTEMENT;
        p.vy *= FROTTEMENT;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vitesseRotation;

        // Une particule sortie par le bas ne reviendra pas : inutile de
        // continuer à l'intégrer.
        if (p.y > canvas.height + 40) continue;
        restantes.push(p);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.couleur;
        if (p.forme === "cercle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.taille / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.taille / 2, -p.taille / 4, p.taille, p.taille / 2);
        }
        ctx.restore();
      }

      particules = restantes;

      if (restantes.length) {
        frame = requestAnimationFrame(dessiner);
      } else {
        setActif(false);
      }
    }

    function surCelebration(event: Event) {
      // La préférence est relue à chaque déclenchement : elle peut changer en
      // cours de session depuis les réglages du système.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const forte =
        (event as CustomEvent<{ intensite?: string }>).detail?.intensite ===
        "forte";
      const nombre = forte ? 160 : 90;

      // Deux jets partant des coins bas, comme des canons à confettis : une
      // pluie depuis le haut de l'écran masquerait le message de réussite.
      for (let i = 0; i < nombre; i++) {
        const depuisGauche = i % 2 === 0;
        const angle = -60 + (Math.random() * 40 - 20);
        const radians = (angle * Math.PI) / 180;
        const vitesse = 14 + Math.random() * 12;

        particules.push({
          x: depuisGauche ? 0 : canvas.width,
          y: canvas.height * 0.92,
          vx: Math.cos(radians) * vitesse * (depuisGauche ? 1 : -1),
          vy: Math.sin(radians) * vitesse,
          rotation: Math.random() * Math.PI,
          vitesseRotation: (Math.random() - 0.5) * 0.35,
          taille: 7 + Math.random() * 7,
          couleur: COULEURS[Math.floor(Math.random() * COULEURS.length)],
          forme: Math.random() > 0.35 ? "carre" : "cercle",
        });
      }

      setActif(true);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(dessiner);
    }

    window.addEventListener(EVENEMENT, surCelebration);
    return () => {
      window.removeEventListener(EVENEMENT, surCelebration);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100]"
      style={{ display: actif ? "block" : "none" }}
    />
  );
}
