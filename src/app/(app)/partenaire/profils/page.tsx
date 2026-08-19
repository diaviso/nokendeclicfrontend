"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Briefcase,
  GraduationCap,
  Languages,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  UserSearch,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import {
  BoutonFavori,
  useIdentifiantsFavoris,
} from "@/components/partenaire/bouton-favori";
import { fileUrl, profilsApi } from "@/lib/api";
import { statutProfessionnelLabel } from "@/lib/enums";
import { formatRelative, fullName } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProfilClasse } from "@/lib/types";

function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * Barre de correspondance.
 *
 * Le score brut n'a pas de plafond — il dépend du nombre de critères. La barre
 * est donc relative au meilleur résultat de la page : elle dit « ce profil
 * correspond mieux que celui-là », ce qui est la seule question du recruteur.
 * Afficher un pourcentage absolu laisserait croire à une mesure objective.
 */
function Correspondance({
  score,
  maximum,
  actif,
}: {
  score: number;
  maximum: number;
  /** Muet tant qu'aucun critère n'est posé : il n'y a rien à faire correspondre. */
  actif: boolean;
}) {
  if (!actif) return null;

  const part = maximum > 0 ? Math.round((score / maximum) * 100) : 0;

  return (
    <div className="flex items-center gap-2">
      <span
        className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`Correspondance : ${part} % du meilleur résultat`}
      >
        <span
          className="block h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${Math.max(6, part)}%`,
            background:
              part >= 70
                ? "var(--success)"
                : part >= 40
                  ? "var(--chart-1)"
                  : "var(--muted-foreground)",
          }}
        />
      </span>
      <span className="text-xs font-semibold tabular-nums text-muted-foreground">
        {part} %
      </span>
    </div>
  );
}

function CarteProfil({
  profil,
  maximum,
  index,
  aDesCriteres,
  estFavori,
}: {
  profil: ProfilClasse;
  maximum: number;
  index: number;
  aDesCriteres: boolean;
  estFavori: boolean;
}) {
  const { cv } = profil;
  const nom = fullName(cv.user);

  return (
    <li
      style={{ "--i": index } as React.CSSProperties}
      className="entree relative"
    >
      {/* Hors du lien : un bouton imbriqué dans une ancre n'est ni valide ni
          cliquable de façon fiable. */}
      <BoutonFavori
        candidatId={cv.userId}
        nom={nom}
        estFavori={estFavori}
        className="absolute right-4 top-4 z-10"
      />

      <Link
        href={`/partenaire/profils/${cv.userId}`}
        className="group block rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
      >
        <div className="flex items-start gap-3.5">
          <Avatar className="size-12 shrink-0">
            <AvatarImage src={fileUrl(cv.user.pictureUrl)} alt="" />
            <AvatarFallback className="text-sm font-semibold">
              {(cv.user.firstName?.[0] ?? cv.user.username[0] ?? "?").toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2 pr-11">
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold group-hover:underline">
                  {nom}
                </h2>
                {cv.titreProfessionnel ? (
                  <p className="truncate text-sm font-medium text-muted-foreground">
                    {cv.titreProfessionnel}
                  </p>
                ) : null}
              </div>
              <Correspondance
                score={profil.score}
                maximum={maximum}
                actif={aDesCriteres}
              />
            </div>

            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {cv.ville || cv.user.region ? (
                <li className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" aria-hidden />
                  {[cv.ville, cv.user.region].filter(Boolean).join(", ")}
                </li>
              ) : null}
              {cv.user.statutProfessionnel ? (
                <li className="flex items-center gap-1.5">
                  <Briefcase className="size-3.5" aria-hidden />
                  {statutProfessionnelLabel(cv.user.statutProfessionnel)}
                </li>
              ) : null}
              {cv.langues.length > 0 ? (
                <li className="flex items-center gap-1.5">
                  <Languages className="size-3.5" aria-hidden />
                  {cv.langues.slice(0, 2).join(", ")}
                </li>
              ) : null}
              <li className="flex items-center gap-1.5">
                <GraduationCap className="size-3.5" aria-hidden />
                {cv.experiences?.length ?? 0} expérience
                {(cv.experiences?.length ?? 0) > 1 ? "s" : ""}
              </li>
            </ul>

            {cv.resume ? (
              <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {cv.resume}
              </p>
            ) : null}

            {cv.competences.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {cv.competences.slice(0, 8).map((competence, rang) => {
                  const retenue = profil.competencesCorrespondantes.includes(
                    competence,
                  );
                  return (
                    <li
                      key={`${competence}-${rang}`}
                      className={cn(
                        "rounded-md px-2 py-0.5 text-xs",
                        retenue
                          ? "bg-primary/12 font-semibold text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {competence}
                    </li>
                  );
                })}
                {cv.competences.length > 8 ? (
                  <li className="px-1 py-0.5 text-xs text-muted-foreground">
                    +{cv.competences.length - 8}
                  </li>
                ) : null}
              </ul>
            ) : null}

            {profil.raisons.length > 0 ? (
              <p className="mt-3 flex items-center gap-1.5 border-t pt-2.5 text-xs text-muted-foreground">
                <Sparkles className="size-3.5 shrink-0" aria-hidden />
                {profil.raisons.join(" · ")}
                <span className="ml-auto shrink-0">
                  CV {formatRelative(cv.dateModification)}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    </li>
  );
}

export default function RechercheProfilsPage() {
  const [requete, setRequete] = useState("");
  const [competences, setCompetences] = useState<string[]>([]);
  const [lieu, setLieu] = useState("");
  const [page, setPage] = useState(1);

  const requeteDifferee = useDebounced(requete);
  const lieuDiffere = useDebounced(lieu);

  const { data: identifiantsFavoris = [] } = useIdentifiantsFavoris();

  const { data: vivier = [] } = useQuery({
    queryKey: ["profils", "competences"],
    queryFn: profilsApi.competences,
    staleTime: 10 * 60 * 1000,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "profils",
      { q: requeteDifferee, competences, lieu: lieuDiffere, page },
    ],
    queryFn: () =>
      profilsApi.rechercher({
        q: requeteDifferee || undefined,
        competences: competences.length ? competences : undefined,
        localisation: lieuDiffere || undefined,
        page,
        limit: 20,
      }),
    placeholderData: (precedent) => precedent,
  });

  const profils = data?.data ?? [];
  // Le maximum est celui de la page affichée : les barres se comparent entre
  // elles, ce qui est exactement l'usage qu'on en fait.
  const maximum = profils.reduce((max, profil) => Math.max(max, profil.score), 0);

  const basculerCompetence = (libelle: string) => {
    setPage(1);
    setCompetences((precedent) =>
      precedent.includes(libelle)
        ? precedent.filter((c) => c !== libelle)
        : [...precedent, libelle],
    );
  };

  const aDesCriteres =
    Boolean(requeteDifferee) || competences.length > 0 || Boolean(lieuDiffere);

  return (
    <>
      <PageHeader
        title="Rechercher un profil"
        surtitre="Recrutement"
        icon={UserSearch}
        couleur="var(--chart-2)"
        description="Parmi les membres qui ont rendu leur CV visible aux recruteurs. Les profils les plus proches de vos critères apparaissent en premier."
      />

      <div className="mb-4 space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={requete}
              onChange={(event) => {
                setRequete(event.target.value);
                setPage(1);
              }}
              placeholder="Métier, compétence, école…"
              aria-label="Rechercher un profil"
              className="h-10 rounded-xl border-transparent bg-muted/60 pl-9 shadow-none focus-visible:border-input focus-visible:bg-background"
            />
            {isFetching && !isLoading ? (
              <Loader2
                className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
                aria-hidden
              />
            ) : null}
          </div>

          <div className="relative sm:w-56">
            <MapPin
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={lieu}
              onChange={(event) => {
                setLieu(event.target.value);
                setPage(1);
              }}
              placeholder="Ville ou région"
              aria-label="Filtrer par localisation"
              className="h-10 rounded-xl border-transparent bg-muted/60 pl-9 shadow-none focus-visible:border-input focus-visible:bg-background"
            />
          </div>
        </div>

        {vivier.length > 0 ? (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Award className="size-3.5" aria-hidden />
              Compétences présentes dans le vivier
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {vivier.slice(0, 18).map((competence) => {
                const active = competences.includes(competence.libelle);
                return (
                  <li key={competence.libelle}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => basculerCompetence(competence.libelle)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-all duration-200",
                        "outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                        active
                          ? "border-primary/40 bg-primary/10 font-semibold text-primary"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {competence.libelle}
                      <span className="tabular-nums opacity-60">
                        {competence.total}
                      </span>
                      {active ? <X className="size-3" aria-hidden /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {aDesCriteres ? (
          <div className="flex items-center justify-between gap-3 border-t pt-2.5">
            <p className="text-sm text-muted-foreground">
              {data
                ? `${data.total} profil${data.total > 1 ? "s" : ""} correspondant${data.total > 1 ? "s" : ""}`
                : "Recherche en cours…"}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg"
              onClick={() => {
                setRequete("");
                setCompetences([]);
                setLieu("");
                setPage(1);
              }}
            >
              Effacer les critères
            </Button>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl border bg-card p-5">
              <div className="flex gap-3.5">
                <Skeleton className="size-12 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : profils.length === 0 ? (
        <EmptyState
          icon={UserSearch}
          couleur="var(--chart-2)"
          title={
            aDesCriteres ? "Aucun profil ne correspond" : "Aucun profil visible"
          }
          description={
            aDesCriteres
              ? "Élargissez les critères : retirez une compétence, ou cherchez sur le métier plutôt que sur l'outil."
              : "Les membres qui rendent leur CV visible aux recruteurs apparaîtront ici."
          }
        />
      ) : (
        <>
          <ul className="space-y-3">
            {profils.map((profil, index) => (
              <CarteProfil
                key={profil.cv.userId}
                profil={profil}
                maximum={maximum}
                index={index}
                aDesCriteres={aDesCriteres}
                estFavori={identifiantsFavoris.includes(profil.cv.userId)}
              />
            ))}
          </ul>

          {data && data.totalPages > 1 ? (
            <nav
              aria-label="Pagination"
              className="mt-4 flex items-center justify-center gap-2"
            >
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </Button>
              <span className="px-2 text-sm tabular-nums text-muted-foreground">
                Page <span className="font-semibold text-foreground">{page}</span>{" "}
                sur {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </Button>
            </nav>
          ) : null}
        </>
      )}
    </>
  );
}
