/**
 * Politique de confidentialité.
 *
 * Même organisation que les conditions d'utilisation : le texte vit hors des
 * pages, une langue par fichier, et le français fait foi.
 *
 * ⚠️ À faire relire par un juriste avant mise en production, au regard de la loi
 * sénégalaise n° 2008-12 et des obligations déclaratives auprès de la CDP.
 */
import type { ArticleLegal } from "./legal-types";
import { ARTICLES_FR } from "./politique-contenu/fr";
import { ARTICLES_EN } from "./politique-contenu/en";

export const POLITIQUE_VERSION = "1.0";

/** Date de dernière mise à jour, écrite dans la langue de lecture. */
export const POLITIQUE_MISE_A_JOUR: Record<string, string> = {
  fr: "19 août 2026",
  en: "19 August 2026",
};

/** Articles dans la langue demandée ; le français sert de repli. */
export function articlesPolitique(locale: string): ArticleLegal[] {
  return locale === "en" ? ARTICLES_EN : ARTICLES_FR;
}

export function politiqueMiseAJour(locale: string): string {
  return POLITIQUE_MISE_A_JOUR[locale] ?? POLITIQUE_MISE_A_JOUR.fr;
}
