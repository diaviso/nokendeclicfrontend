"use client";

import { useId, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Barre de filtres d'un catalogue : la recherche toujours visible, les autres
 * critères repliés derrière un bouton sur téléphone.
 *
 * Empilés, cinq champs occupaient tout le premier écran d'un téléphone : on
 * n'y voyait aucune offre sans faire défiler. Sur grand écran, tout tient sur
 * une ligne et rien n'est replié.
 *
 * Les champs restent dans le DOM, seulement masqués : dans un formulaire GET,
 * ils sont envoyés même repliés, et la page fonctionne avant que le JavaScript
 * soit chargé — panneau fermé, la recherche suffit.
 */
export function FiltresRepliables({
  recherche,
  actions,
  children,
  actifs = 0,
  libelle,
  hauteur = "h-9",
}: {
  /** Champ de recherche, toujours visible. */
  recherche: React.ReactNode;
  /** Boutons placés à côté de la recherche (soumission, par exemple). */
  actions?: React.ReactNode;
  /** Critères repliés sur téléphone. */
  children: React.ReactNode;
  /** Nombre de critères actifs parmi ceux repliés. */
  actifs?: number;
  libelle: string;
  /** Hauteur des contrôles de la page, pour aligner le bouton. */
  hauteur?: string;
}) {
  // Un critère déjà actif ouvre le panneau : le replier cacherait pourquoi la
  // liste est réduite.
  const [ouvert, setOuvert] = useState(actifs > 0);
  const id = useId();

  return (
    <div className="flex flex-col gap-2 lg:flex-row">
      <div className="flex min-w-0 gap-2 lg:flex-1">
        <div className="relative min-w-0 flex-1">{recherche}</div>
        {actions}
        <Button
          type="button"
          variant={ouvert ? "secondary" : "outline"}
          className={cn("relative shrink-0 rounded-xl lg:hidden", hauteur)}
          aria-expanded={ouvert}
          aria-controls={id}
          onClick={() => setOuvert((v) => !v)}
        >
          <SlidersHorizontal className="size-4" />
          {libelle}
          {actifs > 0 ? (
            <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {actifs}
            </span>
          ) : null}
        </Button>
      </div>
      <div
        id={id}
        className={cn(
          ouvert ? "flex" : "hidden",
          "flex-col gap-2 lg:flex lg:flex-row",
        )}
      >
        {children}
      </div>
    </div>
  );
}
