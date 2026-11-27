"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Heart, Search, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { OffreCard } from "@/components/shared/offre-card";
import { OffresGrilleSkeleton } from "@/components/shared/offre-card-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { favoritesApi } from "@/lib/api";
import { daysUntil } from "@/lib/format";
import type { Offre } from "@/lib/types";

const TEINTE = "var(--c-rose)";
const TEINTE_URGENT = "var(--c-amber)";

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
  const cloturees = favoris.filter(({ offre }) => offre.estCloturee).length;

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
          <Button variant="outline" className="rounded-xl bg-card/70" render={<Link href="/recherche" />}>
            <Search className="size-4" />
            Rechercher
          </Button>
        }
        mesures={
          favoris.length
            ? [
                { label: "Offres gardées", valeur: favoris.length, teinte: TEINTE },
                { label: "Échéance sous 7 jours", valeur: urgents.length, teinte: TEINTE_URGENT },
                { label: "Encore ouvertes", valeur: favoris.length - cloturees, teinte: "var(--c-emerald)" },
                { label: "Clôturées", valeur: cloturees },
              ]
            : undefined
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
              <TitreSection
                icone={CalendarClock}
                teinte={TEINTE_URGENT}
                titre="Ça se termine bientôt"
                compte={urgents.length}
                detail="Date limite dans les sept prochains jours"
              />

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
                <TitreSection
                  icone={Heart}
                  teinte={TEINTE}
                  titre="Le reste de ma sélection"
                  compte={autres.length}
                />
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

/** Titre de groupe : pastille teintée, intitulé, compteur. */
function TitreSection({
  icone: Icone,
  teinte,
  titre,
  compte,
  detail,
}: {
  icone: LucideIcon;
  teinte: string;
  titre: string;
  compte: number;
  detail?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-xl"
        style={{
          background: `color-mix(in oklch, ${teinte} 15%, transparent)`,
          color: teinte,
        }}
      >
        <Icone className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-base font-bold">
          {titre}
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
            style={{
              background: `color-mix(in oklch, ${teinte} 13%, transparent)`,
              color: teinte,
            }}
          >
            {compte}
          </span>
        </h2>
        {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
      </div>
      <span aria-hidden className="ml-2 h-px flex-1 bg-border" />
    </div>
  );
}
