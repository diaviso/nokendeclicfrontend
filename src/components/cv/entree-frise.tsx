"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Entrée d'une frise chronologique (expérience ou formation).
 *
 * Le parcours se lit comme une ligne de vie : une pastille par entrée, reliées
 * par un trait vertical. En blocs indépendants, la succession des postes ne se
 * lisait pas — il fallait comparer les dates pour reconstituer l'ordre.
 *
 * Le trait s'arrête à la dernière entrée : le prolonger dans le vide
 * suggérerait une suite qui n'existe pas.
 */
export function EntreeFrise({
  dernier,
  icon: Icon,
  couleur,
  titre,
  actif,
  children,
}: {
  dernier: boolean;
  icon: LucideIcon;
  couleur: string;
  /** Libellé de repli quand l'entrée n'est pas encore renseignée. */
  titre: string;
  /** Marque une entrée en cours (poste actuel, formation en cours). */
  actif?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {/* Trait de liaison */}
      {!dernier ? (
        <span
          aria-hidden
          className="absolute left-[19px] top-11 bottom-0 w-px bg-border"
        />
      ) : null}

      <span
        className={cn(
          "relative z-10 grid size-10 shrink-0 place-items-center rounded-xl border-2 bg-card",
        )}
        style={{ borderColor: couleur, color: couleur }}
      >
        <Icon className="size-4.5" aria-hidden />
        {actif ? (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-card"
            style={{ background: couleur }}
          />
        ) : null}
      </span>

      <div className="min-w-0 flex-1">
        <p className="mb-2.5 flex items-center gap-2 text-sm font-bold">
          {titre}
          {actif ? (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{
                background: `color-mix(in oklch, ${couleur} 14%, transparent)`,
                color: couleur,
              }}
            >
              En cours
            </span>
          ) : null}
        </p>
        <div className="rounded-2xl border bg-muted/20 p-4">{children}</div>
      </div>
    </li>
  );
}
