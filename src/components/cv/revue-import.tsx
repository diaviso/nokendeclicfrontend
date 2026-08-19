"use client";

import { useState } from "react";
import {
  Award,
  Briefcase,
  Check,
  FileText,
  GraduationCap,
  Layers,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ExtractedCV } from "@/lib/types";

/**
 * Revue de ce qui a été lu dans le document, avant application au formulaire.
 *
 * L'import remplaçait auparavant le contenu du formulaire sans rien montrer.
 * Deux problèmes : on ne voyait pas ce qui allait être écrasé, et surtout rien
 * ne permettait d'écarter une information mal lue — un modèle qui se trompe sur
 * une date ou invente un employeur passait directement dans le CV.
 *
 * Le tri se fait par bloc et non champ par champ : à ce grain-là, la décision
 * reste rapide, alors qu'une case par valeur transformerait la relecture en
 * corvée et pousserait à tout accepter sans regarder.
 */
export type BlocImport =
  | "profil"
  | "contact"
  | "competences"
  | "experiences"
  | "formations"
  | "rubriques";

const BLOCS: {
  cle: BlocImport;
  libelle: string;
  icone: typeof UserRound;
  couleur: string;
}[] = [
  { cle: "profil", libelle: "Profil", icone: UserRound, couleur: "var(--chart-2)" },
  { cle: "contact", libelle: "Coordonnées", icone: FileText, couleur: "var(--chart-1)" },
  { cle: "competences", libelle: "Compétences et langues", icone: Award, couleur: "var(--chart-5)" },
  { cle: "experiences", libelle: "Expériences", icone: Briefcase, couleur: "var(--chart-3)" },
  { cle: "formations", libelle: "Formations", icone: GraduationCap, couleur: "var(--chart-4)" },
  { cle: "rubriques", libelle: "Autres rubriques", icone: Layers, couleur: "var(--chart-1)" },
];

/** Résumé lisible de ce qu'un bloc contient, pour décider sans tout déplier. */
function resumer(donnees: ExtractedCV, bloc: BlocImport): string[] {
  switch (bloc) {
    case "profil":
      return [donnees.titreProfessionnel, donnees.resume].filter(
        (v): v is string => Boolean(v?.trim()),
      );
    case "contact":
      return [
        donnees.telephone,
        donnees.ville,
        donnees.pays,
        donnees.linkedin,
        donnees.github,
        donnees.siteWeb,
      ].filter((v): v is string => Boolean(v?.trim()));
    case "competences":
      return [...(donnees.competences ?? []), ...(donnees.langues ?? [])];
    case "experiences":
      return (donnees.experiences ?? []).map((e) =>
        [e.poste, e.entreprise].filter(Boolean).join(" — "),
      );
    case "formations":
      return (donnees.formations ?? []).map((f) =>
        [f.diplome, f.etablissement].filter(Boolean).join(" — "),
      );
    case "rubriques":
      return (donnees.rubriques ?? []).map(
        (r) => `${r.titre} (${r.entrees.length})`,
      );
  }
}

export function RevueImport({
  donnees,
  onAnnuler,
  onAppliquer,
}: {
  donnees: ExtractedCV | null;
  onAnnuler: () => void;
  onAppliquer: (blocs: Set<BlocImport>) => void;
}) {
  // Tous les blocs trouvés sont retenus par défaut : le cas courant est que la
  // lecture soit bonne, et on ne demande un geste que pour écarter.
  const [retenus, setRetenus] = useState<Set<BlocImport>>(
    () => new Set(BLOCS.map((b) => b.cle)),
  );

  if (!donnees) return null;

  const disponibles = BLOCS.map((bloc) => ({
    ...bloc,
    valeurs: resumer(donnees, bloc.cle),
  })).filter((bloc) => bloc.valeurs.length > 0);

  const basculer = (cle: BlocImport) =>
    setRetenus((precedent) => {
      const suivant = new Set(precedent);
      if (suivant.has(cle)) suivant.delete(cle);
      else suivant.add(cle);
      return suivant;
    });

  return (
    <Dialog open onOpenChange={onAnnuler}>
      <DialogContent className="grid max-h-[85dvh] grid-cols-[minmax(0,1fr)] overflow-y-auto overflow-x-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Voici ce que nous avons lu</DialogTitle>
          <DialogDescription>
            Décochez ce qui a été mal interprété. Rien n&apos;est enregistré :
            les blocs retenus remplissent le formulaire, que vous pourrez encore
            corriger avant d&apos;enregistrer.
          </DialogDescription>
        </DialogHeader>

        {disponibles.length === 0 ? (
          <p className="dashed-frame px-6 py-10 text-center text-sm text-muted-foreground">
            Aucune information exploitable n&apos;a pu être lue dans ce document.
            Essayez une photo mieux cadrée, ou saisissez votre CV directement.
          </p>
        ) : (
          <ul className="min-w-0 space-y-3">
            {disponibles.map((bloc) => {
              const Icone = bloc.icone;
              const actif = retenus.has(bloc.cle);

              return (
                <li key={bloc.cle}>
                  <label
                    className={cn(
                      "flex cursor-pointer gap-3.5 rounded-2xl border p-4 transition-all duration-200",
                      actif
                        ? "border-primary/40 bg-primary/[0.04]"
                        : "opacity-55 hover:opacity-80",
                    )}
                  >
                    <Checkbox
                      checked={actif}
                      onCheckedChange={() => basculer(bloc.cle)}
                      className="mt-0.5"
                      aria-label={`Retenir ${bloc.libelle}`}
                    />

                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-xl"
                      style={{
                        background: `color-mix(in oklch, ${bloc.couleur} 14%, transparent)`,
                        color: bloc.couleur,
                      }}
                    >
                      <Icone className="size-4.5" aria-hidden />
                    </span>

                    <span className="min-w-0 flex-1 overflow-hidden">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-base font-bold">
                          {bloc.libelle}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                          {bloc.valeurs.length}
                        </span>
                      </span>

                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        {bloc.valeurs.slice(0, 8).map((valeur, index) => (
                          <span
                            key={`${valeur}-${index}`}
                            className="min-w-0 max-w-full truncate rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {valeur}
                          </span>
                        ))}
                        {bloc.valeurs.length > 8 ? (
                          <span className="px-1 text-xs text-muted-foreground">
                            +{bloc.valeurs.length - 8}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button variant="ghost" className="rounded-xl" onClick={onAnnuler}>
            Annuler
          </Button>
          <Button
            className="rounded-xl"
            disabled={retenus.size === 0 || disponibles.length === 0}
            onClick={() => onAppliquer(retenus)}
          >
            <Check className="size-4" />
            Remplir le formulaire
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
