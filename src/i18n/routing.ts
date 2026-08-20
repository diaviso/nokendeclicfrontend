import { defineRouting } from "next-intl/routing";

/**
 * Langues du site public.
 *
 * `as-needed` : le français, langue par défaut, garde ses adresses actuelles
 * (`/offres`), l'anglais vit sous `/en` (`/en/offres`). Aucun lien déjà partagé
 * ne se casse, et la version anglaise reste indexable et partageable — ce qui
 * n'aurait pas été le cas d'une bascule par cookie sur la même adresse.
 *
 * Seules les pages publiques sont traduites. L'espace membre et la console
 * restent hors de ce découpage : ils vivent en dehors du segment `[locale]`,
 * et le middleware ne les intercepte pas.
 */
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
  /*
   * Pas de détection automatique.
   *
   * Activée, elle redirigeait « / » vers « /en » dès que le cookie de langue ou
   * l'en-tête du navigateur disaient « anglais ». Le sélecteur devenait alors
   * à sens unique : cliquer sur « Français » menait à « / », que le middleware
   * renvoyait aussitôt sur « /en ». Impossible de revenir.
   *
   * Elle envoyait par ailleurs sur la version anglaise un visiteur sénégalais
   * dont le téléphone est configuré en anglais — sur un site francophone
   * d'abord, ce n'est pas le bon défaut.
   *
   * La langue est désormais déterminée par la seule adresse : « / » en
   * français, « /en » en anglais, et le sélecteur mène de l'une à l'autre.
   */
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

/** Libellés du sélecteur de langue, dans leur propre langue. */
export const LANGUES: Record<Locale, { nom: string; court: string }> = {
  fr: { nom: "Français", court: "FR" },
  en: { nom: "English", court: "EN" },
};
