"use client";

import { NextIntlClientProvider } from "next-intl";
import type { ComponentProps } from "react";

/**
 * Fournisseur de traductions, importé depuis un module client.
 *
 * Rendu depuis un composant serveur, `NextIntlClientProvider` complète de
 * lui-même les réglages absents (formats, fuseau, `now`) en interrogeant la
 * configuration de la requête — qui lit les en-têtes faute de langue fixée.
 * Dans le gabarit racine, cela suffisait à rendre **toutes** les pages
 * dynamiques : espace membre et console étaient recalculés sur le serveur à
 * chaque visite, et c'est ce qui a épuisé le quota de calcul Vercel.
 *
 * Importé ici, c'est la variante client qui est utilisée : elle prend ses
 * réglages tels qu'on les lui passe et ne lit rien de la requête. Le fuseau
 * doit donc être fourni explicitement (voir `FUSEAU`).
 */
export function FournisseurIntl(
  props: ComponentProps<typeof NextIntlClientProvider>,
) {
  return <NextIntlClientProvider {...props} />;
}

/**
 * Fuseau de référence pour formater les dates.
 *
 * Le Sénégal est à UTC+0 toute l'année, comme les serveurs Vercel : les dates
 * s'affichent exactement comme avant, et le rendu serveur concorde avec celui
 * du navigateur.
 */
export const FUSEAU = "Africa/Dakar";
