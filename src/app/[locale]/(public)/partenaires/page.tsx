import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Building2, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { alternatesPour } from "@/i18n/metadonnees";
import { EmptyState } from "@/components/shared/empty-state";
import { fileUrl } from "@/lib/api/client";
import {
  partenaireServerApi,
  type PartenaireVitrine,
  type TypePartenaire,
} from "@/lib/api/partenaire";
import { secteurLabel } from "@/lib/enums";
import { cn } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "annuaire" });
  return {
    title: t("titre"),
    description: t("description"),
    alternates: alternatesPour("/partenaires", locale),
  };
}

export default async function AnnuairePage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  setRequestLocale((await props.params).locale);
  const { type } = await props.searchParams;
  const t = await getTranslations("annuaire");

  let types: TypePartenaire[] = [];
  let partenaires: PartenaireVitrine[] = [];
  try {
    [types, partenaires] = await Promise.all([
      partenaireServerApi.types(),
      partenaireServerApi.annuaire(),
    ]);
  } catch {
    // Annuaire indisponible : la page reste lisible, simplement vide.
  }

  const typeActif = types.find((t) => t.slug === type);
  const affiches = typeActif
    ? partenaires.filter((p) => p.typePartenaire?.slug === typeActif.slug)
    : partenaires;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {t("surtitre")}
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          {typeActif ? typeActif.nom : t("titre")}
        </h1>
        <p className="mt-3 text-pretty text-muted-foreground">
          {typeActif?.description || t("description")}
        </p>
      </header>

      {types.length > 1 ? (
        <nav
          aria-label={t("filtrer")}
          className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1"
        >
          {[{ slug: "", nom: t("tous") }, ...types].map((entree) => {
            const actif = (typeActif?.slug ?? "") === entree.slug;
            return (
              <Link
                key={entree.slug || "tous"}
                href={entree.slug ? `/partenaires?type=${entree.slug}` : "/partenaires"}
                aria-current={actif ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors",
                  actif
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {entree.nom}
              </Link>
            );
          })}
        </nav>
      ) : null}

      {affiches.length === 0 ? (
        <div className="mt-10">
          <EmptyState icon={Building2} title={t("vide")} />
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {affiches.map((partenaire) => (
            <li key={partenaire.id}>
              <CartePartenaire partenaire={partenaire} t={t} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CartePartenaire({
  partenaire,
  t,
}: {
  partenaire: PartenaireVitrine;
  t: Awaited<ReturnType<typeof getTranslations<"annuaire">>>;
}) {
  const details = [
    partenaire.secteur ? secteurLabel(partenaire.secteur) : null,
    partenaire.ville,
  ].filter(Boolean);

  return (
    <Link
      href={`/partenaires/${partenaire.id}`}
      className="group flex h-full flex-col rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="flex items-start gap-4">
        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl border bg-background">
          {partenaire.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fileUrl(partenaire.logoUrl)}
              alt=""
              loading="lazy"
              className="size-full object-contain p-1.5"
            />
          ) : (
            <Building2 className="size-6 text-muted-foreground" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold group-hover:text-primary">
            {partenaire.nom}
          </h2>
          {partenaire.typePartenaire ? (
            <p className="text-xs font-medium text-primary">
              {partenaire.typePartenaire.nom}
            </p>
          ) : null}
          {details.length ? (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              {partenaire.ville ? <MapPin className="size-3.5 shrink-0" aria-hidden /> : null}
              {details.join(" · ")}
            </p>
          ) : null}
        </div>
      </div>
      {partenaire.description ? (
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {partenaire.description}
        </p>
      ) : null}
      <p className="mt-auto pt-4 text-sm font-semibold text-primary">
        {t("offres", { n: partenaire._count?.offres ?? 0 })}
      </p>
    </Link>
  );
}
