import { api, serverFetch } from "./client";
import type { ChampTypeOffre, TypeOffreDef } from "../types";

/** Corps accepté par la création / mise à jour d'un type. */
export interface TypeOffrePayload {
  libelle: string;
  description?: string;
  icone?: string;
  couleur?: string;
  ordre?: number;
  estActif?: boolean;
  /**
   * Remplace intégralement la liste des champs. Un champ absent est supprimé
   * côté serveur — c'est bien l'état complet souhaité qui est transmis.
   *
   * Le code d'un champ n'est pas transmis : le serveur le dérive du libellé
   * pour un nouveau champ, et conserve celui déjà en base pour un champ
   * identifié par son `id`. Lui, et lui seul, voit les codes déjà pris.
   */
  champs?: (Omit<ChampTypeOffre, "code"> & { code?: string })[];
}

/** Catalogue public : types actifs uniquement, avec leurs champs. */
export const typesOffresApi = {
  async list() {
    const { data } = await api.get<TypeOffreDef[]>("/api/types-offres");
    return data;
  },
  async byCode(code: string) {
    const { data } = await api.get<TypeOffreDef>(
      `/api/types-offres/code/${encodeURIComponent(code)}`,
    );
    return data;
  },
};

/** Variante serveur — alimente les filtres des pages publiques rendues côté serveur. */
export const typesOffresServerApi = {
  list() {
    return serverFetch<TypeOffreDef[]>("/api/types-offres", {
      revalidate: 300,
      tags: ["types-offres"],
    });
  },
};

export const adminTypesOffresApi = {
  /** Tous les types, désactivés compris, avec le nombre d'offres rattachées. */
  async list() {
    const { data } = await api.get<TypeOffreDef[]>("/api/admin/types-offres");
    return data;
  },
  async byId(id: number) {
    const { data } = await api.get<TypeOffreDef>(`/api/admin/types-offres/${id}`);
    return data;
  },
  async create(payload: TypeOffrePayload) {
    const { data } = await api.post<TypeOffreDef>(
      "/api/admin/types-offres",
      payload,
    );
    return data;
  },
  async update(id: number, payload: TypeOffrePayload) {
    const { data } = await api.put<TypeOffreDef>(
      `/api/admin/types-offres/${id}`,
      payload,
    );
    return data;
  },
  /** Refusé en 409 si des offres utilisent le type : le désactiver est l'alternative. */
  async remove(id: number) {
    const { data } = await api.delete<{ message: string }>(
      `/api/admin/types-offres/${id}`,
    );
    return data;
  },
};
