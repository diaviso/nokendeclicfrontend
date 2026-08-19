import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import fr from "../messages/fr.json";
import en from "../messages/en.json";

/**
 * Catalogues importés statiquement, et non par `import()` construit à la volée.
 *
 * Un chemin calculé (`../messages/${locale}.json`) empêche le bundler de
 * rattacher le fichier au module : en développement, une modification du
 * catalogue n'invalidait rien et les traductions restaient celles du démarrage.
 * Deux langues tiennent sans peine dans le même paquet.
 */
const CATALOGUES = { fr, en } as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const demandee = await requestLocale;
  // Les routes non traduites (espace membre, console) n'ont pas de segment de
  // langue : elles retombent sur le français, ce qui leur suffit.
  const locale = hasLocale(routing.locales, demandee)
    ? demandee
    : routing.defaultLocale;

  return { locale, messages: CATALOGUES[locale] };
});
