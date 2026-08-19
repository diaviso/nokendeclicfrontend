"use client";

import { cn } from "@/lib/utils";

export interface ColonneConsole<T> {
  cle: string;
  entete: string;
  cellule: (ligne: T) => React.ReactNode;
  /** Masquée sous `lg` : garde des colonnes lisibles sur un portable. */
  secondaire?: boolean;
  /** Alignement du contenu et de l'en-tête. */
  align?: "left" | "right";
  className?: string;
}

/**
 * Tableau de la console.
 *
 * Un back-office se lit en balayant une colonne, pas en lisant des lignes : les
 * en-têtes restent collés en haut pendant le défilement, les chiffres sont en
 * caractères tabulaires, et chaque ligne porte un rail de couleur à gauche —
 * teinte du type d'offre, du rôle, de la priorité. Ce rail est ce qui permet de
 * repérer une catégorie sans lire un seul mot.
 *
 * Sous `md`, le tableau devient une pile de cartes : un tableau à défilement
 * horizontal sur téléphone perd ses en-têtes dès le premier geste.
 */
export function ConsoleTable<T>({
  lignes,
  colonnes,
  cle,
  onLigneClick,
  rail,
  vide,
  chargement,
  className,
}: {
  lignes: T[];
  colonnes: ColonneConsole<T>[];
  cle: (ligne: T) => string | number;
  onLigneClick?: (ligne: T) => void;
  /** Couleur du rail gauche, calculée par ligne. */
  rail?: (ligne: T) => string | undefined;
  vide?: React.ReactNode;
  chargement?: boolean;
  className?: string;
}) {
  if (chargement) {
    return (
      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="h-11 border-b bg-muted/40" />
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b px-4 py-3.5 last:border-b-0"
            style={{ opacity: 1 - index * 0.09 }}
          >
            <div className="shimmer size-9 shrink-0 rounded-lg bg-muted" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="shimmer h-3 w-1/3 rounded bg-muted" />
              <div className="shimmer h-2.5 w-1/5 rounded bg-muted" />
            </div>
            <div className="shimmer h-5 w-16 shrink-0 rounded-full bg-muted" />
            <div className="shimmer hidden h-3 w-20 shrink-0 rounded bg-muted lg:block" />
          </div>
        ))}
      </div>
    );
  }

  if (lignes.length === 0) return <>{vide}</>;

  return (
    <div className={className}>
      {/*
       * Tableau — à partir de md.
       *
       * Aucun conteneur intermédiaire ne porte `overflow` : la moindre valeur
       * autre que `visible` créerait un contexte de défilement, et l'en-tête
       * collant se calerait sur lui plutôt que sur la page — il défilerait donc
       * avec le tableau, sans rien coller du tout. Les bords arrondis sont pour
       * la même raison portés par les cellules d'angle, et non par un cadre qui
       * rognerait le contenu.
       *
       * `border-separate` plutôt que la fusion des bordures : une bordure fusionnée
       * appartient à la fois à l'en-tête et à la première ligne, et se détache de
       * l'en-tête dès qu'il se décolle.
       */}
      <div className="hidden rounded-2xl border bg-card shadow-sm md:block">
        {/*
         * `table-fixed` : les largeurs viennent des colonnes déclarées, pas du
         * contenu. Sans lui, un titre d'offre de cent caractères élargit la
         * table au-delà de la page — et `truncate` ne coupe rien, puisque la
         * cellule s'étire pour l'accueillir.
         */}
        <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
          <thead className="sticky top-[var(--console-entete)] z-10">
            <tr>
              {colonnes.map((colonne, indexColonne) => (
                <th
                  key={colonne.cle}
                  scope="col"
                  className={cn(
                    "border-b bg-muted/85 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground backdrop-blur",
                    colonne.align === "right" ? "text-right" : "text-left",
                    colonne.secondaire && "hidden lg:table-cell",
                    indexColonne === 0 && "rounded-tl-2xl",
                    indexColonne === colonnes.length - 1 && "rounded-tr-2xl",
                    colonne.className,
                  )}
                >
                  {colonne.entete}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {lignes.map((ligne, index) => {
              const couleurRail = rail?.(ligne);
              const derniere = index === lignes.length - 1;

              return (
                <tr
                  key={cle(ligne)}
                  onClick={onLigneClick ? () => onLigneClick(ligne) : undefined}
                  style={{ "--i": index } as React.CSSProperties}
                  className={cn(
                    "entree group",
                    onLigneClick && "cursor-pointer",
                  )}
                >
                  {colonnes.map((colonne, indexColonne) => (
                    <td
                      key={colonne.cle}
                      className={cn(
                        "relative px-4 py-3 align-middle transition-colors",
                        !derniere && "border-b",
                        colonne.align === "right" && "text-right",
                        colonne.secondaire && "hidden lg:table-cell",
                        onLigneClick && "group-hover:bg-muted/50",
                        colonne.className,
                      )}
                    >
                      {/* Rail de catégorie, porté par la première cellule.
                          Il s'épaissit au survol : le repère de couleur reste
                          lisible au repos sans découper la ligne. */}
                      {indexColonne === 0 && couleurRail ? (
                        <span
                          aria-hidden
                          className="absolute inset-y-0 left-0 w-[3px] transition-all duration-200 group-hover:w-[5px]"
                          style={{ background: couleurRail }}
                        />
                      ) : null}
                      {colonne.cellule(ligne)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cartes — sous md */}
      <ul className="space-y-2.5 md:hidden">
        {lignes.map((ligne, index) => {
          const couleurRail = rail?.(ligne);

          return (
            <li
              key={cle(ligne)}
              onClick={onLigneClick ? () => onLigneClick(ligne) : undefined}
              style={{ "--i": index } as React.CSSProperties}
              className={cn(
                "entree relative overflow-hidden rounded-xl border bg-card p-4 pl-5 shadow-sm",
                onLigneClick && "cursor-pointer transition-shadow active:shadow-none",
              )}
            >
              {couleurRail ? (
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1"
                  style={{ background: couleurRail }}
                />
              ) : null}

              <dl className="space-y-2">
                {colonnes.map((colonne) =>
                  // Une colonne sans en-tête (celle des actions) occupe toute
                  // la largeur : lui inventer un libellé alourdirait la carte,
                  // et laisser un `dt` vide creuserait une colonne fantôme.
                  colonne.entete ? (
                    <div
                      key={colonne.cle}
                      className="flex items-start justify-between gap-3"
                    >
                      <dt className="shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {colonne.entete}
                      </dt>
                      <dd className="min-w-0 text-right text-sm">
                        {colonne.cellule(ligne)}
                      </dd>
                    </div>
                  ) : (
                    <dd
                      key={colonne.cle}
                      className="flex justify-end border-t pt-2 text-sm"
                    >
                      {colonne.cellule(ligne)}
                    </dd>
                  ),
                )}
              </dl>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
