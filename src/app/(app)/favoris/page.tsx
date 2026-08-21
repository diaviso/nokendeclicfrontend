"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Heart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { OffreCard } from "@/components/shared/offre-card";
import { OffresGrilleSkeleton } from "@/components/shared/offre-card-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { favoritesApi } from "@/lib/api";
import { daysUntil } from "@/lib/format";
import type { Offre } from "@/lib/types";

const TEINTE = "var(--chart-4)";

/**
 * Répartit les favoris entre ceux dont l'échéance approche et les autres.
 *
 * Un favori dont la date limite tombe dans la semaine n'a pas la même valeur
 * qu'un autre enregistré il y a un mois : le mettre en tête est la seule façon
 * d'éviter qu'il passe inaperçu au milieu d'une grille homogène.
 */
function repartir(favoris: { offre: Offre }[]) {
  const urgents: Offre[] = [];
  const autres: Offre[] = [];

  for (const { offre } of favoris) {
    const restant = daysUntil(offre.dateLimite);
    if (restant !== null && restant >= 0 && restant <= 7 && !offre.estCloturee) {
      urgents.push(offre);
    } else {
      autres.push(offre);
    }
  }

  return { urgents, autres };
}

export default function FavorisPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: favoritesApi.list,
  });

  const favoris = data ?? [];
  const { urgents, autres } = repartir(favoris);

  return (
    <>
      <PageHeader
        title="Mes favoris"
        surtitre="Ma sélection"
        icon={Heart}
        couleur={TEINTE}
        description={
          isLoading
            ? "Chargement…"
            : favoris.length === 0
              ? "Vous n'avez encore rien enregistré."
              : `${favoris.length} opportunité${favoris.length > 1 ? "s" : ""} mise${favoris.length > 1 ? "s" : ""} de côté`
        }
        actions={
          <Button variant="outline" className="rounded-xl" render={<Link href="/recherche" />}>
            <Search className="size-4" />
            Rechercher
          </Button>
        }
      />

      {isLoading ? (
        <OffresGrilleSkeleton nombre={6} />
      ) : favoris.length === 0 ? (
        <EmptyState
          icon={Heart}
          couleur={TEINTE}
          title="Votre sélection est vide"
          description="Touchez le cœur sur une offre pour la retrouver ici. C'est aussi ce qui déclenche les rappels avant la date limite."
          action={
            <Button className="rounded-xl" render={<Link href="/recherche" />}>
              Parcourir les offres
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {urgents.length ? (
            <section>
              <div className="mb-4 flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                  <CalendarClock className="size-4" aria-hidden />
                </span>
                <h2 className="text-lg font-bold">Ça se termine bientôt</h2>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                  {urgents.length}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {urgents.map((offre, index) => (
                  <OffreCard
                    key={offre.id}
                    offre={offre}
                    href={`/offres/${offre.id}`}
                    className="entree"
                    style={{ "--i": index % 6 } as React.CSSProperties}
                    action={<FavoriteButton offreId={offre.id} isFavorite />}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {autres.length ? (
            <section>
              {urgents.length ? (
                <h2 className="mb-4 text-lg font-bold">Le reste de ma sélection</h2>
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {autres.map((offre, index) => (
                  <OffreCard
                    key={offre.id}
                    offre={offre}
                    href={`/offres/${offre.id}`}
                    className="entree"
                    style={{ "--i": index % 6 } as React.CSSProperties}
                    action={<FavoriteButton offreId={offre.id} isFavorite />}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
