"use client";

import { Layers, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RubriqueCV } from "@/lib/types";

/**
 * Rubriques du CV sans équivalent dans le modèle fixe.
 *
 * C'est le second sens de l'adaptation : le contenu remplit le formulaire, mais
 * le formulaire s'étend aussi au contenu. Publications, projets personnels,
 * bénévolat, distinctions — autant de sections qu'un CV réel comporte et que
 * l'import jetait faute de case où les ranger.
 *
 * La structure reste volontairement pauvre — titre, sous-titre, période,
 * description. Elle couvre l'essentiel sans imposer un modèle propre à une
 * rubrique particulière, et la période demeure une chaîne libre : un CV écrit
 * « 2021 — aujourd'hui », et le convertir en dates inventerait une précision
 * que le document ne donne pas.
 */
export function RubriquesLibres({
  valeur,
  onChange,
}: {
  valeur: RubriqueCV[];
  onChange: (suivant: RubriqueCV[]) => void;
}) {
  const modifierRubrique = (index: number, patch: Partial<RubriqueCV>) =>
    onChange(valeur.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const modifierEntree = (
    indexRubrique: number,
    indexEntree: number,
    patch: Partial<RubriqueCV["entrees"][number]>,
  ) =>
    modifierRubrique(indexRubrique, {
      entrees: valeur[indexRubrique].entrees.map((e, i) =>
        i === indexEntree ? { ...e, ...patch } : e,
      ),
    });

  return (
    <div className="space-y-4">
      {valeur.length === 0 ? (
        <p className="dashed-frame px-6 py-10 text-center text-sm text-muted-foreground">
          Aucune rubrique supplémentaire. Ajoutez-en une pour vos publications,
          projets personnels, engagements associatifs ou distinctions.
        </p>
      ) : (
        valeur.map((rubrique, indexRubrique) => (
          <section
            key={indexRubrique}
            className="overflow-hidden rounded-2xl border bg-muted/20"
          >
            <header className="flex items-center gap-2 border-b bg-card px-4 py-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Layers className="size-4" aria-hidden />
              </span>

              <Input
                value={rubrique.titre}
                onChange={(event) =>
                  modifierRubrique(indexRubrique, { titre: event.target.value })
                }
                placeholder="Titre de la rubrique"
                aria-label="Titre de la rubrique"
                className="h-9 border-0 bg-transparent px-0 text-base font-bold shadow-none focus-visible:ring-0"
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Supprimer la rubrique"
                onClick={() =>
                  onChange(valeur.filter((_, i) => i !== indexRubrique))
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </header>

            <div className="space-y-3 p-4">
              {rubrique.entrees.map((entree, indexEntree) => (
                <div key={indexEntree} className="rounded-xl border bg-card p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      value={entree.titre}
                      onChange={(event) =>
                        modifierEntree(indexRubrique, indexEntree, {
                          titre: event.target.value,
                        })
                      }
                      placeholder="Intitulé"
                      aria-label="Intitulé"
                    />
                    <Input
                      value={entree.sousTitre ?? ""}
                      onChange={(event) =>
                        modifierEntree(indexRubrique, indexEntree, {
                          sousTitre: event.target.value,
                        })
                      }
                      placeholder="Organisme, éditeur…"
                      aria-label="Sous-titre"
                    />
                  </div>

                  <Input
                    value={entree.periode ?? ""}
                    onChange={(event) =>
                      modifierEntree(indexRubrique, indexEntree, {
                        periode: event.target.value,
                      })
                    }
                    placeholder="Période, ex. 2021 — 2023"
                    aria-label="Période"
                    className="mt-2"
                  />

                  <Textarea
                    value={entree.description ?? ""}
                    onChange={(event) =>
                      modifierEntree(indexRubrique, indexEntree, {
                        description: event.target.value,
                      })
                    }
                    rows={2}
                    placeholder="Description (facultative)"
                    aria-label="Description"
                    className="mt-2"
                  />

                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        modifierRubrique(indexRubrique, {
                          entrees: rubrique.entrees.filter(
                            (_, i) => i !== indexEntree,
                          ),
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                      Retirer
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() =>
                  modifierRubrique(indexRubrique, {
                    entrees: [
                      ...rubrique.entrees,
                      { titre: "", sousTitre: "", periode: "", description: "" },
                    ],
                  })
                }
              >
                <Plus className="size-4" />
                Ajouter une entrée
              </Button>
            </div>
          </section>
        ))
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full rounded-xl border-dashed"
        onClick={() =>
          onChange([
            ...valeur,
            {
              titre: "",
              entrees: [{ titre: "", sousTitre: "", periode: "", description: "" }],
            },
          ])
        }
      >
        <Plus className="size-4" />
        Ajouter une rubrique
      </Button>
    </div>
  );
}
