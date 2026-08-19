"use client";

import { useId, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { CARTE_VUE, REGIONS_TRACEES } from "@/lib/senegal-carte";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Répartition des membres par région.
 *
 * Une carte répond à une question que le classement en barres ne traite pas :
 * la couverture est-elle continue, ou laisse-t-elle des trous ? Trois régions
 * voisines à zéro se voient d'un coup d'œil sur une carte, jamais dans une
 * liste triée par effectif.
 *
 * Le tableau posé à côté n'est pas un doublon décoratif : une carte n'est
 * lisible ni au lecteur d'écran ni à qui distingue mal les teintes, et c'est là
 * qu'on lit les chiffres exacts.
 */

/** Cinq paliers : au-delà, l'œil ne distingue plus les teintes voisines. */
const PALIERS = 5;

function palier(valeur: number, maximum: number): number {
  if (valeur <= 0) return 0;
  if (maximum <= 0) return 0;
  // Racine carrée plutôt que proportion directe : Dakar écrase le reste, et une
  // échelle linéaire peindrait treize régions de la même teinte pâle.
  const part = Math.sqrt(valeur / maximum);
  return Math.min(PALIERS, Math.max(1, Math.ceil(part * PALIERS)));
}

function teinte(niveau: number): string {
  if (niveau === 0) return "var(--muted)";
  const melange = 12 + (niveau - 1) * 20; // 12 % → 92 %
  return `color-mix(in oklch, var(--chart-2) ${melange}%, var(--card))`;
}

export function CarteRegions({
  donnees,
  total,
}: {
  /** Effectif par région, tel que renvoyé par la désagrégation. */
  donnees: { region: string; count: number }[];
  /** Total des comptes, pour exprimer une part. */
  total: number;
}) {
  const identifiant = useId();
  const [survolee, setSurvolee] = useState<string | null>(null);

  const { parRegion, maximum, horsCarte, couvertes } = useMemo(() => {
    const parRegion = new Map<string, number>();
    const nomsCartes = new Set(REGIONS_TRACEES.map((r) => r.nom));
    let horsCarte = 0;

    for (const ligne of donnees) {
      if (nomsCartes.has(ligne.region)) {
        parRegion.set(ligne.region, (parRegion.get(ligne.region) ?? 0) + ligne.count);
      } else {
        // « Non précisé », ou une région saisie sous une orthographe inconnue :
        // le chiffre est annoncé à part plutôt que perdu.
        horsCarte += ligne.count;
      }
    }

    return {
      parRegion,
      maximum: Math.max(0, ...parRegion.values()),
      horsCarte,
      couvertes: [...parRegion.values()].filter((v) => v > 0).length,
    };
  }, [donnees]);

  const classement = REGIONS_TRACEES.map((r) => ({
    nom: r.nom,
    total: parRegion.get(r.nom) ?? 0,
  })).sort((a, b) => b.total - a.total || a.nom.localeCompare(b.nom, "fr"));

  const part = (valeur: number) =>
    total > 0 ? Math.round((valeur / total) * 100) : 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
      <figure className="m-0">
        <svg
          viewBox={`0 0 ${CARTE_VUE.largeur} ${CARTE_VUE.hauteur}`}
          className="h-auto w-full"
          role="img"
          aria-labelledby={`${identifiant}-titre`}
        >
          <title id={`${identifiant}-titre`}>
            Carte du Sénégal : {couvertes} région
            {couvertes > 1 ? "s" : ""} sur {REGIONS_TRACEES.length} comptent au
            moins un membre. Les effectifs exacts figurent dans le tableau
            voisin.
          </title>

          {REGIONS_TRACEES.map((region) => {
            const valeur = parRegion.get(region.nom) ?? 0;
            const actif = survolee === region.nom;

            return (
              <path
                key={region.nom}
                d={region.d}
                fill={teinte(palier(valeur, maximum))}
                stroke="var(--card)"
                strokeWidth={actif ? 3 : 1.5}
                strokeLinejoin="round"
                className="transition-[fill,stroke-width] duration-200"
                style={{ filter: actif ? "brightness(1.08)" : undefined }}
                onMouseEnter={() => setSurvolee(region.nom)}
                onMouseLeave={() => setSurvolee(null)}
              />
            );
          })}
        </svg>

        <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            Moins
            <span className="flex">
              {Array.from({ length: PALIERS + 1 }, (_, niveau) => (
                <span
                  key={niveau}
                  aria-hidden
                  className="size-4 first:rounded-l-sm last:rounded-r-sm"
                  style={{ background: teinte(niveau) }}
                />
              ))}
            </span>
            Plus
          </span>

          {maximum > 0 ? (
            <span className="text-xs text-muted-foreground">
              Jusqu&apos;à {formatNumber(maximum)} membres par région
            </span>
          ) : null}
        </figcaption>
      </figure>

      <div className="min-w-0">
        <ul className="space-y-1">
          {classement.map((ligne) => (
            <li key={ligne.nom}>
              <button
                type="button"
                onMouseEnter={() => setSurvolee(ligne.nom)}
                onMouseLeave={() => setSurvolee(null)}
                onFocus={() => setSurvolee(ligne.nom)}
                onBlur={() => setSurvolee(null)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
                  "outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                  survolee === ligne.nom ? "bg-muted" : "hover:bg-muted/60",
                )}
              >
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-sm border"
                  style={{ background: teinte(palier(ligne.total, maximum)) }}
                />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {ligne.nom}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatNumber(ligne.total)}
                </span>
                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {part(ligne.total)} %
                </span>
              </button>
            </li>
          ))}
        </ul>

        {horsCarte > 0 ? (
          <p className="mt-3 flex items-start gap-2 border-t pt-3 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {formatNumber(horsCarte)} compte{horsCarte > 1 ? "s" : ""} sans
            région exploitable — non renseignée, ou saisie sous une orthographe
            qui ne correspond à aucune des quatorze régions.
          </p>
        ) : null}
      </div>
    </div>
  );
}
