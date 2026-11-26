"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi, offresApi } from "@/lib/api";

/**
 * Ce qui attend une décision dans la console : offres déposées à valider et
 * signalements encore ouverts.
 *
 * Les clés de requête sont celles des pages Validation et Signalements : la
 * pastille du menu et la liste partagent le même cache, et une décision prise
 * sur la page met le compteur à jour sans nouvel appel.
 */
export function useConsoleATraiter(actif = true) {
  const validation = useQuery({
    queryKey: ["admin", "moderation"],
    queryFn: offresApi.enAttente,
    enabled: actif,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });

  const signalements = useQuery({
    queryKey: ["admin", "feedback"],
    queryFn: adminApi.feedbacks,
    enabled: actif,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  });

  const offresEnAttente = validation.data ?? [];
  const signalementsOuverts = (signalements.data ?? []).filter(
    (feedback) => feedback.statut === "OUVERT",
  );

  return {
    offresEnAttente,
    signalementsOuverts,
    compteurs: {
      validation: offresEnAttente.length,
      signalements: signalementsOuverts.length,
    },
    total: offresEnAttente.length + signalementsOuverts.length,
    chargement: validation.isLoading || signalements.isLoading,
  };
}
