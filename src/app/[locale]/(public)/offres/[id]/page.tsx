import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Eye,
  FileText,
  Heart,
  MapPin,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { offresServerApi } from "@/lib/api/offres";
import { fileUrl } from "@/lib/api/client";
import { absoluteUrl } from "@/lib/site";
import {
  niveauExperienceLabel,
  secteurLabel,
  typeEmploiLabel,
} from "@/lib/enums";
import {
  styleOffre,
} from "@/lib/type-offre";
import {
  BoutonPartage,
  OffreInteractions,
} from "@/components/offres/offre-interactions";
import {
  ActionsOffre,
  CorpsOffre,
} from "@/components/offres/offre-protegee";
import { OffreCard } from "@/components/shared/offre-card";
import {
  daysUntil,
  formatDate,
  formatFileSize,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Offre } from "@/lib/types";

export const revalidate = 300;

async function getOffre(id: string): Promise<Offre | null> {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) return null;
  try {
    return await offresServerApi.byId(numericId);
  } catch {
    return null;
  }
}

/**
 * Métadonnées par offre — c'est ce qui manquait entièrement à l'ancien front :
 * un lien partagé sur WhatsApp s'affichait sans titre ni aperçu.
 */
export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const offre = await getOffre(id);

  if (!offre) {
    const tMeta = await getTranslations("offre");
    return { title: tMeta("introuvable") };
  }

  const parts = [
    offre.entreprise,
    offre.localisation,
    styleOffre(offre).libelle,
  ].filter(Boolean);

  // `generateMetadata` s'exécute sans session — toujours. Elle reçoit donc
  // l'aperçu servi aux visiteurs, où la description complète est absente :
  // c'est l'accroche qui en tient lieu, et elle est faite pour ça.
  const texte =
    offre.metaDescription ?? offre.extrait ?? offre.description ?? offre.titre;
  const description = `${texte.replace(/\s+/g, " ").slice(0, 155).trim()}…`;

  // La couverture devient l'aperçu des liens partagés : c'est elle qui rend
  // une offre visible dans un fil WhatsApp ou LinkedIn.
  const images = offre.imageUrl ? [offre.imageUrl] : undefined;

  return {
    title: offre.metaTitre ?? offre.titre,
    description,
    alternates: { canonical: `/offres/${offre.id}` },
    openGraph: {
      type: "article",
      title: `${offre.titre}${parts.length ? ` — ${parts.join(" · ")}` : ""}`,
      description,
      publishedTime: offre.datePublication,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: offre.titre,
      description,
      images,
    },
  };
}

/** JSON-LD JobPosting — condition d'éligibilité à Google for Jobs. */
function JobPostingSchema({ offre }: { offre: Offre }) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: offre.titre,
    description: offre.description ?? offre.extrait ?? offre.titre,
    image: offre.imageUrl ?? undefined,
    datePosted: offre.datePublication,
    employmentType: offre.typeEmploi ?? undefined,
    industry: offre.secteur ? secteurLabel(offre.secteur) : undefined,
    hiringOrganization: offre.entreprise
      ? { "@type": "Organization", name: offre.entreprise }
      : undefined,
    jobLocation: offre.localisation
      ? {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: offre.localisation,
            addressCountry: "SN",
          },
        }
      : undefined,
    validThrough: offre.dateLimite ?? undefined,
    baseSalary:
      offre.salaireMin || offre.salaireMax
        ? {
            "@type": "MonetaryAmount",
            currency: offre.devise ?? "XOF",
            value: {
              "@type": "QuantitativeValue",
              minValue: offre.salaireMin ?? undefined,
              maxValue: offre.salaireMax ?? undefined,
              unitText: "MONTH",
            },
          }
        : undefined,
  };

  // Les clés `undefined` disparaissent à la sérialisation JSON.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: React.ReactNode;
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  );
}

/**
 * Offres du même type, hors celle affichée.
 *
 * Le chargement est indépendant de la page : un échec ici ne doit pas priver le
 * visiteur de l'offre qu'il est venu lire.
 */
async function getSimilaires(offre: Offre): Promise<Offre[]> {
  if (!offre.typeOffre) return [];
  try {
    const resultat = await offresServerApi.list({
      typeOffre: offre.typeOffre,
      limit: 4,
    });
    return resultat.data.filter((autre) => autre.id !== offre.id).slice(0, 3);
  } catch {
    return [];
  }
}

export default async function OffreDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("offre");
  const { id } = await props.params;
  const offre = await getOffre(id);

  if (!offre) notFound();

  const similaires = await getSimilaires(offre);

  const style = styleOffre(offre);
  const Icon = style.icone;
  const remaining = daysUntil(offre.dateLimite);
  // Sert aux aperçus de partage : l'accroche est ce qu'un visiteur peut lire,
  // la description complète n'étant pas servie au rendu serveur.
  const resume = (offre.extrait ?? offre.description ?? "")
    .replace(/\s+/g, " ")
    .slice(0, 120)
    .trim();

  return (
    <>
      <JobPostingSchema offre={offre} />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="mb-5 -ml-2 rounded-lg"
          render={<Link href="/recherche" />}
        >
          <ArrowLeft className="size-4" />
          Toutes les offres
        </Button>

        <div className="grid gap-6 lg:grid-cols-[1fr_21rem]">
          <div className="min-w-0">
            <header className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              {/* Bandeau : la photographie de couverture quand elle existe,
                  sinon un dégradé construit à partir de la couleur du type. Le
                  titre est posé dessus, sur un voile sombre — sans ce voile, sa
                  lisibilité dépendrait de la zone de l'image située derrière. */}
              <div className="relative h-44 w-full sm:h-56">
                {offre.imageUrl ? (
                  <Image
                    src={offre.imageUrl}
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 720px"
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, color-mix(in oklch, ${style.teinte} 94%, black 6%) 0%, color-mix(in oklch, ${style.teinte} 58%, white 30%) 100%)`,
                    }}
                  >
                    <span
                      className="absolute inset-0 opacity-25"
                      style={{
                        backgroundImage:
                          "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
                        backgroundSize: "18px 18px",
                      }}
                      aria-hidden
                    />
                    <Icon
                      className="absolute -bottom-6 right-4 size-40 text-white/20"
                      aria-hidden
                    />
                  </div>
                )}

                <span
                  className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
                  aria-hidden
                />

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge className="h-6 gap-1.5 border-0 bg-white/95 px-2.5 text-[11px] font-bold text-neutral-900">
                      <Icon className="size-3" style={{ color: style.teinte }} aria-hidden />
                      {style.libelle}
                    </Badge>
                    {offre.typeEmploi ? (
                      <Badge className="h-6 border-0 bg-white/20 px-2.5 text-[11px] font-medium text-white backdrop-blur">
                        {typeEmploiLabel(offre.typeEmploi)}
                      </Badge>
                    ) : null}
                    {offre.estCloturee ? (
                      <Badge className="h-6 border-0 bg-white/20 px-2.5 text-[11px] font-medium text-white backdrop-blur">
                        Clôturée
                      </Badge>
                    ) : null}
                  </div>

                  <h1 className="mt-2.5 text-balance text-2xl font-extrabold leading-tight tracking-tight text-white drop-shadow-sm sm:text-3xl">
                    {offre.titre}
                  </h1>
                </div>
              </div>

              <div className="p-5">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  {offre.entreprise ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                      <Building2 className="size-4 text-muted-foreground" aria-hidden />
                      {offre.entreprise}
                    </span>
                  ) : null}
                  {offre.localisation ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-4" aria-hidden />
                      {offre.localisation}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="size-4" aria-hidden />
                    {t("publieeLe", { date: formatDate(offre.datePublication) })}
                  </span>
                </div>

                {offre.tags?.length ? (
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-4">
                    {offre.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="rounded-full text-[11px]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </header>

            <section className="mt-4 rounded-2xl border bg-card p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t("description")}
              </h2>
              {/* Mesure limitée à 68 caractères environ : au-delà, l'œil
                  perd la ligne suivante en revenant à la marge. */}
              {/* Rendu côté navigateur : le serveur n'a pas de session — les
                  jetons vivent dans le navigateur — et sert donc toujours
                  l'aperçu. C'est ce composant qui réclame l'offre complète
                  quand une session existe, et qui propose la connexion sinon. */}
              <CorpsOffre apercu={offre} />
            </section>


            <OffreInteractions
              offreId={offre.id}
              titre={offre.titre}
              resume={resume}
              likesInitial={offre._count?.likes ?? 0}
            />

            {offre.fichiers?.length ? (
              <section className="mt-4 rounded-2xl border bg-card p-5 shadow-sm">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  <Paperclip className="size-4" aria-hidden />
                  Pièces jointes
                </h2>
                <ul className="divide-y">
                  {offre.fichiers.map((f) => (
                    <li key={f.id}>
                      <a
                        href={fileUrl(f.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 py-2.5 text-sm hover:text-primary"
                      >
                        <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="min-w-0 flex-1 truncate">{f.nom}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatFileSize(f.taille)}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          {/* Colonne latérale — récapitulatif et appel à l'action */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              {/* Compte à rebours en tête de colonne : c'est l'information qui
                  décide de l'action, elle passe donc avant le récapitulatif. */}
              {remaining !== null ? (
                <div
                  className={cn(
                    "mb-5 flex items-center gap-3 rounded-xl border px-4 py-3",
                    remaining < 0
                      ? "bg-muted/50 text-muted-foreground"
                      : remaining === 0
                        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                        : remaining <= 7
                          ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
                  )}
                >
                  <CalendarClock className="size-5 shrink-0" aria-hidden />
                  <div className="min-w-0">
                    {remaining < 0 ? (
                      <p className="text-sm font-semibold">
                        {t("echeanceDepassee")}
                      </p>
                    ) : (
                      <>
                        <p className="text-xl font-extrabold leading-none tabular-nums">
                          {remaining === 0 ? t("dernierJour") : remaining}
                        </p>
                        <p className="mt-1 text-xs font-medium">
                          {remaining === 0
                            ? t("pourPostuler")
                            : t("joursPourPostuler", { n: remaining })}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ) : null}

              <dl className="divide-y">
                <DetailRow
                  label={t("secteur")}
                  value={offre.secteur ? secteurLabel(offre.secteur) : null}
                />
                <DetailRow
                  label={t("experience")}
                  value={
                    offre.niveauExperience
                      ? niveauExperienceLabel(offre.niveauExperience)
                      : null
                  }
                />
                <DetailRow
                  label={t("dateLimite")}
                  value={offre.dateLimite ? formatDate(offre.dateLimite) : null}
                />
              </dl>

              <div className="mt-5 flex flex-col gap-2">
                <ActionsOffre apercu={offre} />
                {/* Partager est proposé au même endroit que Postuler : c'est
                    là que la décision se prend, et une offre se transmet
                    souvent à un proche plutôt qu'on y postule soi-même. */}
                <BoutonPartage
                  titre={offre.titre}
                  resume={resume}
                  url={absoluteUrl(`/offres/${offre.id}`)}
                  pleineLargeur
                />

                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  render={<Link href={`/login?next=/offres/${offre.id}`} />}
                >
                  <Heart className="size-4" />
                  {t("favoris")}
                </Button>
              </div>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Eye className="size-3.5" aria-hidden />
                {t("consultations", { n: offre.viewCount })}
              </p>
            </div>
          </aside>
        </div>

        {/* Offres du même type : la fin d'une page d'offre est un cul-de-sac,
            sauf si elle propose la suite. */}
        {similaires.length ? (
          <section className="mt-12 border-t pt-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight">
                  D&apos;autres {style.libelle.toLowerCase()}s à découvrir
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Dans la même catégorie
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 rounded-lg"
                render={<Link href={`/recherche?typeOffre=${offre.typeOffre}`} />}
              >
                Tout voir
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {similaires.map((autre) => (
                <OffreCard
                  key={autre.id}
                  offre={autre}
                  href={`/offres/${autre.id}`}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
