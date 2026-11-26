"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
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
  ArrowUpRight,
  BarChart3,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  FileText,
  Handshake,
  Heart,
  MessageCircle,
  MessageSquare,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConsoleATraiter } from "@/components/admin/use-console-a-traiter";
import { adminApi, typesOffresApi } from "@/lib/api";
import { CONSOLE_ACTIONS, CONSOLE_GROUPES } from "@/lib/console-nav";
import {
  ROLE_LABELS,
  STATUT_PROFESSIONNEL_CHART_COLORS,
  STATUT_PROFESSIONNEL_LABELS,
} from "@/lib/enums";
import { styleType } from "@/lib/type-offre";
import { formatNumber, formatRelative } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { Role, StatutProfessionnel } from "@/lib/types";

const COULEURS_SEXE = [
  "var(--c-blue)",
  "var(--c-orange)",
  "var(--c-teal)",
  "var(--muted-foreground)",
];

const COULEURS_ROLE: Record<Role, string> = {
  MEMBRE: "var(--c-blue)",
  PARTENAIRE: "var(--c-orange)",
  ADMIN: "var(--c-cyan)",
};

const STATUT_MODERATION: Record<string, { libelle: string; couleur: string }> = {
  PUBLIEE: { libelle: "Publiées", couleur: "var(--c-emerald)" },
  EN_ATTENTE: { libelle: "En attente", couleur: "var(--c-amber)" },
  REFUSEE: { libelle: "Refusées", couleur: "var(--c-rose)" },
};

/** Séries de la courbe d'activité. */
const SERIES = [
  { cle: "inscriptions", libelle: "Inscriptions", couleur: "var(--c-blue)" },
  { cle: "publications", libelle: "Publications", couleur: "var(--c-emerald)" },
  { cle: "retours", libelle: "Retours", couleur: "var(--c-orange)" },
  { cle: "favoris", libelle: "Favoris", couleur: "var(--c-amber)" },
  { cle: "likes", libelle: "J'aime", couleur: "var(--c-sky)" },
] as const;

type CleSerie = (typeof SERIES)[number]["cle"];

function moisCourt(cle: string): string {
  const [annee, mois] = cle.split("-");
  return new Date(Number(annee), Number(mois) - 1, 1)
    .toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })
    .replace(".", "");
}

function salutation() {
  const heure = new Date().getHours();
  if (heure < 5 || heure >= 18) return "Bonsoir";
  if (heure < 13) return "Bonjour";
  return "Bon après-midi";
}

/* ------------------------------------------------------------------------ */

/** Petite courbe de tendance, posée dans une tuile. */
function Tendance({
  valeurs,
  couleur,
  id,
}: {
  valeurs: number[];
  couleur: string;
  id: string;
}) {
  if (valeurs.length < 2) return null;
  const donnees = valeurs.map((valeur, index) => ({ index, valeur }));
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 opacity-90">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={donnees} margin={{ top: 4, left: 0, right: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={couleur} stopOpacity={0.35} />
              <stop offset="100%" stopColor={couleur} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="valeur"
            stroke={couleur}
            strokeWidth={2}
            fill={`url(#${id})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Tuile de mesure : valeur, variation du mois, courbe des derniers mois et
 * lien vers la liste. Un chiffre d'administration sert de point d'entrée.
 */
function TuileMesure({
  label,
  valeur,
  variation,
  icone: Icone,
  teinte,
  href,
  index,
  tendance,
  note,
}: {
  label: string;
  valeur: number;
  variation?: number;
  icone: typeof Users;
  teinte: string;
  href?: string;
  index: number;
  tendance?: number[];
  note?: string;
}) {
  const contenu = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full opacity-20 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
        style={{ background: teinte }}
      />
      {tendance ? (
        <Tendance valeurs={tendance} couleur={teinte} id={`tendance-${index}`} />
      ) : null}

      <div className="relative flex items-start justify-between gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-2xl text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
          style={{
            background: `linear-gradient(135deg, ${teinte}, color-mix(in oklch, ${teinte} 60%, black))`,
            boxShadow: `0 8px 20px -8px color-mix(in oklch, ${teinte} 80%, transparent)`,
          }}
        >
          <Icone className="size-5" aria-hidden />
        </span>
        {variation !== undefined ? (
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
              variation > 0 ? "" : "bg-muted text-muted-foreground",
            )}
            style={
              variation > 0
                ? {
                    background: "color-mix(in oklch, var(--c-emerald) 15%, transparent)",
                    color: "var(--c-emerald)",
                  }
                : undefined
            }
          >
            {variation > 0 ? <TrendingUp className="size-3" aria-hidden /> : null}
            {variation > 0 ? `+${formatNumber(variation)}` : "—"}
          </span>
        ) : null}
      </div>

      <div className="relative mt-4 pb-8">
        <p className="text-3xl font-extrabold leading-none tracking-tight tabular-nums sm:text-4xl">
          {formatNumber(valeur)}
        </p>
        <p className="mt-1.5 truncate text-sm font-medium text-muted-foreground">
          {label}
        </p>
        {note ? (
          <p className="mt-0.5 text-xs text-muted-foreground/80">{note}</p>
        ) : variation !== undefined ? (
          <p className="mt-0.5 text-xs text-muted-foreground/80">ce mois-ci</p>
        ) : null}
      </div>

      {href ? (
        <span className="absolute bottom-4 right-4 grid size-7 place-items-center rounded-full bg-background/80 text-muted-foreground shadow-sm ring-1 ring-border backdrop-blur transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground">
          <ArrowRight className="size-3.5" aria-hidden />
        </span>
      ) : null}
    </>
  );

  const classes =
    "entree group relative block overflow-hidden rounded-3xl border bg-card p-5 shadow-sm transition-all duration-300";
  const style = { "--i": index } as React.CSSProperties;

  if (href) {
    return (
      <Link
        href={href}
        style={style}
        className={cn(
          classes,
          "outline-none hover:-translate-y-1 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring/60",
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
      className="rounded-3xl border bg-card p-5"
      style={{ opacity: 1 - index * 0.12 }}
    >
      <div className="shimmer size-11 rounded-2xl bg-muted" />
      <div className="shimmer mt-4 h-9 w-24 rounded bg-muted" />
      <div className="shimmer mt-2 h-3 w-20 rounded bg-muted" />
      <div className="mt-8" />
    </div>
  );
}

function Carte({
  titre,
  description,
  teinte = "var(--c-indigo)",
  icone: Icone,
  index,
  action,
  className,
  children,
}: {
  titre: string;
  description?: string;
  teinte?: string;
  icone?: typeof Users;
  index: number;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{ "--i": index } as React.CSSProperties}
      className={cn(
        "entree relative overflow-hidden rounded-3xl border bg-card shadow-sm",
        className,
      )}
    >
      <header className="flex items-center gap-3 px-5 pb-1 pt-5">
        {Icone ? (
          <span
            className="grid size-9 shrink-0 place-items-center rounded-xl"
            style={{
              background: `color-mix(in oklch, ${teinte} 15%, transparent)`,
              color: teinte,
            }}
          >
            <Icone className="size-4.5" aria-hidden />
          </span>
        ) : (
          <span
            aria-hidden
            className="h-5 w-1 shrink-0 rounded-full"
            style={{ background: teinte }}
          />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-bold">{titre}</h2>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
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
  payload?: {
    name?: string;
    value?: number;
    color?: string;
    payload?: { name?: string; color?: string };
  }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-semibold">
        {label ?? payload[0].payload?.name ?? payload[0].name}
      </p>
      {payload.map((entree, index) => (
        <p key={index} className="flex items-center gap-2 tabular-nums">
          <span
            aria-hidden
            className="size-2 rounded-full"
            style={{ background: entree.payload?.color ?? entree.color }}
          />
          {payload.length > 1 ? (
            <span className="text-muted-foreground">{entree.name}</span>
          ) : null}
          <span className="ml-auto font-semibold">{formatNumber(entree.value)}</span>
        </p>
      ))}
    </div>
  );
}

/** Légende des anneaux : la valeur y est aussi lisible que la part. */
function Legende({
  entrees,
}: {
  entrees: { name: string; value: number; color: string }[];
}) {
  const total = entrees.reduce((somme, entree) => somme + entree.value, 0);

  return (
    <ul className="space-y-2">
      {entrees.map((entree) => {
        const part = total > 0 ? (entree.value / total) * 100 : 0;
        return (
          <li key={entree.name} className="text-xs">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: entree.color }}
              />
              <span className="min-w-0 flex-1 truncate">{entree.name}</span>
              <span className="font-semibold tabular-nums">
                {formatNumber(entree.value)}
              </span>
              <span className="w-10 text-right tabular-nums text-muted-foreground">
                {total > 0 ? `${Math.round(part)} %` : "—"}
              </span>
            </div>
            <div className="ml-4.5 mt-1 h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{ width: `${part}%`, background: entree.color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Anneau avec total au centre, et sa légende. */
function Anneau({
  entrees,
  libelleTotal,
}: {
  entrees: { name: string; value: number; color: string }[];
  libelleTotal: string;
}) {
  const total = entrees.reduce((somme, entree) => somme + entree.value, 0);
  return (
    <div className="grid items-center gap-5 sm:grid-cols-[11rem_1fr]">
      <div className="relative mx-auto size-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={entrees}
              dataKey="value"
              nameKey="name"
              innerRadius={54}
              outerRadius={82}
              paddingAngle={3}
              cornerRadius={6}
              strokeWidth={0}
            >
              {entrees.map((entree) => (
                <Cell key={entree.name} fill={entree.color} />
              ))}
            </Pie>
            <Tooltip content={<InfobulleGraphique />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-extrabold tabular-nums">
              {formatNumber(total)}
            </p>
            <p className="text-[11px] text-muted-foreground">{libelleTotal}</p>
          </div>
        </div>
      </div>
      <Legende entrees={entrees} />
    </div>
  );
}

function AucuneDonnee() {
  return (
    <p className="dashed-frame py-12 text-center text-sm text-muted-foreground">
      Aucune donnée à représenter pour l&apos;instant.
    </p>
  );
}

/** Jauge d'engagement : une valeur, éventuellement rapportée à un total. */
function Jauge({
  libelle,
  valeur,
  total,
  couleur,
  icone: Icone,
}: {
  libelle: string;
  valeur: number;
  total?: number;
  couleur: string;
  icone: typeof Users;
}) {
  const part = total ? Math.min(100, (valeur / total) * 100) : undefined;
  return (
    <div className="rounded-2xl border bg-background/60 p-3.5">
      <div className="flex items-center gap-2.5">
        <span
          className="grid size-8 shrink-0 place-items-center rounded-lg"
          style={{
            background: `color-mix(in oklch, ${couleur} 15%, transparent)`,
            color: couleur,
          }}
        >
          <Icone className="size-4" aria-hidden />
        </span>
        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {libelle}
        </p>
      </div>
      <p className="mt-2.5 text-xl font-extrabold tabular-nums">
        {formatNumber(valeur)}
        {total !== undefined ? (
          <span className="text-sm font-medium text-muted-foreground">
            {" "}
            / {formatNumber(total)}
          </span>
        ) : null}
      </p>
      {part !== undefined ? (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${part}%`, background: couleur }}
          />
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------ */

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [series, setSeries] = useState<CleSerie[]>([
    "inscriptions",
    "publications",
    "retours",
  ]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "statistics"],
    queryFn: adminApi.statistics,
  });

  const { data: desagregation } = useQuery({
    queryKey: ["admin", "disaggregation"],
    queryFn: adminApi.disaggregation,
  });

  const { data: rapport } = useQuery({
    queryKey: ["admin", "rapport", 12],
    queryFn: () => adminApi.rapport(12),
  });

  const { data: types = [] } = useQuery({
    queryKey: ["types-offres"],
    queryFn: () => typesOffresApi.list(),
    staleTime: 5 * 60 * 1000,
  });

  const aTraiter = useConsoleATraiter();

  const evolution = (rapport?.evolution ?? []).map((ligne) => ({
    ...ligne,
    libelle: moisCourt(ligne.mois),
  }));
  const tendance = (cle: CleSerie) =>
    evolution.slice(-8).map((ligne) => ligne[cle]);

  // Les statistiques sont indexées par code de type ; libellé et couleur
  // viennent de la définition administrée, pour se lire comme les pastilles.
  const offresParType = Object.entries(stats?.offresByType ?? {})
    .map(([code, compte]) => {
      const style = styleType(
        types.find((type) => type.code === code),
        code,
      );
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
        .map((entree, index) => ({
          ...entree,
          color: COULEURS_SEXE[index % COULEURS_SEXE.length],
        }))
        .filter((entree) => entree.value > 0)
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

  const parRole = (Object.keys(ROLE_LABELS) as Role[])
    .map((role) => ({
      name: ROLE_LABELS[role],
      value: rapport?.utilisateursParRole[role] ?? 0,
      color: COULEURS_ROLE[role],
    }))
    .filter((entree) => entree.value > 0);

  const parModeration = Object.entries(rapport?.offresParStatut ?? {}).map(
    ([statut, total]) => ({
      name: STATUT_MODERATION[statut]?.libelle ?? statut,
      value: total,
      color: STATUT_MODERATION[statut]?.couleur ?? "var(--muted-foreground)",
    }),
  );

  const engagement = rapport?.engagement;
  const aujourdhui = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* Accueil */}
      <section className="entree relative mb-6 overflow-hidden rounded-3xl p-6 text-white shadow-lg shadow-black/5 sm:p-8">
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(125deg, oklch(0.32 0.06 255) 0%, oklch(0.4 0.1 252) 60%, oklch(0.48 0.12 248) 100%)",
          }}
        />
        <span
          aria-hidden
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(oklch(1 0 0 / 0.25) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            maskImage: "linear-gradient(90deg, transparent 30%, black)",
            WebkitMaskImage: "linear-gradient(90deg, transparent 30%, black)",
          }}
        />
        <span
          aria-hidden
          className="absolute -right-10 -top-20 size-72 rounded-full bg-white/8 blur-3xl"
        />
        <span
          aria-hidden
          className="absolute -bottom-28 left-1/3 size-72 rounded-full bg-[var(--c-sky)] opacity-15 blur-3xl"
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-sm font-medium capitalize text-white/80">
              <CalendarDays className="size-4" aria-hidden />
              {aujourdhui}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {salutation()}
              {user?.firstName ? `, ${user.firstName}` : ""}
            </h1>
            <p className="mt-2 text-pretty text-white/85">
              {aTraiter.total > 0 ? (
                <>
                  <strong>{aTraiter.total}</strong> élément
                  {aTraiter.total > 1 ? "s attendent" : " attend"} votre
                  décision. Voici l&apos;activité de la plateforme Noken.
                </>
              ) : (
                <>
                  Rien n&apos;attend votre décision. Voici l&apos;activité de la
                  plateforme Noken.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {CONSOLE_ACTIONS.slice(0, 3).map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-sm font-semibold ring-1 ring-inset ring-white/25 backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white/25"
              >
                <action.icon className="size-4" aria-hidden />
                {action.label}
              </Link>
            ))}
            <Link
              href="/admin/statistiques"
              className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-bold text-[oklch(0.36_0.08_255)] shadow-lg transition-all hover:-translate-y-0.5"
            >
              <BarChart3 className="size-4" aria-hidden />
              Rapport complet
            </Link>
          </div>
        </div>
      </section>

      {/* Mesures */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
              teinte="var(--c-blue)"
              href="/admin/utilisateurs"
              tendance={tendance("inscriptions")}
            />
            <TuileMesure
              index={1}
              label="Offres"
              valeur={stats?.totals.offres ?? 0}
              variation={stats?.thisMonth.newOffres}
              icone={Briefcase}
              teinte="var(--c-emerald)"
              href="/admin/offres"
              tendance={tendance("publications")}
            />
            <TuileMesure
              index={2}
              label="Retours"
              valeur={stats?.totals.retours ?? 0}
              variation={stats?.thisMonth.newRetours}
              icone={MessageSquare}
              teinte="var(--c-orange)"
              tendance={tendance("retours")}
            />
            <TuileMesure
              index={3}
              label="Profils en situation de handicap"
              valeur={desagregation?.handicap.avec ?? 0}
              icone={Accessibility}
              teinte="var(--c-cyan)"
              note={
                desagregation?.handicap.total
                  ? `${Math.round(
                      (desagregation.handicap.avec / desagregation.handicap.total) * 100,
                    )} % des profils renseignés`
                  : undefined
              }
            />
          </>
        )}
      </section>

      {/* Activité et à traiter */}
      <div className="mb-6 grid gap-4 xl:grid-cols-3">
        <Carte
          index={0}
          className="xl:col-span-2"
          titre="Activité des 12 derniers mois"
          description="Cliquez sur une série pour l'afficher ou la masquer."
          icone={TrendingUp}
          teinte="var(--c-indigo)"
        >
          <div className="mb-4 flex flex-wrap gap-1.5">
            {SERIES.map((serie) => {
              const actif = series.includes(serie.cle);
              return (
                <button
                  key={serie.cle}
                  type="button"
                  aria-pressed={actif}
                  onClick={() =>
                    setSeries((courantes) =>
                      actif
                        ? courantes.filter((cle) => cle !== serie.cle)
                        : [...courantes, serie.cle],
                    )
                  }
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all",
                    actif ? "shadow-sm" : "opacity-50 hover:opacity-80",
                  )}
                  style={
                    actif
                      ? {
                          background: `color-mix(in oklch, ${serie.couleur} 13%, transparent)`,
                          borderColor: `color-mix(in oklch, ${serie.couleur} 35%, transparent)`,
                          color: serie.couleur,
                        }
                      : undefined
                  }
                >
                  <span
                    aria-hidden
                    className="size-2 rounded-full"
                    style={{ background: serie.couleur }}
                  />
                  {serie.libelle}
                  {engagement ? (
                    <span className="tabular-nums opacity-80">
                      {formatNumber(
                        {
                          inscriptions: engagement.inscriptionsPeriode,
                          publications: engagement.publicationsPeriode,
                          retours: engagement.retoursPeriode,
                          favoris: engagement.favorisPeriode,
                          likes: engagement.likesPeriode,
                        }[serie.cle],
                      )}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {evolution.length === 0 ? (
            <AucuneDonnee />
          ) : (
            <ResponsiveContainer width="100%" height={290}>
              <AreaChart data={evolution} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  {SERIES.map((serie) => (
                    <linearGradient
                      key={serie.cle}
                      id={`degrade-${serie.cle}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={serie.couleur} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={serie.couleur} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="4 4"
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="libelle"
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
                  cursor={{ stroke: "var(--border)", strokeWidth: 2 }}
                />
                {SERIES.filter((serie) => series.includes(serie.cle)).map(
                  (serie) => (
                    <Area
                      key={serie.cle}
                      type="monotone"
                      dataKey={serie.cle}
                      name={serie.libelle}
                      stroke={serie.couleur}
                      strokeWidth={2.5}
                      fill={`url(#degrade-${serie.cle})`}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
                    />
                  ),
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Carte>

        <Carte
          index={1}
          titre="À traiter"
          description="Ce qui attend une décision."
          icone={ShieldCheck}
          teinte="var(--c-amber)"
        >
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/admin/moderation"
              className="group rounded-2xl p-4 text-white shadow-md transition-transform hover:-translate-y-0.5"
              style={{
                background:
                  "var(--c-amber)",
              }}
            >
              <ShieldCheck className="size-5 opacity-90" aria-hidden />
              <p className="mt-3 text-3xl font-extrabold tabular-nums">
                {aTraiter.compteurs.validation}
              </p>
              <p className="text-xs font-medium text-white/90">Offres à valider</p>
            </Link>
            <Link
              href="/admin/feedback"
              className="group rounded-2xl p-4 text-white shadow-md transition-transform hover:-translate-y-0.5"
              style={{
                background:
                  "var(--c-rose)",
              }}
            >
              <MessageCircle className="size-5 opacity-90" aria-hidden />
              <p className="mt-3 text-3xl font-extrabold tabular-nums">
                {aTraiter.compteurs.signalements}
              </p>
              <p className="text-xs font-medium text-white/90">
                Signalements ouverts
              </p>
            </Link>
          </div>

          {aTraiter.total === 0 ? (
            <div className="mt-5 flex flex-col items-center py-6 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-[color-mix(in_oklch,var(--c-emerald)_15%,transparent)] text-[var(--c-emerald)]">
                <CheckCircle2 className="size-6" aria-hidden />
              </span>
              <p className="mt-2 text-sm font-semibold">Tout est à jour</p>
              <p className="text-xs text-muted-foreground">
                Aucune décision en attente.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-1">
              {aTraiter.offresEnAttente.slice(0, 4).map((offre) => (
                <li key={`o-${offre.id}`}>
                  <Link
                    href="/admin/moderation"
                    className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-muted/60"
                  >
                    <span className="size-2 shrink-0 rounded-full bg-[var(--c-amber)]" />
                    <span className="min-w-0 flex-1 truncate">{offre.titre}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRelative(offre.datePublication)}
                    </span>
                  </Link>
                </li>
              ))}
              {aTraiter.signalementsOuverts.slice(0, 4).map((feedback) => (
                <li key={`f-${feedback.id}`}>
                  <Link
                    href={`/admin/feedback/${feedback.id}`}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm transition-colors hover:bg-muted/60"
                  >
                    <span className="size-2 shrink-0 rounded-full bg-[var(--c-rose)]" />
                    <span className="min-w-0 flex-1 truncate">{feedback.titre}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRelative(feedback.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </div>

      {/* Engagement */}
      {engagement ? (
        <Carte
          index={2}
          className="mb-6"
          titre="Engagement"
          description="Indicateurs clés de la plateforme, sur les 12 derniers mois pour les actions."
          icone={Heart}
          teinte="var(--c-fuchsia)"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Jauge
              libelle="CV rendus publics"
              valeur={engagement.cvPublics}
              total={engagement.cvTotal}
              couleur="var(--c-violet)"
              icone={FileText}
            />
            <Jauge
              libelle="Offres ouvertes"
              valeur={engagement.offresOuvertes}
              total={stats?.totals.offres}
              couleur="var(--c-emerald)"
              icone={Briefcase}
            />
            <Jauge
              libelle="Partenaires"
              valeur={engagement.partenaires}
              couleur="var(--c-lime)"
              icone={Handshake}
            />
            <Jauge
              libelle="Inscriptions (12 mois)"
              valeur={engagement.inscriptionsPeriode}
              couleur="var(--c-indigo)"
              icone={Users}
            />
            <Jauge
              libelle="Favoris (12 mois)"
              valeur={engagement.favorisPeriode}
              couleur="var(--c-fuchsia)"
              icone={Star}
            />
            <Jauge
              libelle="J'aime (12 mois)"
              valeur={engagement.likesPeriode}
              couleur="var(--c-sky)"
              icone={Heart}
            />
          </div>
        </Carte>
      ) : null}

      {/* Répartitions */}
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <Carte
          index={3}
          titre="Offres par type"
          teinte="var(--c-emerald)"
          description="Répartition du catalogue selon les types administrés."
        >
          {offresParType.length === 0 ? (
            <AucuneDonnee />
          ) : (
            <Anneau entrees={offresParType} libelleTotal="offres" />
          )}
        </Carte>

        <Carte
          index={4}
          titre="Offres par statut de validation"
          teinte="var(--c-amber)"
          description="Publiées, en attente ou refusées."
        >
          {parModeration.length === 0 ? (
            <AucuneDonnee />
          ) : (
            <Anneau entrees={parModeration} libelleTotal="offres" />
          )}
        </Carte>

        <Carte
          index={5}
          titre="Comptes par rôle"
          teinte="var(--c-violet)"
          description="Membres, partenaires et administrateurs."
        >
          {parRole.length === 0 ? (
            <AucuneDonnee />
          ) : (
            <Anneau entrees={parRole} libelleTotal="comptes" />
          )}
        </Carte>

        <Carte
          index={6}
          titre="Répartition par sexe"
          teinte="var(--c-fuchsia)"
          description="Sur les profils ayant renseigné l'information."
        >
          {parSexe.length === 0 ? (
            <AucuneDonnee />
          ) : (
            <Anneau entrees={parSexe} libelleTotal="profils" />
          )}
        </Carte>

        <Carte index={7} titre="Tranches d'âge" teinte="var(--c-indigo)">
          {parAge.length === 0 ? (
            <AucuneDonnee />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={parAge} margin={{ left: -20 }}>
                <defs>
                  <linearGradient id="degrade-age" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--c-sky)" />
                    <stop offset="100%" stopColor="var(--c-indigo)" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--border)" />
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
                <Bar dataKey="value" fill="url(#degrade-age)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Carte>

        <Carte
          index={8}
          titre="Statut professionnel"
          teinte="var(--c-orange)"
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
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {parStatut.map((entree) => (
                    <Cell key={entree.name} fill={entree.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Carte>

        <Carte
          index={9}
          titre="Régions les plus représentées"
          teinte="var(--c-cyan)"
          description="Huit premières régions renseignées."
        >
          {parRegion.length === 0 ? (
            <AucuneDonnee />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={parRegion} layout="vertical" margin={{ left: 30 }}>
                <defs>
                  <linearGradient id="degrade-region" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--c-teal)" />
                    <stop offset="100%" stopColor="var(--c-cyan)" />
                  </linearGradient>
                </defs>
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
                <Bar dataKey="value" fill="url(#degrade-region)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Carte>

        <Carte
          index={10}
          className="2xl:col-span-2"
          titre="Offres les plus commentées"
          teinte="var(--c-rose)"
          description="Là où la discussion se concentre."
        >
          {!stats?.topOffres?.length ? (
            <AucuneDonnee />
          ) : (
            <ol className="grid gap-1 md:grid-cols-2">
              {stats.topOffres.slice(0, 6).map((offre, rang) => {
                const max = stats.topOffres[0]?.retoursCount || 1;
                return (
                  <li key={offre.id}>
                    <Link
                      href={`/offres/${offre.id}`}
                      className="group flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm transition-colors hover:bg-muted/60"
                    >
                      <span
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold tabular-nums",
                          rang < 3 ? "text-white" : "bg-muted text-muted-foreground",
                        )}
                        style={
                          rang < 3
                            ? {
                                background: [
                                  "var(--c-amber)",
                                  "var(--c-sky)",
                                  "var(--c-orange)",
                                ][rang],
                              }
                            : undefined
                        }
                      >
                        {rang + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate group-hover:underline">
                          {offre.titre}
                        </span>
                        <span className="mt-1 block h-1 overflow-hidden rounded-full bg-muted">
                          <span
                            className="block h-full rounded-full bg-[var(--c-rose)]"
                            style={{ width: `${(offre.retoursCount / max) * 100}%` }}
                          />
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                        {formatNumber(offre.retoursCount)} retour
                        {offre.retoursCount > 1 ? "s" : ""}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </Carte>
      </div>

      {/* Raccourcis */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Toutes les rubriques
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {[...CONSOLE_GROUPES.flatMap((groupe) => groupe.items).slice(1), ...CONSOLE_ACTIONS].map(
            (item, index) => (
              <Link
                key={item.href}
                href={item.href}
                style={{ "--i": index } as React.CSSProperties}
                className="entree group flex items-center gap-3 rounded-2xl border bg-card p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-xl text-white transition-transform group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${item.teinte}, color-mix(in oklch, ${item.teinte} 60%, black))`,
                  }}
                >
                  <item.icon className="size-4.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {item.label}
                  </span>
                  {item.resume ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.resume}
                    </span>
                  ) : null}
                </span>
                <ArrowUpRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                  aria-hidden
                />
              </Link>
            ),
          )}
        </div>
      </section>

      <div className="mt-6 flex justify-end">
        <Button
          variant="outline"
          className="rounded-xl"
          render={<Link href="/admin/statistiques" />}
        >
          <BarChart3 className="size-4" />
          Ouvrir le rapport complet
        </Button>
      </div>
    </>
  );
}
