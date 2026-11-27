import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { School } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { alternatesPour } from "@/i18n/metadonnees";
import { EmptyState } from "@/components/shared/empty-state";
import { BasculeFormation } from "@/components/offres/bascule-formation";
import {
  CLASSE_CARTE_CENTRE,
  ContenuCarteCentre,
} from "@/components/offres/carte-centre";
import { centresServerApi, type CentreFormation } from "@/lib/api/centres";
import { cn } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "centres" });
  return {
    title: t("titre"),
    description: t("description"),
    alternates: alternatesPour("/centres-formation", locale),
  };
}

export default async function CentresFormationPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ region?: string }>;
}) {
  setRequestLocale((await props.params).locale);
  const { region } = await props.searchParams;
  const t = await getTranslations("centres");

  let centres: CentreFormation[] = [];
  try {
    centres = await centresServerApi.lister();
  } catch {
    // Liste indisponible : la page reste lisible, simplement vide.
  }

  // Les régions proposées sont celles où un centre existe : un filtre qui ne
  // mène nulle part n'aide personne.
  const regions = [...new Set(centres.map((c) => c.region).filter(Boolean))].sort(
    (a, b) => a!.localeCompare(b!, "fr"),
  ) as string[];
  const regionActive = regions.find(
    (r) => r.toLowerCase() === region?.toLowerCase(),
  );
  const affiches = regionActive
    ? centres.filter((c) => c.region === regionActive)
    : centres;

  return (
    <div className="page-publique mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <BasculeFormation
        actif="centres"
        libelles={{
          offres: t("ongletOffres"),
          centres: t("ongletCentres"),
          groupe: t("bascule"),
        }}
        rendre={(onglet, props) => (
          <Link
            href={onglet === "offres" ? "/offres?typeOffre=FORMATION" : "/centres-formation"}
            {...props}
          />
        )}
      />

      <header className="mt-8 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {t("surtitre")}
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{t("titre")}</h1>
        <p className="mt-3 text-pretty text-muted-foreground">{t("description")}</p>
      </header>

      {regions.length > 1 ? (
        <nav
          aria-label={t("filtrer")}
          className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1"
        >
          {["", ...regions].map((entree) => {
            const actif = (regionActive ?? "") === entree;
            return (
              <Link
                key={entree || "toutes"}
                href={
                  entree
                    ? `/centres-formation?region=${encodeURIComponent(entree)}`
                    : "/centres-formation"
                }
                aria-current={actif ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors",
                  actif
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {entree || t("toutes")}
              </Link>
            );
          })}
        </nav>
      ) : null}

      {affiches.length === 0 ? (
        <div className="mt-10">
          <EmptyState icon={School} title={t("vide")} />
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {affiches.map((centre) => (
            <li key={centre.id}>
              <Link
                href={`/centres-formation/${centre.id}`}
                className={CLASSE_CARTE_CENTRE}
              >
                <ContenuCarteCentre
                  centre={centre}
                  formations={t("formations", { n: centre._count?.formations ?? 0 })}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
