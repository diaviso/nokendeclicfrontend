"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Accessibility,
  ArrowRight,
  BarChart3,
  Briefcase,
  Gauge,
  MessageSquare,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsoleHeader } from "@/components/admin/console-header";
import { adminApi, typesOffresApi } from "@/lib/api";
import {
  STATUT_PROFESSIONNEL_CHART_COLORS,
  STATUT_PROFESSIONNEL_LABELS,
} from "@/lib/enums";
import { styleType } from "@/lib/type-offre";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StatutProfessionnel } from "@/lib/types";

const COULEURS_SEXE = [
  "var(--chart-2)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

/**
 * Tuile de mesure de la console.
 *
 * Elle diffère de celle de l'espace membre : ici la valeur est encadrée d'une
 * variation mensuelle et d'un lien vers la liste correspondante. Un chiffre
 * d'administration ne se contemple pas, il sert de point d'entrée.
 */
function TuileMesure({
  label,
  valeur,
  variation,
  icone: Icone,
  teinte,
  href,
  index,
}: {
  label: string;
  valeur: number;
  variation?: number;
  icone: typeof Users;
  teinte: string;
  href?: string;
  index: number;
}) {
  const contenu = (
    <>
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: teinte }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-30"
        style={{ background: teinte }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-4xl font-bold leading-none tracking-tight tabular-nums">
            {formatNumber(valeur)}
          </p>

          {variation !== undefined ? (
            <p className="mt-2.5 flex items-center gap-1.5 text-xs">
              <span
                className="rounded-md px-1.5 py-0.5 font-bold tabular-nums"
                style={
                  variation > 0
                    ? {
                        background:
                          "color-mix(in oklch, var(--success) 14%, transparent)",
                        color: "var(--success)",
                      }
                    : undefined
                }
              >
                {variation > 0 ? `+${formatNumber(variation)}` : "—"}
              </span>
              <span className="text-muted-foreground">ce mois-ci</span>
            </p>
          ) : null}
        </div>

        <span
          className="grid size-10 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110"
          style={{
            background: `color-mix(in oklch, ${teinte} 13%, transparent)`,
            color: teinte,
          }}
        >
          <Icone className="size-5" aria-hidden />
        </span>
      </div>

      {href ? (
        <span className="relative mt-4 flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors group-hover:text-foreground">
          Ouvrir la liste
          <ArrowRight
            className="size-3.5 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden
          />
        </span>
      ) : null}
    </>
  );

  const classes = cn(
    "entree group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300",
    href && "hover:-translate-y-0.5 hover:shadow-lg",
  );
  const style = { "--i": index } as React.CSSProperties;

  if (href) {
    return (
      <Link
        href={href}
        style={style}
        className={cn(
          classes,
          "block outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        )}
      >
        {contenu}
      </Link>
    );
  }

  return (
    <div style={style} className={classes}>
      {contenu}
    </div>
  );
}

function TuileSquelette({ index }: { index: number }) {
  return (
    <div
      className="rounded-2xl border bg-card p-5"
      style={{ opacity: 1 - index * 0.12 }}
    >
      <div className="shimmer h-3.5 w-24 rounded bg-muted" />
      <div className="shimmer mt-3 h-9 w-20 rounded bg-muted" />
      <div className="shimmer mt-3 h-3 w-16 rounded bg-muted" />
    </div>
  );
}

function CarteGraphique({
  titre,
  description,
  teinte = "var(--chart-1)",
  index,
  children,
}: {
  titre: string;
  description?: string;
  teinte?: string;
  index: number;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{ "--i": index } as React.CSSProperties}
      className="entree overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      <header className="flex items-center gap-2.5 border-b px-5 py-3.5">
        <span
          aria-hidden
          className="h-4 w-1 shrink-0 rounded-full"
          style={{ background: teinte }}
        />
        <div className="min-w-0">
          <h2 className="text-sm font-bold">{titre}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Infobulle alignée sur les jetons de couleur, plutôt que sur le thème Recharts. */
function InfobulleGraphique({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; payload?: { name?: string } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const entree = payload[0];

  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold">
        {label ?? entree.payload?.name ?? entree.name}
      </p>
      <p className="tabular-nums text-muted-foreground">
        {formatNumber(entree.value)}
      </p>
    </div>
  );
}

/** Légende commune aux camemberts : la valeur y est aussi lisible que la part. */
function Legende({
  entrees,
}: {
  entrees: { name: string; value: number; color: string }[];
}) {
  const total = entrees.reduce((somme, entree) => somme + entree.value, 0);

  return (
    <ul className="mt-3 space-y-1.5">
      {entrees.map((entree) => (
        <li key={entree.name} className="flex items-center gap-2 text-xs">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-sm"
            style={{ background: entree.color }}
          />
          <span className="min-w-0 flex-1 truncate">{entree.name}</span>
          <span className="tabular-nums font-semibold">
            {formatNumber(entree.value)}
          </span>
          <span className="w-10 text-right tabular-nums text-muted-foreground">
            {total > 0 ? `${Math.round((entree.value / total) * 100)} %` : "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function AucuneDonnee() {
  return (
    <p className="dashed-frame py-12 text-center text-sm text-muted-foreground">
      Aucune donnée à représenter pour l&apos;instant.
    </p>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "statistics"],
    queryFn: adminApi.statistics,
  });

  const { data: desagregation } = useQuery({
    queryKey: ["admin", "disaggregation"],
    queryFn: adminApi.disaggregation,
  });

  const { data: types = [] } = useQuery({
    queryKey: ["types-offres"],
    queryFn: () => typesOffresApi.list(),
    staleTime: 5 * 60 * 1000,
  });

  // Les statistiques sont indexées par code de type ; libellé et couleur
  // viennent de la définition administrée quand elle est connue.
  const offresParType = Object.entries(stats?.offresByType ?? {})
    .map(([code, compte]) => {
      const style = styleType(
        types.find((type) => type.code === code),
        code,
      );
      // La teinte du type, et non une couleur de la palette de graphiques : le
      // camembert doit se lire avec les mêmes couleurs que les pastilles des
      // offres, sinon les deux vues ne se recoupent pas.
      return { name: style.libelle, value: compte, color: style.teinte };
    })
    .sort((a, b) => b.value - a.value);

  const parSexe = desagregation
    ? [
        { name: "Hommes", value: desagregation.gender.hommes },
        { name: "Femmes", value: desagregation.gender.femmes },
        { name: "Autres", value: desagregation.gender.autres },
        { name: "Non précisé", value: desagregation.gender.nonPrecise },
      ]
        .filter((entree) => entree.value > 0)
        .map((entree, index) => ({
          ...entree,
          color: COULEURS_SEXE[index % COULEURS_SEXE.length],
        }))
    : [];

  const parAge = Object.entries(desagregation?.ageRanges ?? {}).map(
    ([tranche, compte]) => ({ name: tranche, value: compte }),
  );

  const parStatut = Object.entries(desagregation?.statutProfessionnel ?? {})
    .map(([statut, compte]) => ({
      name:
        STATUT_PROFESSIONNEL_LABELS[statut as StatutProfessionnel] ?? statut,
      value: compte,
      color:
        STATUT_PROFESSIONNEL_CHART_COLORS[statut as StatutProfessionnel] ??
        "var(--chart-1)",
    }))
    .sort((a, b) => b.value - a.value);

  const parRegion = (desagregation?.regions ?? [])
    .filter((region) => region.region !== "Non précisé")
    .slice(0, 8)
    .map((region) => ({ name: region.region, value: region.count }));

  return (
    <>
      <ConsoleHeader
        title="Vue d'ensemble"
        icon={Gauge}
        teinte="var(--chart-1)"
        description="Activité de la plateforme et désagrégation des profils inscrits."
        actions={
          <Button
            variant="outline"
            className="rounded-xl"
            render={<Link href="/admin/statistiques" />}
          >
            <BarChart3 className="size-4" />
            Rapport complet
          </Button>
        }
      />

      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }, (_, index) => (
            <TuileSquelette key={index} index={index} />
          ))
        ) : (
          <>
            <TuileMesure
              index={0}
              label="Utilisateurs"
              valeur={stats?.totals.users ?? 0}
              variation={stats?.thisMonth.newUsers}
              icone={Users}
              teinte="var(--chart-2)"
              href="/admin/utilisateurs"
            />
            <TuileMesure
              index={1}
              label="Offres"
              valeur={stats?.totals.offres ?? 0}
              variation={stats?.thisMonth.newOffres}
              icone={Briefcase}
              teinte="var(--chart-3)"
              href="/admin/offres"
            />
            <TuileMesure
              index={2}
              label="Retours"
              valeur={stats?.totals.retours ?? 0}
              variation={stats?.thisMonth.newRetours}
              icone={MessageSquare}
              teinte="var(--chart-4)"
            />
            <TuileMesure
              index={3}
              label="Profils en situation de handicap"
              valeur={desagregation?.handicap.avec ?? 0}
              icone={Accessibility}
              teinte="var(--chart-5)"
            />
          </>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <CarteGraphique
          index={0}
          titre="Offres par type"
          teinte="var(--chart-3)"
          description="Répartition du catalogue selon les types administrés."
        >
          {offresParType.length === 0 ? (
            <AucuneDonnee />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={offresParType}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={90}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {offresParType.map((entree) => (
                      <Cell key={entree.name} fill={entree.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<InfobulleGraphique />} />
                </PieChart>
              </ResponsiveContainer>
              <Legende entrees={offresParType} />
            </>
          )}
        </CarteGraphique>

        <CarteGraphique
          index={1}
          titre="Répartition par sexe"
          teinte="var(--chart-2)"
          description="Sur les profils ayant renseigné l'information."
        >
          {parSexe.length === 0 ? (
            <AucuneDonnee />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={parSexe}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={56}
                    outerRadius={90}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {parSexe.map((entree) => (
                      <Cell key={entree.name} fill={entree.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<InfobulleGraphique />} />
                </PieChart>
              </ResponsiveContainer>
              <Legende entrees={parSexe} />
            </>
          )}
        </CarteGraphique>

        <CarteGraphique index={2} titre="Tranches d'âge" teinte="var(--chart-1)">
          {parAge.length === 0 ? (
            <AucuneDonnee />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={parAge} margin={{ left: -20 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<InfobulleGraphique />}
                  cursor={{ fill: "var(--muted)" }}
                />
                <Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CarteGraphique>

        <CarteGraphique
          index={3}
          titre="Statut professionnel"
          teinte="var(--chart-4)"
          description="Ce que déclarent les membres au moment de leur inscription."
        >
          {parStatut.length === 0 ? (
            <AucuneDonnee />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={parStatut} layout="vertical" margin={{ left: 30 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={<InfobulleGraphique />}
                  cursor={{ fill: "var(--muted)" }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {parStatut.map((entree) => (
                    <Cell key={entree.name} fill={entree.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CarteGraphique>

        <CarteGraphique
          index={4}
          titre="Régions les plus représentées"
          teinte="var(--chart-5)"
          description="Huit premières régions renseignées."
        >
          {parRegion.length === 0 ? (
            <AucuneDonnee />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={parRegion} layout="vertical" margin={{ left: 30 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={<InfobulleGraphique />}
                  cursor={{ fill: "var(--muted)" }}
                />
                <Bar dataKey="value" fill="var(--chart-5)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CarteGraphique>

        <CarteGraphique
          index={5}
          titre="Offres les plus commentées"
          teinte="var(--chart-2)"
          description="Là où la discussion se concentre."
        >
          {!stats?.topOffres?.length ? (
            <AucuneDonnee />
          ) : (
            <ol className="space-y-1">
              {stats.topOffres.slice(0, 6).map((offre, rang) => (
                <li key={offre.id}>
                  <Link
                    href={`/offres/${offre.id}`}
                    className="group flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted/60"
                  >
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-md text-xs font-bold tabular-nums",
                        rang === 0
                          ? "bg-[color-mix(in_oklch,var(--chart-2)_16%,transparent)] text-[var(--chart-2)]"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {rang + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate group-hover:underline">
                      {offre.titre}
                    </span>
                    <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                      {formatNumber(offre.retoursCount)} retour
                      {offre.retoursCount > 1 ? "s" : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </CarteGraphique>
      </div>
    </>
  );
}
