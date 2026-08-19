"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Avancement du CV.
 *
 * Un CV se remplit en plusieurs passages, souvent sur plusieurs jours. Sans
 * repère, on rouvre la page sans savoir ce qui manque et on relit tout le
 * formulaire. Les étapes sont donc listées, cochées à mesure, avec un anneau
 * qui donne la mesure d'un coup d'œil.
 *
 * Le bloc disparaît une fois tout rempli : il n'a plus rien à dire, et
 * occuperait la place de ce que l'on vient réellement modifier.
 */
export interface EtapeCV {
  libelle: string;
  fait: boolean;
}

export function AvancementCV({ etapes }: { etapes: EtapeCV[] }) {
  const faites = etapes.filter((e) => e.fait).length;
  const pourcentage = Math.round((faites / etapes.length) * 100);

  if (pourcentage === 100) return null;

  // Périmètre d'un cercle de rayon 26 : sert à convertir le pourcentage en
  // longueur de trait.
  const rayon = 26;
  const perimetre = 2 * Math.PI * rayon;

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="relative size-16 shrink-0">
            <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={rayon}
                fill="none"
                stroke="var(--muted)"
                strokeWidth="6"
              />
              <circle
                cx="32"
                cy="32"
                r={rayon}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={perimetre}
                strokeDashoffset={perimetre * (1 - pourcentage / 100)}
                className="transition-[stroke-dashoffset] duration-700"
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center text-sm font-bold tabular-nums">
              {pourcentage}%
            </span>
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-bold">Votre CV prend forme</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {faites} étape{faites > 1 ? "s" : ""} sur {etapes.length}.
              Complétez-le pour que l&apos;assistant s&apos;appuie dessus.
            </p>
          </div>
        </div>

        <ul className="flex flex-wrap gap-x-4 gap-y-2 sm:ml-auto sm:max-w-md">
          {etapes.map((etape) => (
            <li
              key={etape.libelle}
              className={cn(
                "flex items-center gap-1.5 text-sm",
                etape.fait ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {etape.fait ? (
                <Check className="size-4 shrink-0 text-primary" aria-hidden />
              ) : (
                <Circle className="size-4 shrink-0 opacity-40" aria-hidden />
              )}
              {etape.libelle}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
