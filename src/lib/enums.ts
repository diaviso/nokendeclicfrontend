import {
  Award,
  Briefcase,
  Globe2,
  GraduationCap,
  HandHeart,
  type LucideIcon,
} from "lucide-react";
import type {
  FeedbackCategory,
  FeedbackPriority,
  FeedbackStatus,
  NiveauExperience,
  Role,
  Secteur,
  Sexe,
  StatutProfessionnel,
  TypeEmploi,
  TypeOffreConnu,
} from "./types";

/**
 * Source unique de vérité pour l'affichage des énumérations métier.
 *
 * Toutes les tables sont typées `Record<Union, …>` et non `Record<string, …>` :
 * à l'ajout d'une valeur dans une énumération, la compilation échoue sur chaque
 * table incomplète. C'est délibéré — dans l'ancien front, ces tables étaient
 * dupliquées dans 9 fichiers et typées `Record<string, …>`, ce qui avait laissé
 * passer un oubli jusqu'en production (page blanche à l'ajout du type PROGRAMME).
 */

export const TYPE_OFFRE_LABELS: Record<TypeOffreConnu, string> = {
  EMPLOI: "Emploi",
  FORMATION: "Formation",
  BOURSE: "Bourse",
  VOLONTARIAT: "Volontariat",
  PROGRAMME: "Programme",
};

export const TYPE_OFFRE_ICONS: Record<TypeOffreConnu, LucideIcon> = {
  EMPLOI: Briefcase,
  FORMATION: GraduationCap,
  BOURSE: Award,
  VOLONTARIAT: HandHeart,
  PROGRAMME: Globe2,
};

/** Pastilles de type — bordure fine plutôt que fond saturé (registre Cloudflare). */
export const TYPE_OFFRE_BADGE: Record<TypeOffreConnu, string> = {
  EMPLOI:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
  FORMATION:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  BOURSE:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300",
  VOLONTARIAT:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300",
  PROGRAMME:
    "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-300",
};

/** Couleurs de graphiques — alignées sur les tokens --chart-*. */
export const TYPE_OFFRE_CHART_COLORS: Record<TypeOffreConnu, string> = {
  EMPLOI: "var(--chart-2)",
  FORMATION: "var(--chart-3)",
  BOURSE: "var(--chart-4)",
  VOLONTARIAT: "var(--chart-1)",
  PROGRAMME: "var(--chart-5)",
};

export const TYPE_EMPLOI_LABELS: Record<TypeEmploi, string> = {
  CDI: "CDI",
  CDD: "CDD",
  STAGE: "Stage",
  ALTERNANCE: "Alternance",
  FREELANCE: "Freelance",
  INTERIM: "Intérim",
  SAISONNIER: "Saisonnier",
  TEMPS_PARTIEL: "Temps partiel",
  TEMPS_PLEIN: "Temps plein",
};

export const SECTEUR_LABELS: Record<Secteur, string> = {
  INFORMATIQUE: "Informatique",
  FINANCE: "Finance",
  SANTE: "Santé",
  EDUCATION: "Éducation",
  COMMERCE: "Commerce",
  INDUSTRIE: "Industrie",
  AGRICULTURE: "Agriculture",
  TOURISME: "Tourisme",
  TRANSPORT: "Transport",
  COMMUNICATION: "Communication",
  ADMINISTRATION: "Administration",
  ARTISANAT: "Artisanat",
  CONSTRUCTION: "Construction",
  ENERGIE: "Énergie",
  ENVIRONNEMENT: "Environnement",
  JURIDIQUE: "Juridique",
  MARKETING: "Marketing",
  RESSOURCES_HUMAINES: "Ressources humaines",
  RECHERCHE: "Recherche",
  AUTRE: "Autre",
};

export const NIVEAU_EXPERIENCE_LABELS: Record<NiveauExperience, string> = {
  DEBUTANT: "Débutant",
  JUNIOR: "Junior",
  CONFIRME: "Confirmé",
  SENIOR: "Senior",
  EXPERT: "Expert",
};

export const STATUT_PROFESSIONNEL_LABELS: Record<StatutProfessionnel, string> = {
  NON_PRECISE: "Non précisé",
  EN_RECHERCHE: "En recherche",
  EN_POSTE: "En poste",
  ETUDIANT: "Étudiant",
  FREELANCE: "Freelance",
  CHOMAGE: "Sans emploi",
  RECONVERSION: "En reconversion",
};

export const STATUT_PROFESSIONNEL_CHART_COLORS: Record<
  StatutProfessionnel,
  string
> = {
  NON_PRECISE: "var(--muted-foreground)",
  EN_RECHERCHE: "var(--chart-1)",
  EN_POSTE: "var(--chart-3)",
  ETUDIANT: "var(--chart-2)",
  FREELANCE: "var(--chart-5)",
  CHOMAGE: "var(--chart-4)",
  RECONVERSION: "var(--chart-4)",
};

export const SEXE_LABELS: Record<Sexe, string> = {
  HOMME: "Homme",
  FEMME: "Femme",
  AUTRE: "Autre",
  NON_PRECISE: "Non précisé",
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrateur",
  PARTENAIRE: "Partenaire",
  MEMBRE: "Membre",
};

export const ROLE_BADGE: Record<Role, string> = {
  ADMIN:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
  PARTENAIRE:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300",
  MEMBRE:
    "border-border bg-muted text-muted-foreground",
};

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  BUG: "Anomalie",
  AMELIORATION: "Amélioration",
  QUESTION: "Question",
  AUTRE: "Autre",
};

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  OUVERT: "Ouvert",
  EN_COURS: "En cours",
  RESOLU: "Résolu",
  FERME: "Fermé",
};

export const FEEDBACK_STATUS_BADGE: Record<FeedbackStatus, string> = {
  OUVERT:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
  EN_COURS:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300",
  RESOLU:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  FERME: "border-border bg-muted text-muted-foreground",
};

export const FEEDBACK_PRIORITY_LABELS: Record<FeedbackPriority, string> = {
  BASSE: "Basse",
  MOYENNE: "Moyenne",
  HAUTE: "Haute",
  CRITIQUE: "Critique",
};

/**
 * Accès tolérant : l'API peut renvoyer une valeur qu'une version plus ancienne
 * du front ne connaît pas. On retombe sur la valeur brute plutôt que d'afficher
 * « undefined ».
 */
function safeLabel<K extends string>(
  table: Record<K, string>,
  value: string | null | undefined,
  fallback = "—",
): string {
  if (!value) return fallback;
  return table[value as K] ?? value;
}

export const typeOffreLabel = (v?: string | null) =>
  safeLabel(TYPE_OFFRE_LABELS, v);
export const typeEmploiLabel = (v?: string | null) =>
  safeLabel(TYPE_EMPLOI_LABELS, v);
export const secteurLabel = (v?: string | null) => safeLabel(SECTEUR_LABELS, v);
export const niveauExperienceLabel = (v?: string | null) =>
  safeLabel(NIVEAU_EXPERIENCE_LABELS, v);
export const statutProfessionnelLabel = (v?: string | null) =>
  safeLabel(STATUT_PROFESSIONNEL_LABELS, v, "Non précisé");
export const sexeLabel = (v?: string | null) =>
  safeLabel(SEXE_LABELS, v, "Non précisé");
export const roleLabel = (v?: string | null) => safeLabel(ROLE_LABELS, v);

export const TYPE_OFFRE_VALUES = Object.keys(TYPE_OFFRE_LABELS) as TypeOffreConnu[];
export const TYPE_EMPLOI_VALUES = Object.keys(
  TYPE_EMPLOI_LABELS,
) as TypeEmploi[];
export const SECTEUR_VALUES = Object.keys(SECTEUR_LABELS) as Secteur[];
export const NIVEAU_EXPERIENCE_VALUES = Object.keys(
  NIVEAU_EXPERIENCE_LABELS,
) as NiveauExperience[];
export const STATUT_PROFESSIONNEL_VALUES = Object.keys(
  STATUT_PROFESSIONNEL_LABELS,
) as StatutProfessionnel[];
