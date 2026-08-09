import {
  Award,
  Briefcase,
  Globe,
  GraduationCap,
  HandHeart,
  type LucideIcon,
} from "lucide-react";
import type { Sexe, StatutProfessionnel, TypeOffre } from "@/types";

/**
 * Source unique de vérité pour l'affichage des énumérations métier.
 *
 * Ces tables étaient auparavant redéfinies dans 9 fichiers. Un oubli lors de
 * l'ajout du type PROGRAMME a provoqué une page blanche en production
 * (commit 9cf5d0e, « fixes React #130 blank page »).
 *
 * Le typage en `Record<TypeOffre, …>` — et non `Record<string, …>` — est
 * l'élément essentiel : à l'ajout d'une valeur dans l'énumération, la
 * compilation échoue sur chaque table incomplète au lieu de produire un
 * `undefined` silencieux à l'exécution.
 */

export const TYPE_OFFRE_LABELS: Record<TypeOffre, string> = {
  EMPLOI: "Emploi",
  FORMATION: "Formation",
  BOURSE: "Bourse",
  VOLONTARIAT: "Volontariat",
  PROGRAMME: "Programme",
};

export const TYPE_OFFRE_ICONS: Record<TypeOffre, LucideIcon> = {
  EMPLOI: Briefcase,
  FORMATION: GraduationCap,
  BOURSE: Award,
  VOLONTARIAT: HandHeart,
  PROGRAMME: Globe,
};

/** Badge de type d'offre, avec variantes sombres. */
export const TYPE_OFFRE_BADGE: Record<TypeOffre, string> = {
  EMPLOI: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  FORMATION: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  BOURSE: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  VOLONTARIAT: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  PROGRAMME: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
};

/** Dégradés utilisés par la page d'accueil. */
export const TYPE_OFFRE_GRADIENT: Record<TypeOffre, string> = {
  EMPLOI: "from-blue-500 to-blue-600",
  FORMATION: "from-emerald-500 to-emerald-600",
  BOURSE: "from-amber-500 to-amber-600",
  VOLONTARIAT: "from-orange-500 to-orange-600",
  PROGRAMME: "from-teal-500 to-teal-600",
};

/** Couleurs hexadécimales pour les graphiques Recharts. */
export const TYPE_OFFRE_CHART_COLORS: Record<TypeOffre, string> = {
  EMPLOI: "#3B82F6",
  FORMATION: "#10B981",
  BOURSE: "#8B5CF6",
  VOLONTARIAT: "#F59E0B",
  PROGRAMME: "#14B8A6",
};

export const STATUT_PROFESSIONNEL_LABELS: Record<StatutProfessionnel, string> = {
  NON_PRECISE: "Non précisé",
  EN_RECHERCHE: "En recherche",
  EN_POSTE: "En poste",
  ETUDIANT: "Étudiant",
  FREELANCE: "Freelance",
  CHOMAGE: "Chômage",
  RECONVERSION: "Reconversion",
};

export const STATUT_PROFESSIONNEL_CHART_COLORS: Record<StatutProfessionnel, string> = {
  NON_PRECISE: "#9CA3AF",
  EN_RECHERCHE: "#EF4444",
  EN_POSTE: "#10B981",
  ETUDIANT: "#3B82F6",
  FREELANCE: "#F59E0B",
  CHOMAGE: "#6B7280",
  RECONVERSION: "#8B5CF6",
};

export const SEXE_LABELS: Record<Sexe, string> = {
  HOMME: "Homme",
  FEMME: "Femme",
  AUTRE: "Autre",
  NON_PRECISE: "Non précisé",
};

/**
 * Accès tolérant pour les valeurs venant du réseau : l'API peut renvoyer une
 * valeur inconnue du front (désynchronisation de version). On retombe alors sur
 * la valeur brute plutôt que d'afficher « undefined ».
 */
export function typeOffreLabel(type: string | null | undefined): string {
  if (!type) return "—";
  return TYPE_OFFRE_LABELS[type as TypeOffre] ?? type;
}

export function statutProfessionnelLabel(statut: string | null | undefined): string {
  if (!statut) return "Non précisé";
  return STATUT_PROFESSIONNEL_LABELS[statut as StatutProfessionnel] ?? statut;
}

export function sexeLabel(sexe: string | null | undefined): string {
  if (!sexe) return "Non précisé";
  return SEXE_LABELS[sexe as Sexe] ?? sexe;
}
