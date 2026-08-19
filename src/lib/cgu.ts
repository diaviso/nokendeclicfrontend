/**
 * Conditions générales d'utilisation.
 *
 * Le texte vit hors des pages : il est lu par la page publique, par la case à
 * cocher de l'inscription et par la boîte d'acceptation, sans être recopié
 * trois fois. Chaque langue a son fichier dans `cgu-contenu/`.
 *
 * ⚠️ Le français fait foi. La traduction anglaise est fournie par courtoisie et
 * le dit elle-même à son article 14 : c'est la version française qui est
 * acceptée à l'inscription, dont le numéro est consigné en base, et qui
 * s'applique en cas de divergence.
 */
import type { ArticleLegal } from "./legal-types";
import { ARTICLES_FR, POINTS_CLES_FR } from "./cgu-contenu/fr";
import { ARTICLES_EN, POINTS_CLES_EN } from "./cgu-contenu/en";

/**
 * Doit rester identique à `CGU_VERSION` côté serveur
 * (`src/common/constants/cgu.ts`). Le serveur fait foi : c'est lui qui consigne
 * la version acceptée. Cette valeur ne sert qu'à l'affichage.
 */
export const CGU_VERSION = "1.0";

/** Date d'entrée en vigueur, écrite dans la langue de lecture. */
export const CGU_ENTREE_EN_VIGUEUR: Record<string, string> = {
  fr: "18 août 2026",
  en: "18 August 2026",
};

/** Même forme que les autres documents légaux. */
export type ArticleCgu = ArticleLegal;

/** Articles dans la langue demandée ; le français sert de repli. */
export function articlesCgu(locale: string): ArticleCgu[] {
  return locale === "en" ? ARTICLES_EN : ARTICLES_FR;
}

/** Résumé affiché avant l'accord. */
export function pointsClesCgu(locale: string): string[] {
  return locale === "en" ? POINTS_CLES_EN : POINTS_CLES_FR;
}

export function entreeEnVigueur(locale: string): string {
  return CGU_ENTREE_EN_VIGUEUR[locale] ?? CGU_ENTREE_EN_VIGUEUR.fr;
}
