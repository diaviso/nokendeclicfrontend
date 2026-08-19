import { api } from "./client";
import type { CVCandidat, PaginatedResponse, ProfilClasse, StatutProfessionnel } from "../types";

/** Critères de recherche d'un profil, tous facultatifs. */
export interface RechercheProfils {
  q?: string;
  competences?: string[];
  langue?: string;
  localisation?: string;
  statutProfessionnel?: StatutProfessionnel;
  page?: number;
  limit?: number;
}

function toQuery(filtres: RechercheProfils): string {
  const params = new URLSearchParams();

  for (const [cle, valeur] of Object.entries(filtres)) {
    if (valeur === undefined || valeur === null || valeur === "") continue;
    // Les compétences partent en une seule valeur séparée par des virgules :
    // c'est la forme que le lien partagé porte, et le serveur accepte les deux.
    params.set(cle, Array.isArray(valeur) ? valeur.join(",") : String(valeur));
  }

  const chaine = params.toString();
  return chaine ? `?${chaine}` : "";
}

/**
 * Sourcing de candidats — réservé aux partenaires et à l'administration.
 * Aucune réponse ne comporte de coordonnées directes.
 */
export const profilsApi = {
  async rechercher(filtres: RechercheProfils = {}) {
    const { data } = await api.get<PaginatedResponse<ProfilClasse>>(
      `/api/profils${toQuery(filtres)}`,
    );
    return data;
  },

  /** Compétences présentes dans le vivier, les plus portées d'abord. */
  async competences() {
    const { data } = await api.get<{ libelle: string; total: number }[]>(
      "/api/profils/competences",
    );
    return data;
  },

  async byUserId(userId: number) {
    const { data } = await api.get<CVCandidat>(`/api/profils/${userId}`);
    return data;
  },
};
