import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { alternatesPour } from "@/i18n/metadonnees";
import { Link } from "@/i18n/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { OffreCard } from "@/components/shared/offre-card";
import { EmptyState } from "@/components/shared/empty-state";
import { FiltresRepliables } from "@/components/shared/filtres-repliables";
import { styleType } from "@/lib/type-offre";
import { cn } from "@/lib/utils";
import { offresServerApi } from "@/lib/api/offres";
import { typesOffresServerApi } from "@/lib/api/types-offres";
import { NIVEAU_EXPERIENCE_LABELS, SECTEUR_LABELS } from "@/lib/enums";
import type {
  NiveauExperience,
  Offre,
  OffresFilters,
  PaginatedResponse,
  Secteur,
  TypeOffreDef,
} from "@/lib/types";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("offresTitre"),
    description: t("offresDescription"),
    alternates: alternatesPour("/offres", locale),
  };
}

type Search = {
  keyword?: string;
  typeOffre?: string;
  secteur?: string;
  niveauExperience?: string;
  localisation?: string;
  echeance?: string;
  page?: string;
};

/** Le champ n'est retenu que s'il correspond à une valeur connue de l'énumération. */
function pick<T extends string>(
  value: string | undefined,
  table: Record<T, unknown>,
): T | undefined {
  if (!value) return undefined;
  return value in table ? (value as T) : undefined;
}

export default async function OffresPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  // La page reste rendue à la demande — elle dépend des filtres de l'adresse —
  // mais la langue, elle, vient de l'adresse et non des en-têtes.
  setRequestLocale((await props.params).locale);
  const sp = await props.searchParams;
  const t = await getTranslations("offres");

  // Les types sont administrables : la liste des valeurs acceptées vient de
  // l'API, et non d'une énumération figée dans le code.
  let types: TypeOffreDef[] = [];
  try {
    types = await typesOffresServerApi.list();
  } catch {
    types = [];
  }
  const typeDemande = types.find((type) => type.code === sp.typeOffre);

  const page = Math.max(1, Number(sp.page) || 1);
  const filters: OffresFilters = {
    keyword: sp.keyword?.trim() || undefined,
    typeOffre: typeDemande?.code,
    secteur: pick<Secteur>(sp.secteur, SECTEUR_LABELS),
    niveauExperience: pick<NiveauExperience>(
      sp.niveauExperience,
      NIVEAU_EXPERIENCE_LABELS,
    ),
    localisation: sp.localisation?.trim() || undefined,
    echeance:
      sp.echeance === "ouverte" || sp.echeance === "depassee"
        ? sp.echeance
        : undefined,
    page,
    limit: 18,
  };

  let result: PaginatedResponse<Offre> | null = null;
  try {
    result = await offresServerApi.list(filters);
  } catch {
    result = null;
  }

  const offres = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;

  // Le type n'y figure pas : les pastilles au-dessus montrent déjà lequel est
  // retenu.
  const activeFilters = [
    filters.secteur && {
      label: SECTEUR_LABELS[filters.secteur],
      key: "secteur",
    },
    filters.niveauExperience && {
      label: NIVEAU_EXPERIENCE_LABELS[filters.niveauExperience],
      key: "niveauExperience",
    },
    filters.localisation && { label: filters.localisation, key: "localisation" },
  ].filter(Boolean) as { label: string; key: string }[];
  const nombreCriteres = [filters.localisation, filters.echeance, filters.secteur]
    .filter(Boolean).length;

  /** Conserve les filtres courants en changeant une seule clé. */
  function urlWith(patch: Record<string, string | number | undefined>) {
    const params = new URLSearchParams();
    const merged = { ...sp, ...patch };
    for (const [key, value] of Object.entries(merged)) {
      if (value !== undefined && value !== "" && value !== null) {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    return `/offres${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t("titre")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("resultats", { total })}
        </p>
      </header>

      {/* Types en pastilles, à un geste : c'est le filtre le plus utilisé. Sur
          téléphone, la rangée défile horizontalement au lieu de s'empiler
          sur trois lignes. */}
      {types.length ? (
        <nav
          aria-label={t("typeOpportunite")}
          className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          <Link
            href={urlWith({ typeOffre: undefined, page: undefined })}
            aria-current={typeDemande ? undefined : "page"}
            className={cn(
              "inline-flex shrink-0 items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              typeDemande
                ? "bg-card text-muted-foreground hover:text-foreground"
                : "border-foreground/15 bg-foreground text-background",
            )}
          >
            {t("tous")}
          </Link>
          {types.map((type) => {
            const style = styleType(type);
            const Icone = style.icone;
            const actif = typeDemande?.code === type.code;
            return (
              <Link
                key={type.id}
                href={urlWith({
                  typeOffre: actif ? undefined : type.code,
                  page: undefined,
                })}
                aria-current={actif ? "page" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  actif ? "text-white shadow-sm" : "bg-card text-muted-foreground hover:text-foreground",
                )}
                style={actif ? { background: style.teinte, borderColor: style.teinte } : undefined}
              >
                <Icone
                  className="size-4"
                  style={actif ? undefined : { color: style.teinte }}
                  aria-hidden
                />
                {type.libelle}
              </Link>
            );
          })}
        </nav>
      ) : null}

      {/* Formulaire GET : fonctionne sans JavaScript, indexable, et les filtres
          restent dans l'URL — partageables et mis en cache par Next. */}
      <form
        method="GET"
        action="/offres"
        className="mb-6 rounded-lg border bg-card p-3"
      >
        {/* Le type choisi par les pastilles est conservé à la recherche. */}
        {typeDemande ? (
          <input type="hidden" name="typeOffre" value={typeDemande.code} />
        ) : null}

        <FiltresRepliables
          libelle={t("filtres")}
          actifs={nombreCriteres}
          recherche={
            <>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                name="keyword"
                type="search"
                defaultValue={sp.keyword ?? ""}
                placeholder={t("champMotCle")}
                className="pl-9"
                aria-label={t("motCle")}
              />
            </>
          }
          actions={
            <Button
              type="submit"
              size="icon"
              className="shrink-0 lg:hidden"
              aria-label={t("rechercher")}
            >
              <Search className="size-4" />
            </Button>
          }
        >
          <Input
            name="localisation"
            defaultValue={sp.localisation ?? ""}
            placeholder={t("localisation")}
            className="lg:w-48"
            aria-label={t("localisation")}
          />

          <select
            name="echeance"
            defaultValue={sp.echeance ?? ""}
            aria-label={t("echeance")}
            className="h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:w-44"
          >
            <option value="">{t("toutesEcheances")}</option>
            <option value="ouverte">{t("echeanceOuverte")}</option>
            <option value="depassee">{t("echeanceDepassee")}</option>
          </select>

          <select
            name="secteur"
            defaultValue={sp.secteur ?? ""}
            aria-label={t("secteur")}
            className="h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:w-48"
          >
            <option value="">{t("tousLesSecteurs")}</option>
            {(Object.keys(SECTEUR_LABELS) as Secteur[]).map((s) => (
              <option key={s} value={s}>
                {SECTEUR_LABELS[s]}
              </option>
            ))}
          </select>

          <Button type="submit" className="lg:w-auto">
            <SlidersHorizontal className="size-4" />
            {t("filtrer")}
          </Button>
        </FiltresRepliables>

        {activeFilters.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3">
            {activeFilters.map((f) => (
              <Badge key={f.key} variant="secondary" className="gap-1">
                {f.label}
                <Link
                  href={urlWith({ [f.key]: undefined, page: undefined })}
                  aria-label={t("retirerFiltre", { filtre: f.label })}
                  className="ml-0.5 text-muted-foreground hover:text-foreground"
                >
                  ×
                </Link>
              </Badge>
            ))}
            <Link
              href="/offres"
              className="ml-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              {t("toutEffacer")}
            </Link>
          </div>
        ) : null}
      </form>

      {offres.length === 0 ? (
        <EmptyState
          icon={Search}
          title={t("videTitre")}
          description={t("videTexte")}
          action={
            <Button variant="outline" size="sm" render={<Link href="/offres" />}>
              {t("reinitialiser")}
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {offres.map((offre) => (
              <OffreCard
                key={offre.id}
                offre={offre}
                href={`/offres/${offre.id}`}
              />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav
              aria-label={t("pagination")}
              className="mt-8 flex items-center justify-center gap-2"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                render={
                  page <= 1 ? (
                    <span />
                  ) : (
                    <Link href={urlWith({ page: page - 1 })} rel="prev" />
                  )
                }
              >
                {t("precedent")}
              </Button>
              <span className="px-2 text-sm tabular-nums text-muted-foreground">
                {t("page", { page, total: totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                render={
                  page >= totalPages ? (
                    <span />
                  ) : (
                    <Link href={urlWith({ page: page + 1 })} rel="next" />
                  )
                }
              >
                {t("suivant")}
              </Button>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
