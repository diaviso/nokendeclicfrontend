"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/**
 * État de connexion réseau.
 *
 * `useSyncExternalStore` plutôt qu'un `useState` initialisé dans un effet :
 * l'état est lu directement de la source, sans rendu supplémentaire ni écart
 * transitoire entre le rendu serveur et le premier rendu client. Le snapshot
 * serveur vaut « en ligne » — le rendu serveur n'a pas de notion de réseau
 * côté client, et supposer l'inverse ferait clignoter un bandeau hors-ligne
 * à chaque chargement.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
