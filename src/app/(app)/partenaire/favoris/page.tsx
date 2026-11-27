"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BookmarkCheck,
  Briefcase,
  EyeOff,
  Languages,
  MapPin,
  Quote,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { BoutonFavori, BoutonNote } from "@/components/partenaire/bouton-favori";
import { fileUrl, partenaireApi, type FavoriCandidat } from "@/lib/api";
import { statutProfessionnelLabel } from "@/lib/enums";
import { formatRelative, fullName } from "@/lib/format";

function Carte({ favori, index }: { favori: FavoriCandidat; index: number }) {
  const { candidat, cv } = favori;
  const nom = fullName(candidat);
  const initiale = (
    candidat.firstName?.[0] ??
    candidat.username[0] ??
    "?"
  ).toUpperCase();

  return (
    <li
      style={{ "--i": index } as React.CSSProperties}
      className="entree group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 transition-all duration-200 group-hover:w-1.5"
        style={{ background: favori.profilToujoursVisible ? "var(--c-orange)" : "var(--muted-foreground)" }}
      />
      <div className="flex items-start gap-3.5">
        <Avatar className="size-12 shrink-0 ring-2 ring-[color-mix(in_oklch,var(--c-orange)_25%,transparent)] transition-transform duration-300 group-hover:scale-105">
          <AvatarImage src={fileUrl(candidat.pictureUrl)} alt="" />
          <AvatarFallback className="text-sm font-semibold">
            {initiale}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold">{nom}</h2>
              {cv?.titreProfessionnel ? (
                <p className="truncate text-sm font-medium text-muted-foreground">
                  {cv.titreProfessionnel}
                </p>
              ) : null}
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              Retenu {formatRelative(favori.createdAt)}
            </span>
          </div>

          {favori.profilToujoursVisible && cv ? (
            <>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {cv.ville || candidat.region ? (
                  <li className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" aria-hidden />
                    {[cv.ville, candidat.region].filter(Boolean).join(", ")}
                  </li>
                ) : null}
                {candidat.statutProfessionnel ? (
                  <li className="flex items-center gap-1.5">
                    <Briefcase className="size-3.5" aria-hidden />
                    {statutProfessionnelLabel(candidat.statutProfessionnel)}
                  </li>
                ) : null}
                {cv.langues.length > 0 ? (
                  <li className="flex items-center gap-1.5">
                    <Languages className="size-3.5" aria-hidden />
                    {cv.langues.slice(0, 2).join(", ")}
                  </li>
                ) : null}
              </ul>

              {cv.competences.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {cv.competences.slice(0, 6).map((competence, rang) => (
                    <li
                      key={`${competence}-${rang}`}
                      className="rounded-md bg-[color-mix(in_oklch,var(--c-orange)_10%,transparent)] px-2 py-0.5 text-xs text-foreground/80"
                    >
                      {competence}
                    </li>
                  ))}
                  {cv.competences.length > 6 ? (
                    <li className="px-1 py-0.5 text-xs text-muted-foreground">
                      +{cv.competences.length - 6}
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </>
          ) : (
            /* Le profil a été retiré de la recherche depuis sa mise de côté.
               On le dit, plutôt que de laisser une carte vide : le partenaire
               comprend que rien n'a été perdu de son côté. */
            <p className="mt-2 flex items-start gap-2 rounded-xl border border-dashed px-3 py-2 text-sm text-muted-foreground">
              <EyeOff className="mt-0.5 size-4 shrink-0" aria-hidden />
              Ce membre a retiré son profil de la recherche. Votre note reste
              enregistrée, et la fiche redeviendra consultable s&apos;il le
              republie.
            </p>
          )}

          {favori.note ? (
            <p className="mt-3 flex items-start gap-2 rounded-xl border-l-2 border-[var(--c-amber)] bg-[color-mix(in_oklch,var(--c-amber)_8%,transparent)] px-3 py-2 text-sm">
              <Quote className="mt-0.5 size-3.5 shrink-0 text-[var(--c-amber)]" aria-hidden />
              <span className="min-w-0 whitespace-pre-wrap">{favori.note}</span>
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3">
            {favori.profilToujoursVisible ? (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg"
                render={<Link href={`/partenaire/profils/${favori.candidatId}`} />}
              >
                Voir le profil
              </Button>
            ) : null}

            <BoutonNote
              candidatId={favori.candidatId}
              nom={nom}
              note={favori.note}
            />

            <BoutonFavori
              candidatId={favori.candidatId}
              nom={nom}
              estFavori
              variante="carte"
              className="ml-auto"
            />
          </div>
        </div>
      </div>
    </li>
  );
}

export default function FavorisPartenairePage() {
  const { data: favoris = [], isLoading } = useQuery({
    queryKey: ["partenaire", "favoris"],
    queryFn: partenaireApi.favoris,
  });

  return (
    <>
      <PageHeader
        title="Candidats retenus"
        surtitre="Recrutement"
        icon={BookmarkCheck}
        couleur="var(--c-orange)"
        description="Les profils que vous avez mis de côté pendant vos recherches, avec vos annotations privées."
        mesures={
          favoris.length > 0
            ? [
                { label: "Profils retenus", valeur: favoris.length, teinte: "var(--c-orange)" },
                {
                  label: "Annotés",
                  valeur: favoris.filter((favori) => Boolean(favori.note)).length,
                  teinte: "var(--c-amber)",
                },
                {
                  label: "Toujours consultables",
                  valeur: favoris.filter((favori) => favori.profilToujoursVisible).length,
                  teinte: "var(--c-emerald)",
                },
              ]
            : undefined
        }
      />

      {isLoading ? (
        <ul className="space-y-3">
          {[0, 1, 2].map((rang) => (
            <li key={rang} className="rounded-2xl border bg-card p-5">
              <div className="flex gap-3.5">
                <Skeleton className="size-12 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : favoris.length === 0 ? (
        <EmptyState
          icon={BookmarkCheck}
          couleur="var(--c-orange)"
          title="Aucun candidat retenu"
          description="Pendant une recherche, le signet au coin d'un profil le met de côté. Vous le retrouverez ici, avec la note que vous lui aurez attachée."
          action={
            <Button className="rounded-xl" render={<Link href="/partenaire/profils" />}>
              Rechercher un profil
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {favoris.map((favori, index) => (
            <Carte key={favori.id} favori={favori} index={index} />
          ))}
        </ul>
      )}
    </>
  );
}
