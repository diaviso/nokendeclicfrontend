import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { alternatesPour } from "@/i18n/metadonnees";
import { Link } from "@/i18n/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { OffreCard } from "@/components/shared/offre-card";
import { EmptyState } from "@/components/shared/empty-state";
import { offresServerApi } from "@/lib/api/offres";
import { typesOffresServerApi } from "@/lib/api/types-offres";
import { NIVEAU_EXPERIENCE_LABELS, SECTEUR_LABELS } from "@/lib/enums";
import { formatNumber } from "@/lib/format";
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
  searchParams: Promise<Search>;
}) {
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

  const activeFilters = [
    typeDemande && { label: typeDemande.libelle, key: "typeOffre" },
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

      {/* Formulaire GET : fonctionne sans JavaScript, indexable, et les filtres
          restent dans l'URL — partageables et mis en cache par Next. */}
      <form
        method="GET"
        action="/offres"
        className="mb-6 rounded-lg border bg-card p-3"
      >
        <div className="flex flex-col gap-2 lg:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              name="keyword"
              defaultValue={sp.keyword ?? ""}
              placeholder={t("champMotCle")}
              className="pl-9"
              aria-label={t("motCle")}
            />
          </div>

          <Input
            name="localisation"
            defaultValue={sp.localisation ?? ""}
            placeholder={t("localisation")}
            className="lg:w-48"
            aria-label={t("localisation")}
          />

          <select
            name="typeOffre"
            defaultValue={sp.typeOffre ?? ""}
            aria-label={t("typeOpportunite")}
            className="h-9 rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 lg:w-44"
          >
            <option value="">{t("tousLesTypes")}</option>
            {types.map((type) => (
              <option key={type.id} value={type.code}>
                {type.libelle}
              </option>
            ))}
          </select>

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
        </div>

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
