"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { jouerCarillon, sonActif } from "@/lib/son-notification";

/**
 * Réception d'une notification alors que l'application est ouverte.
 *
 * Le service worker prévient les onglets ouverts de chaque poussée. On en
 * profite pour deux choses que la notification système ne fait pas : jouer le
 * carillon de la plateforme, et rafraîchir le compteur pour que la pastille
 * suive sans attendre le prochain chargement.
 */
export function EcoutePush() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const surMessage = (evenement: MessageEvent) => {
      const donnees = evenement.data as
        | { type?: string; charge?: { titre?: string; corps?: string } }
        | undefined;
      if (donnees?.type !== "notification-poussee") return;

      if (sonActif()) jouerCarillon();

      void queryClient.invalidateQueries({ queryKey: ["notifications"] });

      if (donnees.charge?.titre) {
        toast(donnees.charge.titre, { description: donnees.charge.corps });
      }
    };

    navigator.serviceWorker.addEventListener("message", surMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", surMessage);
  }, [queryClient]);

  return null;
}
