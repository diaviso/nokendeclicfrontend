import { api, serverFetch } from "./client";
import type {
  Commentaire,
  Offre,
  OffresFilters,
  PaginatedResponse,
  Retour,
} from "../types";

function toQuery(filters: OffresFilters = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const offresApi = {
  /** Client — espace connecté. */
  async list(filters: OffresFilters = {}) {
    const { data } = await api.get<PaginatedResponse<Offre>>(
      `/api/offres${toQuery(filters)}`,
    );
    return data;
  },

  async byId(id: number) {
    const { data } = await api.get<Offre>(`/api/offres/${id}`);
    return data;
  },

  /**
   * Offre telle que son auteur doit la voir pour la modifier.
   *
   * Distincte de `byId`, qui sert le catalogue : un dépôt en attente ou refusé
   * n'y figure pas, et le formulaire de modification ne pourrait pas le charger.
   */
  async pourEdition(id: number) {
    const { data } = await api.get<Offre>(`/api/offres/${id}/edition`);
    return data;
  },

  async mine() {
    const { data } = await api.get<Offre[]>("/api/offres/mes-offres");
    return data;
  },

  /* --------------------------------------------------------- Modération */

  /** File d'attente de la console : les dépôts non encore tranchés. */
  async enAttente() {
    const { data } = await api.get<Offre[]>("/api/offres/moderation/en-attente");
    return data;
  },

  async moderer(
    id: number,
    decision: { statut: "PUBLIEE" | "REFUSEE"; motif?: string },
  ) {
    const { data } = await api.post<Offre>(
      `/api/offres/${id}/moderation`,
      decision,
    );
    return data;
  },

  async create(payload: Partial<Offre>) {
    const { data } = await api.post<Offre>("/api/offres", payload);
    return data;
  },

  async update(id: number, payload: Partial<Offre>) {
    const { data } = await api.put<Offre>(`/api/offres/${id}`, payload);
    return data;
  },

  async remove(id: number) {
    const { data } = await api.delete<{ message: string }>(`/api/offres/${id}`);
    return data;
  },

  /* ------------------------------------------------------------- Médias */

  /**
   * Les envois passent par des routes dédiées prenant l'identifiant de l'offre :
   * une offre doit donc exister avant de recevoir sa couverture. Le formulaire
   * de création enregistre l'offre, puis envoie les fichiers.
   */
  async uploadImage(offreId: number, file: File) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<Offre>(
      `/api/offres/${offreId}/image`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  async removeImage(offreId: number) {
    const { data } = await api.delete<Offre>(`/api/offres/${offreId}/image`);
    return data;
  },

  async uploadDocument(offreId: number, file: File) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<Offre>(
      `/api/offres/${offreId}/document`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  async removeDocument(offreId: number) {
    const { data } = await api.delete<Offre>(`/api/offres/${offreId}/document`);
    return data;
  },

  /* -------------------------------------------------------- Commentaires */

  async commentaires(offreId: number) {
    const { data } = await api.get<Commentaire[]>(
      `/api/commentaires/offre/${offreId}`,
    );
    return data;
  },

  async addCommentaire(offreId: number, contenu: string) {
    const { data } = await api.post<Commentaire>("/api/commentaires", {
      offreId,
      contenu,
    });
    return data;
  },

  async updateCommentaire(id: number, contenu: string) {
    const { data } = await api.put<Commentaire>(`/api/commentaires/${id}`, {
      contenu,
    });
    return data;
  },

  async removeCommentaire(id: number) {
    const { data } = await api.delete<{ message: string }>(
      `/api/commentaires/${id}`,
    );
    return data;
  },

  async retoursByOffre(offreId: number) {
    const { data } = await api.get<Retour[]>(`/api/retours/offre/${offreId}`);
    return data;
  },
};

export interface StatutLike {
  total: number;
  liked: boolean;
}

export const likesApi = {
  /** Bascule le « j'aime » et renvoie l'état résultant. */
  async toggle(offreId: number) {
    const { data } = await api.post<StatutLike>(`/api/likes/${offreId}`);
    return data;
  },
  /**
   * État pour l'utilisateur connecté. La route publique `/api/likes/:id`
   * renvoie `liked: false` quelle que soit la session : elle sert au rendu
   * serveur, pas à l'espace connecté.
   */
  async statut(offreId: number) {
    const { data } = await api.get<StatutLike>(`/api/likes/${offreId}/moi`);
    return data;
  },
  /** Parmi une liste d'offres, celles aimées — évite un appel par carte. */
  async mesLikes(offreIds: number[]) {
    if (!offreIds.length) return [] as number[];
    const { data } = await api.post<number[]>("/api/likes/mes-likes", {
      offreIds,
    });
    return data;
  },
};

/**
 * Variantes serveur — utilisées par les Server Components des pages publiques.
 * Ces routes sont `@Public()` côté backend : aucune authentification requise,
 * ce qui permet le rendu serveur (et donc l'indexation) sans toucher au backend.
 */
export const offresServerApi = {
  list(filters: OffresFilters = {}) {
    return serverFetch<PaginatedResponse<Offre>>(
      `/api/offres${toQuery(filters)}`,
      { revalidate: 300, tags: ["offres"] },
    );
  },

  byId(id: number) {
    return serverFetch<Offre>(`/api/offres/${id}`, {
      revalidate: 300,
      tags: ["offres", `offre-${id}`],
    });
  },
};
