"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "./app-shell";

/** Pages qui gardent leur habillage public, même connecté. */
function resteePublique(pathname: string) {
  const chemin = pathname.replace(/^\/(fr|en)(?=\/|$)/, "") || "/";
  // L'accueil est une vitrine : l'espace a son propre tableau de bord.
  return chemin === "/";
}

/**
 * Habillage des pages publiques.
 *
 * Un visiteur — et le rendu serveur, qui n'a jamais de session — reçoit la
 * page publique : en-tête du site, pied de page, référencement intact. Une
 * fois la session connue, la même page s'affiche dans la coquille de
 * l'espace membre : ouvrir une offre depuis le tableau de bord ne fait plus
 * quitter l'application.
 */
export function BasculeEspace({
  publique,
  children,
}: {
  /** La page dans son habillage public. */
  publique: React.ReactNode;
  /** La page seule, à loger dans l'espace. */
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (resteePublique(pathname)) return <>{publique}</>;
  return <AppShell horsSession={publique}>{children}</AppShell>;
}
