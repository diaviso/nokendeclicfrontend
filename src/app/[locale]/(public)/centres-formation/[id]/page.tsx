import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ExternalLink, Mail, MapPin, Phone, School } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { OffreCard } from "@/components/shared/offre-card";
import { EmptyState } from "@/components/shared/empty-state";
import { fileUrl } from "@/lib/api/client";
import { offresServerApi } from "@/lib/api/offres";
import { centresServerApi, type CentreFormationDetail } from "@/lib/api/centres";
import type { Offre } from "@/lib/types";

export const revalidate = 300;

/** Rendue à la première visite, puis servie depuis le cache. */
export function generateStaticParams() {
  return [];
}

async function getCentre(id: string): Promise<CentreFormationDetail | null> {
  const numerique = Number(id);
  if (!Number.isInteger(numerique) || numerique < 1) return null;
  try {
    return await centresServerApi.fiche(numerique);
  } catch {
    return null;
  }
}

export async function generateMetadata(props: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await props.params;
  const centre = await getCentre(id);
  if (!centre) {
    const t = await getTranslations({ locale, namespace: "centres" });
    return { title: t("introuvable") };
  }
  const description = (centre.description ?? centre.domaines ?? centre.nom)
    .replace(/\s+/g, " ")
    .slice(0, 155);
  return {
    title: centre.nom,
    description,
    alternates: { canonical: `/centres-formation/${centre.id}` },
    openGraph: {
      title: centre.nom,
      description,
      images: centre.logoUrl ? [fileUrl(centre.logoUrl) ?? ""] : undefined,
    },
  };
}

export default async function CentreFormationPage(props: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations("centres");

  const centre = await getCentre(id);
  if (!centre) notFound();

  // Les offres complètes, pour les afficher comme partout ailleurs.
  let formations: Offre[] = [];
  try {
    const page = await offresServerApi.list({ centreFormationId: centre.id, limit: 60 });
    formations = page.data;
  } catch {
    formations = [];
  }

  const lieu = [centre.adresse, centre.ville, centre.region].filter(
    (v, i, tous) => v && tous.indexOf(v) === i,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-4 rounded-lg"
        render={<Link href="/centres-formation" />}
      >
        <ArrowLeft className="size-4" />
        {t("retour")}
      </Button>

      <header className="overflow-hidden rounded-3xl border bg-card">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent sm:h-32" />
        <div className="-mt-12 flex flex-col gap-5 px-5 pb-6 sm:-mt-14 sm:flex-row sm:items-end sm:px-8">
          <span className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-3xl border-4 border-card bg-background shadow-sm sm:size-28">
            {centre.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fileUrl(centre.logoUrl)}
                alt={centre.nom}
                className="size-full object-contain p-2"
              />
            ) : (
              <School className="size-10 text-muted-foreground" aria-hidden />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {t("surtitre")}
            </p>
            <h1 className="text-balance text-2xl font-bold sm:text-3xl">{centre.nom}</h1>
            {lieu.length ? (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                {lieu.join(", ")}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {centre.telephone ? (
              <Button
                variant="outline"
                className="rounded-xl"
                render={<a href={`tel:${centre.telephone.replace(/\s+/g, "")}`} />}
              >
                <Phone className="size-4" />
                {t("appeler")}
              </Button>
            ) : null}
            {centre.emailContact ? (
              <Button
                variant="outline"
                className="rounded-xl"
                render={<a href={`mailto:${centre.emailContact}`} />}
              >
                <Mail className="size-4" />
                {t("ecrire")}
              </Button>
            ) : null}
            {centre.siteWeb ? (
              <Button
                variant="outline"
                className="rounded-xl"
                render={
                  <a href={centre.siteWeb} target="_blank" rel="noopener noreferrer nofollow" />
                }
              >
                <ExternalLink className="size-4" />
                {t("siteWeb")}
              </Button>
            ) : null}
          </div>
        </div>
        {centre.domaines || centre.description || centre.telephone || centre.emailContact ? (
          <div className="grid gap-5 border-t px-5 py-5 sm:px-8 md:grid-cols-[1fr_16rem]">
            <div>
              {centre.domaines ? (
                <p className="mb-3 text-sm">
                  <span className="font-semibold">{t("domaines")} : </span>
                  {centre.domaines}
                </p>
              ) : null}
              {centre.description ? (
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {centre.description}
                </p>
              ) : null}
            </div>
            {centre.telephone || centre.emailContact ? (
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{t("contact")}</p>
                {centre.telephone ? (
                  <p className="text-muted-foreground">{centre.telephone}</p>
                ) : null}
                {centre.emailContact ? (
                  <p className="break-all text-muted-foreground">{centre.emailContact}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </header>

      <section className="mt-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold">{t("sesFormations")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("formations", { n: formations.length })}
          </p>
        </div>

        {formations.length === 0 ? (
          <EmptyState icon={School} title={t("aucuneFormation")} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {formations.map((offre) => (
              <OffreCard key={offre.id} offre={offre} href={`/offres/${offre.id}`} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
