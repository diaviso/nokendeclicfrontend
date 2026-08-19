"use client";

import { useSyncExternalStore } from "react";

interface EvenementInstallation extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Accès partagé à l'invite d'installation du navigateur.
 *
 * `beforeinstallprompt` n'est émis **qu'une seule fois** par chargement de
 * page. Si deux composants l'écoutaient chacun de leur côté, le premier à
 * appeler `preventDefault()` priverait l'autre de l'événement — la bannière
 * flottante et la section de la page d'accueil s'excluraient mutuellement.
 * L'événement est donc capté une fois pour toutes ici, et redistribué.
 *
 * L'état vit hors de React : l'événement peut survenir avant le montage du
 * premier composant qui s'y intéresse.
 */
let differe: EvenementInstallation | null = null;
let installee = false;
let brancher = false;
const abonnes = new Set<() => void>();

function prevenir() {
  for (const abonne of abonnes) abonne();
}

function brancherEcouteurs() {
  if (brancher || typeof window === "undefined") return;
  brancher = true;

  // Déjà installée : l'application tourne dans sa propre fenêtre.
  installee = window.matchMedia("(display-mode: standalone)").matches;

  window.addEventListener("beforeinstallprompt", (evenement) => {
    // Empêche la bannière native, qui surgit sans contexte : c'est nous qui
    // choisissons le moment et la formulation.
    evenement.preventDefault();
    differe = evenement as EvenementInstallation;
    prevenir();
  });

  window.addEventListener("appinstalled", () => {
    installee = true;
    differe = null;
    prevenir();
  });
}

function souscrire(abonne: () => void) {
  brancherEcouteurs();
  abonnes.add(abonne);
  return () => {
    abonnes.delete(abonne);
  };
}

/**
 * Instantané sérialisé.
 *
 * `useSyncExternalStore` compare les instantanés par identité : renvoyer un
 * objet neuf à chaque appel provoquerait une boucle de rendu. Une chaîne est
 * stable tant que l'état ne change pas.
 */
function instantane(): string {
  return `${differe ? "1" : "0"}|${installee ? "1" : "0"}`;
}

function instantaneServeur(): string {
  return "0|0";
}

/** iOS n'implémente pas `beforeinstallprompt` : l'ajout se fait à la main. */
function estIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS se présente comme un Mac, mais avec un écran tactile.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function useInstallation() {
  const etat = useSyncExternalStore(souscrire, instantane, instantaneServeur);
  const [aInvite, estInstallee] = etat.split("|");

  return {
    /** Le navigateur peut déclencher l'installation immédiatement. */
    invitePrete: aInvite === "1",
    installee: estInstallee === "1",
    /** Sur iOS, seule la marche à suivre manuelle est possible. */
    ios: estIOS(),

    /**
     * Déclenche l'invite. Renvoie `true` si l'utilisateur a accepté.
     * Ne fait rien si aucune invite n'est disponible.
     */
    async installer(): Promise<boolean> {
      if (!differe) return false;
      await differe.prompt();
      const { outcome } = await differe.userChoice;
      // L'invite n'est utilisable qu'une fois.
      differe = null;
      prevenir();
      return outcome === "accepted";
    },
  };
}
