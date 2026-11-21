"use client";

import { useEffect } from "react";

/**
 * Aligne l'attribut `lang` de `<html>` sur la langue de la page.
 *
 * Le gabarit racine ne peut plus lire la langue dans la requête sans rendre
 * tout le site dynamique : il déclare donc le français, langue par défaut. Les
 * pages anglaises corrigent l'attribut à l'affichage, pour les lecteurs d'écran
 * et la traduction automatique du navigateur. Les moteurs de recherche, eux,
 * s'appuient sur les liens `hreflang` déjà posés dans les métadonnées.
 */
export function LangueDocument({ locale }: { locale: string }) {
  useEffect(() => {
    const precedente = document.documentElement.lang;
    document.documentElement.lang = locale;
    return () => {
      document.documentElement.lang = precedente;
    };
  }, [locale]);

  return null;
}
