"use client";

import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Fil d'étapes du CV.
 *
 * Toutes les étapes restent atteignables d'un clic, dans les deux sens : un CV
 * ne se remplit pas dans l'ordre, on revient sans cesse ajouter une expérience
 * oubliée. Un parcours qui n'avancerait que vers l'avant obligerait à traverser
 * les étapes intermédiaires pour corriger une ligne.
 *
 * Sur mobile, le fil se réduit aux pastilles : les libellés côte à côte y
 * deviennent illisibles au-delà de trois étapes.
 */
export interface Etape {
  cle: string;
  libelle: string;
  icone: LucideIcon;
  couleur: string;
  /** Vrai dès que l'étape contient au moins une information. */
  renseignee: boolean;
}

export function FilEtapes({
  etapes,
  courante,
  onChange,
}: {
  etapes: Etape[];
  courante: number;
  onChange: (index: number) => void;
}) {
  return (
    <nav aria-label="Étapes du CV" className="mb-5">
      <ol className="flex items-center">
        {etapes.map((etape, index) => {
          const active = index === courante;
          const Icone = etape.icone;

          return (
            <li key={etape.cle} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                onClick={() => onChange(index)}
                aria-current={active ? "step" : undefined}
                className="group flex shrink-0 flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    "grid size-10 place-items-center rounded-xl border-2 transition-all duration-200",
                    active
                      ? "scale-110 text-white shadow-md"
                      : etape.renseignee
                        ? "bg-card"
                        : "border-border bg-card text-muted-foreground group-hover:border-foreground/30",
                  )}
                  style={
                    active
                      ? { background: etape.couleur, borderColor: etape.couleur }
                      : etape.renseignee
                        ? { borderColor: etape.couleur, color: etape.couleur }
                        : undefined
                  }
                >
                  {etape.renseignee && !active ? (
                    <Check className="size-4.5" aria-hidden />
                  ) : (
                    <Icone className="size-4.5" aria-hidden />
                  )}
                </span>

                <span
                  className={cn(
                    "hidden max-w-24 truncate text-xs sm:block",
                    active
                      ? "font-bold text-foreground"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {etape.libelle}
                </span>
              </button>

              {/* Trait de liaison, coloré jusqu'à l'étape atteinte. */}
              {index < etapes.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "mx-1 h-0.5 flex-1 rounded-full transition-colors duration-300 sm:mx-2",
                    index < courante ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
