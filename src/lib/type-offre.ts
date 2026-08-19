import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  Compass,
  FlaskConical,
  Globe2,
  GraduationCap,
  HandHeart,
  Handshake,
  Heart,
  Landmark,
  Laptop,
  Lightbulb,
  Megaphone,
  Mic,
  Plane,
  Rocket,
  Send,
  Sprout,
  Star,
  Stethoscope,
  Target,
  Trophy,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { TYPE_OFFRE_ICONS, TYPE_OFFRE_LABELS } from "./enums";
import { formatDate, formatNumber } from "./format";
import type { ChampTypeOffre, Offre, TypeOffreConnu, TypeOffreDef } from "./types";

/**
 * Présentation des types d'offres.
 *
 * Les types sont créés par l'administrateur : ni leur libellé, ni leur icône, ni
 * leur couleur ne peuvent être connus à la compilation. Ce module résout ces
 * trois éléments à partir de la définition renvoyée par l'API, et retombe sur
 * les valeurs historiques (`lib/enums.ts`) pour les cinq types d'origine quand
 * seule la chaîne du code est disponible — c'est le cas partout où l'API ne
 * renvoie que `typeOffre`.
 */

/**
 * Icônes proposées à l'administrateur. Une liste fermée plutôt qu'un champ
 * libre : le nom saisi doit correspondre à un composant réellement importé,
 * sinon l'icône disparaît silencieusement en production.
 */
export const ICONES_TYPE: Record<string, LucideIcon> = {
  Briefcase,
  GraduationCap,
  Award,
  HandHeart,
  Globe2,
  BookOpen,
  Building2,
  Calendar,
  Compass,
  FlaskConical,
  Handshake,
  Heart,
  Landmark,
  Laptop,
  Lightbulb,
  Megaphone,
  Mic,
  Plane,
  Rocket,
  Send,
  Sprout,
  Star,
  Stethoscope,
  Target,
  Trophy,
  Users,
  Wrench,
};

export const ICONE_NOMS = Object.keys(ICONES_TYPE);

/**
 * Palette proposée à l'administrateur. Les classes sont écrites en toutes
 * lettres : Tailwind analyse le source statiquement et ne génèrerait pas une
 * classe construite par interpolation (`border-${couleur}-200`).
 */
export const COULEURS_TYPE: Record<
  string,
  { libelle: string; badge: string; chart: string; teinte: string }
> = {
  blue: {
    libelle: "Bleu",
    badge:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
    chart: "var(--chart-2)",
    teinte: "oklch(0.62 0.19 252)",
  },
  emerald: {
    libelle: "Vert",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    chart: "var(--chart-3)",
    teinte: "oklch(0.62 0.15 162)",
  },
  violet: {
    libelle: "Violet",
    badge:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300",
    chart: "var(--chart-4)",
    teinte: "oklch(0.58 0.20 295)",
  },
  orange: {
    libelle: "Orange",
    badge:
      "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300",
    chart: "var(--chart-1)",
    teinte: "oklch(0.68 0.17 55)",
  },
  teal: {
    libelle: "Turquoise",
    badge:
      "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300",
    chart: "var(--chart-5)",
    teinte: "oklch(0.62 0.12 195)",
  },
  rose: {
    libelle: "Rose",
    badge:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
    chart: "var(--chart-4)",
    teinte: "oklch(0.63 0.19 15)",
  },
  amber: {
    libelle: "Ambre",
    badge:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    chart: "var(--chart-1)",
    teinte: "oklch(0.75 0.15 80)",
  },
  slate: {
    libelle: "Gris",
    badge: "border-border bg-muted text-muted-foreground",
    chart: "var(--muted-foreground)",
    teinte: "oklch(0.55 0.03 260)",
  },
};

export const COULEUR_NOMS = Object.keys(COULEURS_TYPE);

const COULEUR_DEFAUT = COULEURS_TYPE.slate;

/** Couleurs par défaut des cinq types historiques, quand `couleur` est absente. */
const COULEUR_PAR_CODE: Record<TypeOffreConnu, string> = {
  EMPLOI: "blue",
  FORMATION: "emerald",
  BOURSE: "violet",
  VOLONTARIAT: "orange",
  PROGRAMME: "teal",
};

export interface StyleType {
  libelle: string;
  icone: LucideIcon;
  badge: string;
  chart: string;
  /** Couleur exploitable directement en CSS (dégradés, halos, bordures). */
  teinte: string;
}

/**
 * Style d'un type à partir de sa définition, ou à défaut de son seul code. Le
 * code est toujours disponible ; la définition ne l'est que sur les routes qui
 * incluent le type.
 *
 * Le paramètre n'exige que les quatre attributs d'affichage, et non la
 * définition complète : plusieurs routes n'imbriquent que ceux-là — la fiche
 * utilisateur de la console, par exemple, n'a que faire de la liste des champs
 * pour dessiner une pastille.
 */
export function styleType(
  type?: Pick<TypeOffreDef, "code" | "libelle" | "icone" | "couleur"> | null,
  code?: string | null,
): StyleType {
  const codeEffectif = type?.code ?? code ?? "";
  const connu = codeEffectif as TypeOffreConnu;

  const cleCouleur =
    type?.couleur ?? COULEUR_PAR_CODE[connu] ?? "slate";
  const couleur = COULEURS_TYPE[cleCouleur] ?? COULEUR_DEFAUT;

  const icone =
    (type?.icone ? ICONES_TYPE[type.icone] : undefined) ??
    TYPE_OFFRE_ICONS[connu] ??
    Briefcase;

  return {
    libelle: type?.libelle ?? TYPE_OFFRE_LABELS[connu] ?? codeEffectif ?? "—",
    icone,
    badge: couleur.badge,
    chart: couleur.chart,
    teinte: couleur.teinte,
  };
}

/** Raccourci pour les offres, dont le type peut être présent ou non. */
export function styleOffre(offre: Pick<Offre, "type" | "typeOffre">): StyleType {
  return styleType(offre.type, offre.typeOffre);
}

/**
 * Valeurs de champs à afficher : les définitions du type croisées avec les
 * valeurs saisies. Les champs vides sont écartés, et les définitions retirées
 * depuis la saisie n'apparaissent plus — la valeur reste en base sans être
 * exposée, ce qui la rend récupérable si le champ est rétabli.
 */
/** Rend une valeur de champ lisible, selon la nature déclarée par le type. */
export function formatValeurChamp(champ: ChampTypeOffre, valeur: unknown): string {
  switch (champ.type) {
    case "BOOLEEN":
      return valeur ? "Oui" : "Non";
    case "DATE":
      return formatDate(String(valeur));
    case "NOMBRE":
      return formatNumber(Number(valeur));
    default:
      return String(valeur);
  }
}

export function champsRenseignes(
  offre: Pick<Offre, "type" | "champs">,
): { champ: ChampTypeOffre; valeur: unknown }[] {
  const valeurs = offre.champs ?? {};
  return (offre.type?.champs ?? [])
    .map((champ) => ({ champ, valeur: valeurs[champ.code] }))
    .filter(
      ({ valeur }) => valeur !== undefined && valeur !== null && valeur !== "",
    );
}
