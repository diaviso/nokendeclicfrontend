import { routing } from "./routing";

/**
 * Liens `hreflang` d'une page traduite.
 *
 * Sans eux, Google traite les deux versions comme deux pages concurrentes et
 * peut n'en indexer qu'une. `x-default` désigne la version servie à qui n'a
 * exprimé aucune préférence — le français, langue du pays.
 *
 * @param chemin chemin sans préfixe de langue, par exemple « /offres »
 */
export function alternatesPour(chemin: string, locale: string) {
  const nettoye = chemin === "/" ? "" : chemin;

  const languages = Object.fromEntries(
    routing.locales.map((autre) => [
      autre,
      autre === routing.defaultLocale ? nettoye || "/" : `/${autre}${nettoye}`,
    ]),
  );

  return {
    canonical:
      locale === routing.defaultLocale ? nettoye || "/" : `/${locale}${nettoye}`,
    languages: { ...languages, "x-default": nettoye || "/" },
  };
}

/** Étiquette de langue attendue par Open Graph. */
export const localeOpenGraph = (locale: string) =>
  locale === "en" ? "en_US" : "fr_SN";
