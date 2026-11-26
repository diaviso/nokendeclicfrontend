"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Accessibility,
  BarChart3,
  Briefcase,
  CalendarDays,
  Download,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Heart,
  Layers,
  Loader2,
  Map as MapIcone,
  MapPin,
  MessageSquare,
  PieChart as PieIcone,
  Printer,
  ShieldCheck,
  Star,
  Store,
  ThumbsUp,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CarteRegions } from "@/components/admin/carte-regions";
import { ConsoleHeader } from "@/components/admin/console-header";
import {
  adminApi,
  errorMessage,
  exportsApi,
  typesOffresApi,
  type ExportExcel,
} from "@/lib/api";
import {
  ROLE_LABELS,
  SECTEUR_LABELS,
  STATUT_PROFESSIONNEL_CHART_COLORS,
  STATUT_PROFESSIONNEL_LABELS,
} from "@/lib/enums";
import { styleType } from "@/lib/type-offre";
import { formatNumber } from "@/lib/format";
import type { Role, StatutProfessionnel } from "@/lib/types";

const TEINTE = "var(--c-blue)";

/**
 * Exports proposés depuis cette page.
 *
 * Le rapport suit la période choisie en haut de page ; les listes, elles,
 * sont complètes — un export d'utilisateurs limité à douze mois laisserait
 * de côté les plus anciens inscrits.
 */
const EXPORTS: { nature: ExportExcel; libelle: string; detail: string }[] = [
  {
    nature: "rapport",
    libelle: "Rapport statistique",
    detail: "Les indicateurs de cette page, une feuille chacun, sur la période choisie",
  },
  {
    nature: "utilisateurs",
    libelle: "Utilisateurs",
    detail: "Profil, contact et activité de chaque compte",
  },
  {
    nature: "offres",
    libelle: "Offres",
    detail: "Fiche complète et engagement de chaque offre",
  },
  {
    nature: "questions-assistant",
    libelle: "Questions à l'assistant IA",
    detail: "Toutes les questions posées, avec leur auteur et leurs thèmes",
  },
  {
    nature: "consultations",
    libelle: "Consultations des offres",
    detail: "Qui a consulté quoi et quand, personnes uniques et répétitions",
  },
];

const PERIODES = [
  { mois: 6, libelle: "6 mois" },
  { mois: 12, libelle: "12 mois" },
  { mois: 24, libelle: "24 mois" },
] as const;

const STATUT_MODERATION_LABELS: Record<string, string> = {
  PUBLIEE: "Publiées",
  EN_ATTENTE: "En attente",
  REFUSEE: "Refusées",
};

const STATUT_MODERATION_COULEURS: Record<string, string> = {
  PUBLIEE: "var(--c-emerald)",
  EN_ATTENTE: "var(--c-amber)",
  REFUSEE: "var(--c-rose)",
};

const COULEURS_ROLE: Record<Role, string> = {
  MEMBRE: "var(--c-blue)",
  PARTENAIRE: "var(--c-orange)",
  ADMIN: "var(--c-cyan)",
};

const COULEURS_SEXE = [
  "var(--c-blue)",
  "var(--c-orange)",
  "var(--c-teal)",
  "var(--muted-foreground)",
];

/** `2026-08` → `août 26`, format court qui tient sous un axe. */
function moisCourt(cle: string): string {
  const [annee, mois] = cle.split("-");
  const date = new Date(Number(annee), Number(mois) - 1, 1);
  return date
    .toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })
    .replace(".", "");
}

/**
 * Tuile chiffrée, dans le style de la vue d'ensemble : icône en pastille
 * pleine, halo discret, valeur appuyée. À l'impression, halo et ombre
 * disparaissent pour ne garder que le chiffre.
 */
function Mesure({
  label,
  valeur,
  precision,
  icone: Icone,
  teinte,
  index = 0,
}: {
  label: string;
  valeur: number;
  precision?: string;
  icone: typeof Users;
  teinte: string;
  index?: number;
}) {
  return (
    <div
      style={{ "--i": index } as React.CSSProperties}
      className="entree group relative overflow-hidden rounded-3xl border bg-card p-5 shadow-sm transition-shadow duration-300 hover:shadow-md print:rounded-xl print:shadow-none"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full opacity-15 blur-2xl print:hidden"
        style={{ background: teinte }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <span
          className="grid size-11 shrink-0 place-items-center rounded-2xl text-white shadow-sm transition-transform duration-300 group-hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${teinte}, color-mix(in oklch, ${teinte} 70%, black))`,
          }}
        >
          <Icone className="size-5" aria-hidden />
        </span>
      </div>
      <p className="relative mt-4 text-3xl font-extrabold leading-none tracking-tight tabular-nums">
        {formatNumber(valeur)}
      </p>
      <p className="relative mt-1.5 truncate text-sm font-medium text-muted-foreground">
        {label}
      </p>
      {precision ? (
        <p className="relative mt-0.5 truncate text-xs text-muted-foreground/80">
          {precision}
        </p>
      ) : null}
    </div>
  );
}

function Bloc({
  titre,
  sousTitre,
  large,
  icone: Icone,
  teinte = "var(--primary)",
  children,
}: {
  titre: string;
  sousTitre?: string;
  /** Occupe les deux colonnes : réservé aux séries longues. */
  large?: boolean;
  icone?: typeof Users;
  teinte?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`overflow-hidden rounded-3xl border bg-card shadow-sm print:rounded-xl print:shadow-none ${large ? "lg:col-span-2" : ""} break-inside-avoid`}
    >
      <header className="flex items-center gap-3 px-5 pb-1 pt-5">
        {Icone ? (
          <span
            className="grid size-9 shrink-0 place-items-center rounded-xl"
            style={{
              background: `color-mix(in oklch, ${teinte} 14%, transparent)`,
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
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold">{titre}</h2>
          {sousTitre ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{sousTitre}</p>
          ) : null}
        </div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Squelette affiché pendant le calcul du rapport. */
function SqueletteRapport() {
  return (
    <div className="mx-auto max-w-5xl space-y-4" aria-hidden>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="rounded-3xl border bg-card p-5"
            style={{ opacity: 1 - index * 0.12 }}
          >
            <div className="shimmer size-11 rounded-2xl bg-muted" />
            <div className="shimmer mt-4 h-8 w-24 rounded bg-muted" />
            <div className="shimmer mt-2 h-3 w-28 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-3xl border bg-card p-5">
        <div className="shimmer h-4 w-48 rounded bg-muted" />
        <div className="shimmer mt-5 h-64 rounded-2xl bg-muted" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="rounded-3xl border bg-card p-5">
            <div className="shimmer h-4 w-40 rounded bg-muted" />
            <div className="shimmer mt-5 h-48 rounded-2xl bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Infobulle commune : le style par défaut de Recharts ignore le thème. */
const infobulle = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "0.75rem",
    fontSize: "0.8125rem",
    color: "var(--popover-foreground)",
  },
  labelStyle: { fontWeight: 600, color: "var(--popover-foreground)" },
} as const;

const axe = {
  stroke: "var(--muted-foreground)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
} as const;

/** Espace fine insécable : la ponctuation française devant « % ». */
const FINE = " ";

type Ligne = { nom: string; valeur: number; couleur?: string };
type LignePart = Ligne & { part: number };

/**
 * Ajoute à chaque ligne sa part du total.
 *
 * Le total peut être fourni : plusieurs graphiques n'affichent que les
 * premières catégories, et rapporter chaque valeur à la somme des seules
 * lignes visibles gonflerait les parts jusqu'à faire 100 % d'un extrait. Le
 * dénominateur doit rester l'ensemble mesuré.
 */
function avecParts(lignes: Ligne[], total?: number): LignePart[] {
  const base = total ?? lignes.reduce((somme, ligne) => somme + ligne.valeur, 0);
  return lignes.map((ligne) => ({
    ...ligne,
    part: base > 0 ? (ligne.valeur * 100) / base : 0,
  }));
}

/**
 * Une part se lit à la décimale près sous 10 %, à l'unité au-dessus.
 *
 * Arrondir « 0,4 % » à « 0 % » ferait disparaître une catégorie qui existe
 * pourtant, et afficher « 43,7 % » n'apporte rien à la lecture.
 */
function formatPart(part: unknown): string {
  const valeur = typeof part === "number" ? part : Number(part);
  if (!Number.isFinite(valeur)) return "";
  // Une catégorie qui existe ne doit pas s'afficher « 0 % » : la voir à zéro
  // ferait conclure à son absence.
  if (valeur > 0 && valeur < 0.05) return `< 0,1${FINE}%`;
  if (valeur > 0 && valeur < 10) {
    return `${valeur.toFixed(1).replace(".", ",").replace(",0", "")}${FINE}%`;
  }
  return `${Math.round(valeur)}${FINE}%`;
}

/**
 * Infobulle commune : l'effectif, puis sa part.
 *
 * Recharts ne connaît pas le total de la série ; la part est donc lue sur la
 * ligne elle-même, calculée en amont.
 */
const formatteurInfobulle = (
  valeur: unknown,
  nom: unknown,
  element: unknown,
): [string, string] => {
  const nombre = typeof valeur === "number" ? valeur : Number(valeur);
  const part = (element as { payload?: { part?: number } })?.payload?.part;
  const libelle = Number.isFinite(nombre) ? formatNumber(nombre) : String(valeur);
  return [
    part === undefined ? libelle : `${libelle} — ${formatPart(part)}`,
    String(nom ?? ""),
  ];
};

/**
 * Étiquette d'un secteur de camembert : le nom et sa part.
 *
 * Recharts type ce rappel de façon très large ; la ligne réelle est lue depuis
 * `payload`, où le composant range la donnée d'origine.
 */
const etiquetteCamembert = (entree: unknown): string => {
  const donnee = entree as {
    name?: string;
    payload?: { nom?: string; part?: number };
  };
  const nom = donnee.payload?.nom ?? donnee.name ?? "";
  const part = donnee.payload?.part;
  return part === undefined ? nom : `${nom} · ${formatPart(part)}`;
};

/**
 * Étiquette au bout d'une barre horizontale : l'effectif, puis sa part.
 *
 * Dessinée à la main plutôt que par `formatter` : les deux nombres se lisent
 * mieux avec des graisses différentes, l'effectif appuyé et la part en retrait.
 */
function etiquetteBarre(lignes: LignePart[]) {
  return function Etiquette(entree: unknown) {
    const { x, y, width, height, value, index } = entree as {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      value?: number;
      index?: number;
    };

    if (
      x === undefined ||
      y === undefined ||
      width === undefined ||
      height === undefined
    ) {
      return null;
    }

    // Recharts ne transmet pas la ligne d'origine au rendu d'étiquette, mais
    // son rang : la part se relit donc dans le jeu de données.
    const part = index === undefined ? undefined : lignes[index]?.part;

    return (
      <text
        x={x + width + 8}
        y={y + height / 2}
        dominantBaseline="central"
        fontSize={11}
        fill="var(--muted-foreground)"
      >
        <tspan fontWeight={600} fill="var(--foreground)">
          {formatNumber(value ?? 0)}
        </tspan>
        {part === undefined ? null : (
          <tspan dx={6}>{formatPart(part)}</tspan>
        )}
      </text>
    );
  };
}

/** Sous-titre rappelant sur quoi les parts sont calculées. */
function baseLisible(total: number, unite: string): string {
  return `Parts calculées sur ${formatNumber(total)} ${unite}.`;
}

export default function StatistiquesPage() {
  const [mois, setMois] = useState<number>(12);
  const [exportEnCours, setExportEnCours] = useState<ExportExcel | null>(null);

  /**
   * Télécharge un export. Le fichier arrive du serveur en binaire et est remis
   * au navigateur sous son nom définitif : aucune page intermédiaire, et rien
   * n'est conservé côté client une fois le téléchargement lancé.
   */
  async function exporter(nature: ExportExcel) {
    setExportEnCours(nature);
    try {
      const fichier = await exportsApi.telecharger(
        nature,
        nature === "rapport" ? { mois } : undefined,
      );
      const nom = nature === "rapport" ? `rapport-${mois}-mois` : nature;
      const url = URL.createObjectURL(fichier);
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = `noken-${nom}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Export prêt", {
        description: "Le fichier Excel a été téléchargé.",
      });
    } catch (erreur) {
      toast.error("Export impossible", {
        description:
          erreur instanceof Error && !("isAxiosError" in erreur)
            ? erreur.message
            : errorMessage(erreur),
      });
    } finally {
      setExportEnCours(null);
    }
  }

  const { data: rapport, isLoading } = useQuery({
    queryKey: ["admin", "rapport", mois],
    queryFn: () => adminApi.rapport(mois),
  });

  const { data: stats } = useQuery({
    queryKey: ["admin", "statistics"],
    queryFn: adminApi.statistics,
  });

  const { data: desagregation } = useQuery({
    queryKey: ["admin", "disaggregation"],
    queryFn: adminApi.disaggregation,
  });

  const { data: types = [] } = useQuery({
    queryKey: ["types-offres"],
    queryFn: typesOffresApi.list,
    staleTime: 10 * 60 * 1000,
  });

  const genereLe = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const entete = (
      <div className="print:hidden">
        <ConsoleHeader
          title="Statistiques"
          icon={BarChart3}
          teinte={TEINTE}
          description="Activité de la plateforme sur une période glissante, et composition du public inscrit. Le rapport imprimé reprend l'intégralité de cette page."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label="Période du rapport"
                className="flex gap-0.5 rounded-xl bg-muted/70 p-1"
              >
                {PERIODES.map((periode) => (
                  <button
                    key={periode.mois}
                    type="button"
                    aria-pressed={mois === periode.mois}
                    onClick={() => setMois(periode.mois)}
                    className={`rounded-lg px-3 py-1.5 text-sm transition-all duration-200 ${
                      mois === periode.mois
                        ? "bg-card font-semibold text-foreground shadow-sm"
                        : "font-medium text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {periode.libelle}
                  </button>
                ))}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      disabled={exportEnCours !== null}
                    >
                      {exportEnCours ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Download className="size-4" />
                      )}
                      {exportEnCours ? "Préparation…" : "Exporter en Excel"}
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-80">
                  {EXPORTS.map((choix) => (
                    <DropdownMenuItem
                      key={choix.nature}
                      onClick={() => void exporter(choix.nature)}
                      className="flex items-start gap-2.5 py-2"
                    >
                      <FileSpreadsheet
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          {choix.libelle}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {choix.detail}
                        </span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button className="rounded-xl" onClick={() => window.print()}>
                <Printer className="size-4" />
                Rapport PDF
              </Button>
            </div>
          }
        />
      </div>
  );

  if (isLoading || !rapport) {
    return (
      <>
        {entete}
        <SqueletteRapport />
        <span className="sr-only">Chargement du rapport…</span>
      </>
    );
  }

  const evolution = rapport.evolution.map((ligne) => ({
    ...ligne,
    libelle: moisCourt(ligne.mois),
  }));

  const parRole = avecParts(
    (Object.keys(ROLE_LABELS) as Role[])
      .map((role) => ({
        nom: ROLE_LABELS[role],
        valeur: rapport.utilisateursParRole[role] ?? 0,
        couleur: COULEURS_ROLE[role],
      }))
      .filter((ligne) => ligne.valeur > 0),
  );
  const totalRoles = parRole.reduce((somme, ligne) => somme + ligne.valeur, 0);

  const parStatut = avecParts(
    Object.entries(rapport.offresParStatut).map(([statut, total]) => ({
      nom: STATUT_MODERATION_LABELS[statut] ?? statut,
      valeur: total,
      couleur: STATUT_MODERATION_COULEURS[statut] ?? "var(--muted-foreground)",
    })),
  );

  const parType = avecParts(
    Object.entries(rapport.offresParType)
      .map(([code, total]) => {
        const type = types.find((candidat) => candidat.code === code);
        return {
          nom: type?.libelle ?? code,
          valeur: total,
          couleur: type ? styleType(type).teinte : "var(--muted-foreground)",
        };
      })
      .sort((a, b) => b.valeur - a.valeur),
  );
  const totalTypes = parType.reduce((somme, ligne) => somme + ligne.valeur, 0);

  // « Non précisé » reste dans le graphique et donc au dénominateur : l'écarter
  // ferait passer une minorité déclarée pour une majorité, alors que le
  // silence des autres est justement l'information la plus utile ici.
  const parSexe = desagregation
    ? avecParts(
        [
          { nom: "Femmes", valeur: desagregation.gender.femmes },
          { nom: "Hommes", valeur: desagregation.gender.hommes },
          { nom: "Autre", valeur: desagregation.gender.autres },
          { nom: "Non précisé", valeur: desagregation.gender.nonPrecise },
        ].filter((ligne) => ligne.valeur > 0),
      )
    : [];
  const totalSexe = parSexe.reduce((somme, ligne) => somme + ligne.valeur, 0);

  // Ici au contraire, les dates de naissance manquantes sont exclues du
  // graphique : les parts se rapportent donc aux seuls membres qui l'ont
  // renseignée, ce que le sous-titre doit dire.
  const parAge = desagregation
    ? avecParts(
        Object.entries(desagregation.ageRanges)
          .filter(([tranche]) => tranche !== "Non précisé")
          .map(([tranche, total]) => ({ nom: tranche, valeur: total })),
      )
    : [];
  const totalAge = parAge.reduce((somme, ligne) => somme + ligne.valeur, 0);

  const parStatutPro = desagregation
    ? avecParts(
        Object.entries(desagregation.statutProfessionnel)
          .map(([statut, total]) => ({
            nom:
              STATUT_PROFESSIONNEL_LABELS[statut as StatutProfessionnel] ??
              statut,
            valeur: total,
            couleur:
              STATUT_PROFESSIONNEL_CHART_COLORS[
                statut as StatutProfessionnel
              ] ?? "var(--muted-foreground)",
          }))
          .sort((a, b) => b.valeur - a.valeur),
      )
    : [];
  const totalStatutPro = parStatutPro.reduce(
    (somme, ligne) => somme + ligne.valeur,
    0,
  );

  // Le graphique n'affiche que les huit premiers secteurs, mais les parts se
  // rapportent à l'ensemble : sinon les huit sommeraient à 100 % en ignorant
  // tous les autres.
  const secteursTous = stats?.offresBySecteur ?? [];
  const totalSecteurs = secteursTous.reduce(
    (somme, ligne) => somme + ligne.count,
    0,
  );
  const parSecteur = avecParts(
    secteursTous
      .map((ligne) => ({
        nom:
          SECTEUR_LABELS[ligne.secteur as keyof typeof SECTEUR_LABELS] ??
          ligne.secteur ??
          "Non précisé",
        valeur: ligne.count,
      }))
      .slice(0, 8),
    totalSecteurs,
  );

  // Même précaution que pour les secteurs : dix départements affichés, mais
  // un dénominateur qui couvre tous les membres localisés.
  const departementsTous = desagregation?.departements ?? [];
  const totalDepartements = departementsTous.reduce(
    (somme, ligne) => somme + ligne.count,
    0,
  );
  const departements = avecParts(
    departementsTous
      .slice(0, 10)
      .map((ligne) => ({ nom: ligne.departement, valeur: ligne.count })),
    totalDepartements,
  );

  const handicap = desagregation?.handicap;
  const partHandicap =
    handicap && handicap.total > 0
      ? Math.round((handicap.avec / handicap.total) * 100)
      : 0;

  return (
    <>
      {/* Mise en page d'impression.
          Paysage : les graphiques mesurent leur largeur à l'écran, et une page
          A4 portrait est trop étroite pour les accueillir sans les tronquer.
          Les couleurs de fond sont forcées, sans quoi les aplats des barres
          disparaissent à l'impression. */}
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          html, body {
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .rapport section { break-inside: avoid; }
        }
      `}</style>

      {entete}

      <div className="rapport mx-auto max-w-5xl space-y-4">
        {/* En-tête réservé au document imprimé : sans lui, la page sortie de
            l'imprimante ne dit ni de quoi elle parle ni de quand elle date. */}
        <header className="hidden print:block">
          <h1 className="text-2xl font-bold">
            Noken — Rapport d&apos;activité
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Période de {rapport.periode.mois} mois · document établi le{" "}
            {genereLe}
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Mesure
            label="Comptes"
            valeur={stats?.totals.users ?? 0}
            precision={`+ ${formatNumber(rapport.engagement.inscriptionsPeriode)} sur la période`}
            icone={Users}
            teinte="var(--c-blue)"
            index={0}
          />
          <Mesure
            label="Offres"
            valeur={stats?.totals.offres ?? 0}
            precision={`${formatNumber(rapport.engagement.offresOuvertes)} encore ouvertes`}
            icone={Briefcase}
            teinte="var(--c-emerald)"
            index={1}
          />
          <Mesure
            label="CV renseignés"
            valeur={rapport.engagement.cvTotal}
            precision={`${formatNumber(rapport.engagement.cvPublics)} visibles des recruteurs`}
            icone={FileText}
            teinte="var(--c-indigo)"
            index={2}
          />
          <Mesure
            label="Structures partenaires"
            valeur={rapport.engagement.partenaires}
            precision="Fiches renseignées"
            icone={Store}
            teinte="var(--c-lime)"
            index={3}
          />
        </div>

        <Bloc
          titre="Évolution de l'activité"
            icone={TrendingUp}
            teinte="var(--c-blue)"
          sousTitre={`Inscriptions, publications et retours, mois par mois sur ${rapport.periode.mois} mois.`}
          large
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={evolution}
              margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
            >
              <defs>
                {(
                  [
                    ["inscriptions", "var(--c-blue)"],
                    ["publications", "var(--c-emerald)"],
                    ["retours", "var(--c-orange)"],
                  ] as const
                ).map(([cle, couleur]) => (
                  <linearGradient
                    key={cle}
                    id={`degrade-${cle}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={couleur} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={couleur} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis dataKey="libelle" {...axe} />
              <YAxis allowDecimals={false} width={44} {...axe} />
              <Tooltip {...infobulle} />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: "0.8125rem", paddingTop: 8 }}
              />
              <Area
                type="monotone"
                dataKey="inscriptions"
                name="Inscriptions"
                stroke="var(--c-blue)"
                strokeWidth={2.5}
                fill="url(#degrade-inscriptions)"
                activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
              />
              <Area
                type="monotone"
                dataKey="publications"
                name="Offres publiées"
                stroke="var(--c-emerald)"
                strokeWidth={2.5}
                fill="url(#degrade-publications)"
                activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
              />
              <Area
                type="monotone"
                dataKey="retours"
                name="Retours"
                stroke="var(--c-orange)"
                strokeWidth={2.5}
                fill="url(#degrade-retours)"
                activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Bloc>

        <div className="grid gap-4 lg:grid-cols-2">
          <Bloc
            titre="Répartition des comptes"
            icone={Users}
            teinte="var(--c-blue)"
            sousTitre={`Par rôle. ${baseLisible(totalRoles, "comptes")}`}
          >
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={parRole}
                  dataKey="valeur"
                  nameKey="nom"
                  innerRadius={54}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="none"
                  label={etiquetteCamembert}
                  labelLine={{ stroke: "var(--border)" }}
                  fontSize={12}
                >
                  {parRole.map((ligne) => (
                    <Cell key={ligne.nom} fill={ligne.couleur} />
                  ))}
                </Pie>
                <Tooltip {...infobulle} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "0.8125rem" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Bloc>

          <Bloc
            titre="Offres par état de validation"
            icone={ShieldCheck}
            teinte="var(--c-amber)"
            sousTitre="Les offres des partenaires passent par une relecture avant publication."
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={parStatut}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis dataKey="nom" {...axe} />
                <YAxis allowDecimals={false} width={44} {...axe} />
                <Tooltip {...infobulle} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="valeur" name="Offres" radius={[6, 6, 0, 0]}>
                  {parStatut.map((ligne) => (
                    <Cell key={ligne.nom} fill={ligne.couleur} />
                  ))}
                  <LabelList
                    dataKey="part"
                    position="top"
                    formatter={formatPart}
                    fontSize={11}
                    fill="var(--muted-foreground)"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Bloc>

          <Bloc
            titre="Offres par type"
            icone={Layers}
            teinte="var(--c-emerald)"
            sousTitre={`Toutes périodes confondues. ${baseLisible(totalTypes, "offres")}`}
          >
            <ResponsiveContainer width="100%" height={Math.max(200, parType.length * 34)}>
              <BarChart
                data={parType}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="var(--border)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  domain={[0, (max: number) => Math.ceil(max * 1.22)]}
                  {...axe}
                />
                <YAxis
                  type="category"
                  dataKey="nom"
                  width={128}
                  {...axe}
                />
                <Tooltip
                  {...infobulle}
                  cursor={{ fill: "var(--muted)" }}
                  formatter={formatteurInfobulle}
                />
                <Bar dataKey="valeur" name="Offres" radius={[0, 6, 6, 0]}>
                  {parType.map((ligne) => (
                    <Cell key={ligne.nom} fill={ligne.couleur} />
                  ))}
                  <LabelList position="right" content={etiquetteBarre(parType)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Bloc>

          <Bloc
            titre="Secteurs les plus représentés"
            icone={Briefcase}
            teinte="var(--c-teal)"
            sousTitre={`Les huit premiers. ${baseLisible(totalSecteurs, "offres dont le secteur est renseigné")}`}
          >
            <ResponsiveContainer width="100%" height={Math.max(200, parSecteur.length * 34)}>
              <BarChart
                data={parSecteur}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="var(--border)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  domain={[0, (max: number) => Math.ceil(max * 1.22)]}
                  {...axe}
                />
                <YAxis type="category" dataKey="nom" width={148} {...axe} />
                <Tooltip
                  {...infobulle}
                  cursor={{ fill: "var(--muted)" }}
                  formatter={formatteurInfobulle}
                />
                <Bar
                  dataKey="valeur"
                  name="Offres"
                  fill="var(--c-teal)"
                  radius={[0, 6, 6, 0]}
                >
                  <LabelList position="right" content={etiquetteBarre(parSecteur)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Bloc>

          <Bloc
            titre="Répartition par sexe"
            icone={PieIcone}
            teinte="var(--c-orange)"
            sousTitre={`Déclaré à l'inscription. ${baseLisible(totalSexe, "comptes")}`}
          >
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={parSexe}
                  dataKey="valeur"
                  nameKey="nom"
                  innerRadius={54}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="none"
                  label={etiquetteCamembert}
                  labelLine={{ stroke: "var(--border)" }}
                  fontSize={12}
                >
                  {parSexe.map((ligne, rang) => (
                    <Cell
                      key={ligne.nom}
                      fill={COULEURS_SEXE[rang % COULEURS_SEXE.length]}
                    />
                  ))}
                </Pie>
                <Tooltip {...infobulle} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "0.8125rem" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Bloc>

          <Bloc
            titre="Tranches d'âge"
            icone={CalendarDays}
            teinte="var(--c-sky)"
            sousTitre={`${baseLisible(totalAge, "membres ayant renseigné leur date de naissance")}`}
          >
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={parAge}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis dataKey="nom" {...axe} />
                <YAxis allowDecimals={false} width={44} {...axe} />
                <Tooltip {...infobulle} cursor={{ fill: "var(--muted)" }} />
                <Bar
                  dataKey="valeur"
                  name="Membres"
                  fill="var(--c-sky)"
                  radius={[6, 6, 0, 0]}
                >
                  <LabelList
                    dataKey="part"
                    position="top"
                    formatter={formatPart}
                    fontSize={11}
                    fill="var(--muted-foreground)"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Bloc>

          <Bloc
            titre="Statut professionnel"
            icone={GraduationCap}
            teinte="var(--c-indigo)"
            sousTitre={`Situation déclarée. ${baseLisible(totalStatutPro, "membres")}`}
          >
            <ResponsiveContainer
              width="100%"
              height={Math.max(200, parStatutPro.length * 34)}
            >
              <BarChart
                data={parStatutPro}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="var(--border)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  domain={[0, (max: number) => Math.ceil(max * 1.22)]}
                  {...axe}
                />
                <YAxis type="category" dataKey="nom" width={148} {...axe} />
                <Tooltip
                  {...infobulle}
                  cursor={{ fill: "var(--muted)" }}
                  formatter={formatteurInfobulle}
                />
                <Bar dataKey="valeur" name="Membres" radius={[0, 6, 6, 0]}>
                  {parStatutPro.map((ligne) => (
                    <Cell key={ligne.nom} fill={ligne.couleur} />
                  ))}
                  <LabelList position="right" content={etiquetteBarre(parStatutPro)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Bloc>

          <Bloc
            titre="Situation de handicap"
            icone={Accessibility}
            teinte="var(--c-cyan)"
            sousTitre="Déclaration facultative, utile au suivi de l'inclusion."
          >
            <div className="flex h-[240px] flex-col justify-center gap-4">
              <div className="flex items-baseline gap-3">
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-xl"
                  style={{
                    background:
                      "color-mix(in oklch, var(--c-cyan) 14%, transparent)",
                    color: "var(--c-cyan)",
                  }}
                >
                  <Accessibility className="size-5" aria-hidden />
                </span>
                <p className="text-4xl font-bold tabular-nums">
                  {formatNumber(handicap?.avec ?? 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  membre{(handicap?.avec ?? 0) > 1 ? "s" : ""} ayant déclaré une
                  situation de handicap
                </p>
              </div>

              <div>
                <span
                  className="block h-3 overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={`${partHandicap} % des déclarations`}
                >
                  <span
                    className="block h-full rounded-full transition-[width] duration-700"
                    style={{
                      width: `${Math.max(2, partHandicap)}%`,
                      background: "var(--c-cyan)",
                    }}
                  />
                </span>
                <p className="mt-2 text-sm text-muted-foreground">
                  {partHandicap} % des {formatNumber(handicap?.total ?? 0)}{" "}
                  comptes ayant répondu.
                </p>
              </div>
            </div>
          </Bloc>

          <Bloc
            titre="Répartition géographique"
            icone={MapPin}
            teinte="var(--c-teal)"
            sousTitre="Domicile déclaré par les membres, par région."
            large
          >
            <CarteRegions
              donnees={desagregation?.regions ?? []}
              total={stats?.totals.users ?? 0}
            />
          </Bloc>

          <Bloc
            titre="Départements"
            icone={MapIcone}
            teinte="var(--c-sky)"
            sousTitre={`Les dix premiers. ${baseLisible(totalDepartements, "membres localisés")}`}
          >
            <ResponsiveContainer
              width="100%"
              height={Math.max(200, departements.length * 30)}
            >
              <BarChart
                data={departements}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="var(--border)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  domain={[0, (max: number) => Math.ceil(max * 1.22)]}
                  {...axe}
                />
                <YAxis type="category" dataKey="nom" width={128} {...axe} />
                <Tooltip
                  {...infobulle}
                  cursor={{ fill: "var(--muted)" }}
                  formatter={formatteurInfobulle}
                />
                <Bar
                  dataKey="valeur"
                  name="Membres"
                  fill="var(--c-blue)"
                  radius={[0, 6, 6, 0]}
                >
                  <LabelList position="right" content={etiquetteBarre(departements)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Bloc>
        </div>

        <Bloc
          titre="Engagement sur la période"
            icone={Heart}
            teinte="var(--c-rose)"
          sousTitre={`Gestes des membres sur ${rapport.periode.mois} mois.`}
          large
        >
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Retours déposés",
                valeur: rapport.engagement.retoursPeriode,
                icone: MessageSquare,
                teinte: "var(--c-orange)",
              },
              {
                label: "Offres aimées",
                valeur: rapport.engagement.likesPeriode,
                icone: ThumbsUp,
                teinte: "var(--c-sky)",
              },
              {
                label: "Offres mises en favori",
                valeur: rapport.engagement.favorisPeriode,
                icone: Star,
                teinte: "var(--c-amber)",
              },
              {
                label: "Offres publiées",
                valeur: rapport.engagement.publicationsPeriode,
                icone: Briefcase,
                teinte: "var(--c-emerald)",
              },
            ].map((ligne) => (
              <div
                key={ligne.label}
                className="flex items-center gap-3 rounded-2xl border bg-background/60 p-4"
              >
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-xl"
                  style={{
                    background: `color-mix(in oklch, ${ligne.teinte} 14%, transparent)`,
                    color: ligne.teinte,
                  }}
                >
                  <ligne.icone className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <dd className="text-2xl font-extrabold leading-none tabular-nums">
                    {formatNumber(ligne.valeur)}
                  </dd>
                  <dt className="mt-1 truncate text-xs text-muted-foreground">
                    {ligne.label}
                  </dt>
                </div>
              </div>
            ))}
          </dl>
        </Bloc>

        {stats && stats.topOffres.length > 0 ? (
          <Bloc
            titre="Offres les plus commentées"
            icone={MessageSquare}
            teinte="var(--c-orange)"
            sousTitre="Celles qui suscitent le plus de retours."
            large
          >
            <ol className="grid gap-2 md:grid-cols-2">
              {stats.topOffres.map((offre, rang) => (
                <li
                  key={offre.id}
                  className="flex items-center gap-3 rounded-2xl border bg-background/60 px-4 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold tabular-nums ${
                      rang < 3 ? "text-white" : "bg-muted text-muted-foreground"
                    }`}
                    style={
                      rang < 3
                        ? {
                            background: ["var(--c-amber)", "var(--c-sky)", "var(--c-orange)"][
                              rang
                            ],
                          }
                        : undefined
                    }
                  >
                    {rang + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {offre.titre}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Publiée par {offre.auteur}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatNumber(offre.retoursCount)}
                  </span>
                </li>
              ))}
            </ol>
          </Bloc>
        ) : null}

        <p className="pt-2 text-xs text-muted-foreground">
          Chiffres arrêtés au {genereLe}. Les répartitions par sexe, âge, statut
          et handicap reposent sur des déclarations facultatives : elles portent
          sur les seuls comptes ayant répondu, et non sur l&apos;ensemble des
          inscrits.
        </p>
      </div>
    </>
  );
}
