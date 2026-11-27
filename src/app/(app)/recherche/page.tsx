"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Loader2, School, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { OffreCard } from "@/components/shared/offre-card";
import { OffresGrilleSkeleton } from "@/components/shared/offre-card-skeleton";
import { FiltresRepliables } from "@/components/shared/filtres-repliables";
import { EmptyState } from "@/components/shared/empty-state";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { BasculeFormation } from "@/components/offres/bascule-formation";
import {
  CLASSE_CARTE_CENTRE,
  ContenuCarteCentre,
} from "@/components/offres/carte-centre";
import {
  centresApi,
  favoritesApi,
  offresApi,
  partenaireApi,
  typesOffresApi,
} from "@/lib/api";
import { NIVEAU_EXPERIENCE_LABELS, SECTEUR_LABELS } from "@/lib/enums";
import { styleType } from "@/lib/type-offre";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import type { NiveauExperience, OffresFilters, Secteur } from "@/lib/types";

const PAGE_SIZE = 18;
const TEINTE = "var(--c-emerald)";

/** Retarde la recherche par mot-clé le temps que la frappe se stabilise. */
function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function RechercheInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get("keyword") ?? "");
  const [typeOffre, setTypeOffre] = useState(searchParams.get("typeOffre") ?? "");
  const [secteur, setSecteur] = useState(searchParams.get("secteur") ?? "");
  const [niveau, setNiveau] = useState(searchParams.get("niveauExperience") ?? "");
  const [localisation, setLocalisation] = useState(
    searchParams.get("localisation") ?? "",
  );
  const [echeance, setEcheance] = useState(searchParams.get("echeance") ?? "");
  const [partenaireId, setPartenaireId] = useState(
    searchParams.get("partenaireId") ?? "",
  );
  const [typePartenaire, setTypePartenaire] = useState(
    searchParams.get("typePartenaire") ?? "",
  );
  // Dans la catégorie Formation : les offres, ou les centres de formation.
  const [vue, setVue] = useState(searchParams.get("vue") ?? "");
  const vueCentres = typeOffre === "FORMATION" && vue === "centres";

  const debouncedKeyword = useDebounced(keyword);
  const debouncedLocalisation = useDebounced(localisation);

  const filters = useMemo(
    () => ({
      keyword: debouncedKeyword || undefined,
      typeOffre: typeOffre || undefined,
      secteur: (secteur || undefined) as Secteur | undefined,
      niveauExperience: (niveau || undefined) as NiveauExperience | undefined,
      localisation: debouncedLocalisation || undefined,
      echeance: (echeance || undefined) as OffresFilters["echeance"],
      partenaireId: partenaireId ? Number(partenaireId) : undefined,
      typePartenaire: typePartenaire || undefined,
      limit: PAGE_SIZE,
    }),
    [
      debouncedKeyword,
      typeOffre,
      secteur,
      niveau,
      debouncedLocalisation,
      echeance,
      partenaireId,
      typePartenaire,
    ],
  );

  // Les filtres restent dans l'URL : l'état est partageable et survit à un
  // rechargement ou à un retour arrière.
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.keyword) params.set("keyword", filters.keyword);
    if (filters.typeOffre) params.set("typeOffre", filters.typeOffre);
    if (filters.secteur) params.set("secteur", filters.secteur);
    if (filters.niveauExperience)
      params.set("niveauExperience", filters.niveauExperience);
    if (filters.localisation) params.set("localisation", filters.localisation);
    if (filters.echeance) params.set("echeance", filters.echeance);
    if (filters.partenaireId) params.set("partenaireId", String(filters.partenaireId));
    if (filters.typePartenaire) params.set("typePartenaire", filters.typePartenaire);
    if (vueCentres) params.set("vue", "centres");
    const qs = params.toString();
    router.replace(qs ? `/recherche?${qs}` : "/recherche", { scroll: false });
  }, [filters, vueCentres, router]);

  // Changer un filtre reconstruit la liste depuis le début. Rester au milieu
  // de l'ancienne position donnerait des résultats déjà défilés, et le
  // déclencheur de chargement se rallumerait aussitôt.
  const premierRendu = useRef(true);
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [filters]);

  // Défilement infini plutôt que pagination : sur téléphone, une pagination
  // impose de viser un bouton en bas d'écran puis de remonter en haut de la
  // page suivante. La liste se prolonge maintenant sous le pouce.
  const {
    data,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["offres", "search", filters],
    queryFn: ({ pageParam }) => offresApi.list({ ...filters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (derniere, toutes) =>
      toutes.length < (derniere.totalPages ?? 1) ? toutes.length + 1 : undefined,
  });

  const { data: favorites } = useQuery({
    queryKey: ["favorites"],
    queryFn: favoritesApi.list,
  });

  const { data: types = [] } = useQuery({
    queryKey: ["types-offres"],
    queryFn: () => typesOffresApi.list(),
    staleTime: 5 * 60 * 1000,
  });

  // Structures et types de l'annuaire, pour chercher par partenaire.
  const { data: partenaires = [] } = useQuery({
    queryKey: ["partenaires", "annuaire"],
    queryFn: () => partenaireApi.annuaire(),
    staleTime: 10 * 60 * 1000,
  });
  const { data: typesPartenaires = [] } = useQuery({
    queryKey: ["partenaires", "types"],
    queryFn: partenaireApi.types,
    staleTime: 10 * 60 * 1000,
  });

  const favoriteIds = useMemo(
    () => new Set((favorites ?? []).map((f) => f.offre.id)),
    [favorites],
  );

  const activeFilters = [
    typeOffre && {
      label: types.find((t) => t.code === typeOffre)?.libelle ?? typeOffre,
      clear: () => setTypeOffre(""),
    },
    secteur && { label: SECTEUR_LABELS[secteur as Secteur], clear: () => setSecteur("") },
    niveau && {
      label: NIVEAU_EXPERIENCE_LABELS[niveau as NiveauExperience],
      clear: () => setNiveau(""),
    },
    localisation && { label: localisation, clear: () => setLocalisation("") },
    partenaireId && {
      label: partenaires.find((p) => String(p.id) === partenaireId)?.nom ?? "Partenaire",
      clear: () => setPartenaireId(""),
    },
    typePartenaire && {
      label:
        typesPartenaires.find((t) => t.slug === typePartenaire)?.nom ?? typePartenaire,
      clear: () => setTypePartenaire(""),
    },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  function resetAll() {
    setKeyword("");
    setTypeOffre("");
    setSecteur("");
    setNiveau("");
    setLocalisation("");
    setPartenaireId("");
    setTypePartenaire("");
  }

  const total = data?.pages[0]?.total ?? 0;
  const offres = useMemo(
    () => data?.pages.flatMap((lot) => lot.data) ?? [],
    [data],
  );

  // La sentinelle déclenche le lot suivant avant d'être atteinte : la marge
  // laisse le temps du réseau, et la liste paraît continue.
  const sentinelle = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const cible = sentinelle.current;
    if (!cible || !hasNextPage) return;

    const observateur = new IntersectionObserver(
      (entrees) => {
        if (entrees[0]?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "600px" },
    );

    observateur.observe(cible);
    return () => observateur.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      <PageHeader
        title="Rechercher"
        surtitre="Catalogue"
        icon={Search}
        couleur={TEINTE}
        description={
          vueCentres
            ? "Les centres où suivre une formation, près de chez vous"
            : isLoading
            ? "Chargement…"
            : `${formatNumber(total)} opportunité${total > 1 ? "s" : ""} correspond${total > 1 ? "ent" : ""} à vos critères`
        }
        mesures={
          vueCentres || isLoading
            ? undefined
            : [
                { label: "Résultats", valeur: total, teinte: TEINTE },
                { label: "Affichés", valeur: offres.length },
                { label: "Dans mes favoris", valeur: favoriteIds.size, teinte: "var(--c-rose)" },
                {
                  label: "Filtres actifs",
                  valeur: activeFilters.length + (echeance ? 1 : 0) + (debouncedKeyword ? 1 : 0),
                  teinte: "var(--c-violet)",
                },
              ]
        }
      />

      {/* Filtres rapides par type : une rangée de pastilles colorées avant les
          listes déroulantes. C'est le filtre le plus utilisé, et il mérite
          d'être atteignable en un geste plutôt que caché dans un menu. Sur
          téléphone, la rangée défile horizontalement au lieu de s'empiler. */}
      {types.length ? (
        <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <button
            type="button"
            onClick={() => {
              setTypeOffre("");
            }}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
              typeOffre === ""
                ? "border-foreground/15 bg-foreground text-background"
                : "bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground",
            )}
          >
            Tous
          </button>

          {types.map((type) => {
            const style = styleType(type);
            const Icone = style.icone;
            const actif = typeOffre === type.code;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setTypeOffre(actif ? "" : type.code);
                }}
                aria-pressed={actif}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                  actif
                    ? "text-white shadow-sm"
                    : "bg-card text-muted-foreground hover:-translate-y-0.5 hover:text-foreground",
                )}
                style={
                  actif
                    ? { background: style.teinte, borderColor: style.teinte }
                    : undefined
                }
              >
                <Icone
                  className="size-4"
                  style={actif ? undefined : { color: style.teinte }}
                  aria-hidden
                />
                {type.libelle}
              </button>
            );
          })}
        </div>
      ) : null}

      {typeOffre === "FORMATION" ? (
        <BasculeFormation
          actif={vueCentres ? "centres" : "offres"}
          className="mb-4"
          libelles={{
            offres: "Offres de formation",
            centres: "Centres de formation",
            groupe: "Formation : offres ou centres",
          }}
          rendre={(onglet, props) => (
            <button
              type="button"
              onClick={() => setVue(onglet === "centres" ? "centres" : "")}
              {...props}
            />
          )}
        />
      ) : null}

      {vueCentres ? (
        <PanneauCentres />
      ) : (
        <>
          <div className="entree mb-6 rounded-2xl border bg-card p-3 shadow-sm">
            <FiltresRepliables
              libelle="Filtres"
              hauteur="h-11"
              actifs={
                [localisation, secteur, echeance, niveau, partenaireId, typePartenaire].filter(
                  Boolean,
                ).length
              }
              recherche={
                <>
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    value={keyword}
                    onChange={(e) => {
                      setKeyword(e.target.value);
                    }}
                    placeholder="Métier, entreprise, mot-clé…"
                    className="h-11 rounded-xl pl-11 text-base"
                    aria-label="Rechercher"
                  />
                  {isFetching && !isLoading ? (
                    <Loader2 className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary" />
                  ) : null}
                </>
              }
            >
              <Input
                value={localisation}
                onChange={(e) => {
                  setLocalisation(e.target.value);
                }}
                placeholder="Localisation"
                className="h-11 rounded-xl lg:w-44"
                aria-label="Localisation"
              />

              <select
                value={secteur}
                onChange={(e) => {
                  setSecteur(e.target.value);
                }}
                aria-label="Secteur"
                className="h-11 rounded-xl border bg-transparent px-3 text-sm shadow-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 lg:w-44"
              >
                <option value="">Tous les secteurs</option>
                {(Object.keys(SECTEUR_LABELS) as Secteur[]).map((s) => (
                  <option key={s} value={s}>
                    {SECTEUR_LABELS[s]}
                  </option>
                ))}
              </select>

              <select
                value={echeance}
                onChange={(e) => {
                  setEcheance(e.target.value);
                }}
                aria-label="État de l'échéance"
                className="h-11 rounded-xl border bg-transparent px-3 text-sm shadow-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 lg:w-44"
              >
                <option value="">Toutes les échéances</option>
                <option value="ouverte">Encore ouvertes</option>
                <option value="depassee">Échéance dépassée</option>
              </select>

              <select
                value={niveau}
                onChange={(e) => {
                  setNiveau(e.target.value);
                }}
                aria-label="Niveau d'expérience"
                className="h-11 rounded-xl border bg-transparent px-3 text-sm shadow-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 lg:w-40"
              >
                <option value="">Tous niveaux</option>
                {(Object.keys(NIVEAU_EXPERIENCE_LABELS) as NiveauExperience[]).map(
                  (n) => (
                    <option key={n} value={n}>
                      {NIVEAU_EXPERIENCE_LABELS[n]}
                    </option>
                  ),
                )}
              </select>

              {typesPartenaires.length ? (
                <select
                  value={typePartenaire}
                  onChange={(e) => {
                    setTypePartenaire(e.target.value);
                    setPartenaireId("");
                  }}
                  aria-label="Type de partenaire"
                  className="h-11 rounded-xl border bg-transparent px-3 text-sm shadow-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 lg:w-44"
                >
                  <option value="">Tous les types de partenaires</option>
                  {typesPartenaires.map((t) => (
                    <option key={t.id} value={t.slug}>
                      {t.nom}
                    </option>
                  ))}
                </select>
              ) : null}

              {partenaires.length ? (
                <select
                  value={partenaireId}
                  onChange={(e) => {
                    setPartenaireId(e.target.value);
                  }}
                  aria-label="Partenaire"
                  className="h-11 rounded-xl border bg-transparent px-3 text-sm shadow-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 lg:w-44"
                >
                  <option value="">Tous les partenaires</option>
                  {partenaires
                    .filter(
                      (p) => !typePartenaire || p.typePartenaire?.slug === typePartenaire,
                    )
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom}
                      </option>
                    ))}
                </select>
              ) : null}
            </FiltresRepliables>

            {activeFilters.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Filtres
                </span>
                {activeFilters.map((f) => (
                  <Badge
                    key={f.label}
                    variant="secondary"
                    className="h-7 gap-1 rounded-full bg-[color-mix(in_oklch,var(--c-emerald)_12%,transparent)] pl-3 pr-1 text-sm text-foreground"
                  >
                    {f.label}
                    <button
                      onClick={f.clear}
                      aria-label={`Retirer ${f.label}`}
                      className="grid size-5 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
                <button
                  onClick={resetAll}
                  className="ml-1 text-sm font-medium text-primary hover:underline"
                >
                  Tout effacer
                </button>
              </div>
            ) : null}
          </div>

          {isLoading ? (
            <OffresGrilleSkeleton nombre={9} />
          ) : offres.length === 0 ? (
            <EmptyState
              icon={Search}
              couleur={TEINTE}
              title="Aucun résultat"
              description="Aucune offre ne correspond à ces critères. Élargissez la recherche, ou retirez un filtre pour voir davantage de résultats."
              action={
                <Button className="rounded-xl" onClick={resetAll}>
                  Réinitialiser la recherche
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {offres.map((offre, index) => (
                  <OffreCard
                    key={offre.id}
                    offre={offre}
                    href={`/offres/${offre.id}`}
                    className="entree"
                    style={{ "--i": index % 6 } as React.CSSProperties}
                    action={
                      <FavoriteButton
                        offreId={offre.id}
                        isFavorite={favoriteIds.has(offre.id)}
                      />
                    }
                  />
                ))}
              </div>

              {/* Sentinelle : invisible, elle sert de déclencheur au chargement. */}
              <div ref={sentinelle} aria-hidden className="h-px" />

              {hasNextPage ? (
                <div className="mt-8 flex justify-center">
                  {/* Le bouton double la sentinelle : au clavier, ou si
                      l'observateur ne se déclenche pas, la suite reste
                      atteignable. */}
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    disabled={isFetchingNextPage}
                    onClick={() => void fetchNextPage()}
                  >
                    {isFetchingNextPage ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    {isFetchingNextPage ? "Chargement…" : "Voir la suite"}
                  </Button>
                </div>
              ) : offres.length >= PAGE_SIZE ? (
                <p className="mt-8 text-center text-sm text-muted-foreground">
                  Vous avez vu les {formatNumber(total)} résultats.
                </p>
              ) : null}
            </>
          )}
        </>
      )}
    </>
  );
}

/**
 * Centres de formation, dans la catégorie Formation de la recherche. Liste
 * courte : un filtre par région et une recherche sur le nom ou le domaine
 * suffisent.
 */
function PanneauCentres() {
  const [recherche, setRecherche] = useState("");
  const [region, setRegion] = useState("");
  const rechercheDifferee = useDebounced(recherche);

  const { data: tous = [] } = useQuery({
    queryKey: ["centres-formation", "tous"],
    queryFn: () => centresApi.lister(),
    staleTime: 5 * 60 * 1000,
  });
  const { data: centres = [], isLoading } = useQuery({
    queryKey: ["centres-formation", { recherche: rechercheDifferee, region }],
    queryFn: () => centresApi.lister({ search: rechercheDifferee, region }),
    placeholderData: (precedent) => precedent,
  });

  const regions = useMemo(
    () =>
      [...new Set(tous.map((c) => c.region).filter(Boolean) as string[])].sort(
        (a, b) => a.localeCompare(b, "fr"),
      ),
    [tous],
  );

  return (
    <>
      <div className="entree mb-6 flex flex-col gap-2 rounded-2xl border bg-card p-3 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Nom du centre, domaine, ville…"
            aria-label="Rechercher un centre de formation"
            className="h-11 rounded-xl pl-9"
          />
        </div>
        {regions.length > 1 ? (
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            aria-label="Région"
            className="h-11 rounded-xl border bg-background px-3 text-sm"
          >
            <option value="">Toutes les régions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {isLoading ? (
        <OffresGrilleSkeleton nombre={6} />
      ) : centres.length === 0 ? (
        <EmptyState
          icon={School}
          couleur={TEINTE}
          title="Aucun centre de formation"
          description={
            recherche || region
              ? "Aucun centre ne correspond à ces critères."
              : "Aucun centre de formation n'est encore référencé."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {centres.map((centre) => (
            <Link
              key={centre.id}
              href={`/centres-formation/${centre.id}`}
              className={CLASSE_CARTE_CENTRE}
            >
              <ContenuCarteCentre
                centre={centre}
                formations={formationsEnLigne(centre._count?.formations ?? 0)}
              />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function formationsEnLigne(n: number) {
  if (n === 0) return "Aucune formation en ligne";
  return `${formatNumber(n)} formation${n > 1 ? "s" : ""} en ligne`;
}

export default function RecherchePage() {
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center py-20">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <RechercheInner />
    </Suspense>
  );
}
