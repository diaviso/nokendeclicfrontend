/**
 * Adresse publique du site, utilisée pour les URL canoniques, les métadonnées
 * de partage et les liens absolus construits côté serveur.
 *
 * Définie ici plutôt que dans le layout : les composants qui construisent un
 * lien absolu (partage d'une offre) en ont besoin sans dépendre de `window`,
 * ce qui les rendrait inutilisables au rendu serveur.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://nokendeclic.com";

/** Construit une URL absolue à partir d'un chemin de l'application. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL.replace(/\/+$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
}
