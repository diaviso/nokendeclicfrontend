import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Building2, ExternalLink, MapPin, Search, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { OffreCard } from "@/components/shared/offre-card";
import { EmptyState } from "@/components/shared/empty-state";
import { fileUrl } from "@/lib/api/client";
import { offresServerApi } from "@/lib/api/offres";
import { partenaireServerApi, type PartenaireVitrine } from "@/lib/api/partenaire";
import { secteurLabel } from "@/lib/enums";
import type { Offre } from "@/lib/types";

export const revalidate = 300;

/** Rendue à la première visite, puis servie depuis le cache. */
export function generateStaticParams() {
  return [];
}

async function getPartenaire(id: string): Promise<PartenaireVitrine | null> {
  const numerique = Number(id);
  if (!Number.isInteger(numerique) || numerique < 1) return null;
  try {
    return await partenaireServerApi.structure(numerique);
  } catch {
    return null;
  }
}

export async function generateMetadata(props: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await props.params;
  const partenaire = await getPartenaire(id);
  if (!partenaire) {
    const t = await getTranslations({ locale, namespace: "annuaire" });
    return { title: t("introuvable") };
  }
  const description = (partenaire.description ?? partenaire.nom)
    .replace(/\s+/g, " ")
    .slice(0, 155);
  return {
    title: partenaire.nom,
    description,
    alternates: { canonical: `/partenaires/${partenaire.id}` },
    openGraph: {
      title: partenaire.nom,
      description,
      images: partenaire.logoUrl ? [fileUrl(partenaire.logoUrl) ?? ""] : undefined,
    },
  };
}

export default async function VitrinePartenairePage(props: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations("annuaire");

  const partenaire = await getPartenaire(id);
  if (!partenaire) notFound();

  let offres: Offre[] = [];
  let total = 0;
  try {
    const page = await offresServerApi.list({
      partenaireId: partenaire.id,
      echeance: "ouverte",
      limit: 24,
    });
    offres = page.data;
    total = page.total;
  } catch {
    offres = [];
  }

  const lieu = [partenaire.ville, partenaire.region].filter(
    (v, i, tous) => v && tous.indexOf(v) === i,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-4 rounded-lg"
        render={<Link href="/partenaires" />}
      >
        <ArrowLeft className="size-4" />
        {t("retour")}
      </Button>

      <header className="overflow-hidden rounded-3xl border bg-card">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent sm:h-32" />
        <div className="-mt-12 flex flex-col gap-5 px-5 pb-6 sm:-mt-14 sm:flex-row sm:items-end sm:px-8">
          <span className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-3xl border-4 border-card bg-background shadow-sm sm:size-28">
            {partenaire.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fileUrl(partenaire.logoUrl)}
                alt={partenaire.nom}
                className="size-full object-contain p-2"
              />
            ) : (
              <Building2 className="size-10 text-muted-foreground" aria-hidden />
            )}
          </span>
          <div className="min-w-0 flex-1">
            {partenaire.typePartenaire ? (
              <Link
                href={`/partenaires?type=${partenaire.typePartenaire.slug}`}
                className="text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
              >
                {partenaire.typePartenaire.nom}
              </Link>
            ) : null}
            <h1 className="text-balance text-2xl font-bold sm:text-3xl">{partenaire.nom}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {partenaire.secteur ? <span>{secteurLabel(partenaire.secteur)}</span> : null}
              {lieu.length ? (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden />
                  {lieu.join(", ")}
                </span>
              ) : null}
              {partenaire.taille ? (
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" aria-hidden />
                  {partenaire.taille}
                </span>
              ) : null}
            </p>
          </div>
          {partenaire.siteWeb ? (
            <Button
              variant="outline"
              className="rounded-xl"
              render={
                <a href={partenaire.siteWeb} target="_blank" rel="noopener noreferrer nofollow" />
              }
            >
              <ExternalLink className="size-4" />
              {t("siteWeb")}
            </Button>
          ) : null}
        </div>
        {partenaire.description ? (
          <p className="whitespace-pre-line border-t px-5 py-5 leading-relaxed text-muted-foreground sm:px-8">
            {partenaire.description}
          </p>
        ) : null}
      </header>

      <section className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{t("publications")}</h2>
            <p className="text-sm text-muted-foreground">{t("offres", { n: total })}</p>
          </div>
          {total > 0 ? (
            <Button
              variant="outline"
              className="rounded-xl"
              render={<Link href={`/offres?partenaireId=${partenaire.id}`} />}
            >
              <Search className="size-4" />
              {t("toutesSesOffres")}
            </Button>
          ) : null}
        </div>

        {offres.length === 0 ? (
          <EmptyState icon={Building2} title={t("aucunePublication")} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {offres.map((offre) => (
              <OffreCard key={offre.id} offre={offre} href={`/offres/${offre.id}`} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
