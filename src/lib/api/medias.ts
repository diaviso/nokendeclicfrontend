import { api } from "./client";
import type { Media, Offre, PageMedias } from "@/lib/types";

export type FiltreMedias = "toutes" | "miennes" | "inutilisees" | "communes";
export type TriMedias = "recentes" | "utilisees";

/**
 * Médiathèque des couvertures.
 *
 * Une image y entre une fois et sert autant d'offres qu'on veut. Le serveur
 * reconnaît un fichier déjà envoyé (`existait`) et rend alors l'image connue
 * plutôt que d'en stocker une copie.
 */
export const mediasApi = {
  async lister(params: {
    q?: string;
    filtre?: FiltreMedias;
    tri?: TriMedias;
    page?: number;
    limite?: number;
  }) {
    const { data } = await api.get<PageMedias>("/api/medias", {
      params: { ...params, q: params.q?.trim() || undefined },
    });
    return data;
  },

  async bilan() {
    const { data } = await api.get<{
      total: number;
      poids: number;
      inutilisees: number;
      poidsInutilisees: number;
      communes: number;
    }>("/api/medias/bilan");
    return data;
  },

  async deposer(fichier: File, options: { nom?: string; alt?: string } = {}) {
    const form = new FormData();
    form.append("file", fichier);
    if (options.nom) form.append("nom", options.nom);
    if (options.alt) form.append("alt", options.alt);
    const { data } = await api.post<{
      media: Media;
      existait: boolean;
      tailleEnvoyee: number;
    }>("/api/medias", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  async modifier(
    id: number,
    modifications: { nom?: string; alt?: string; commune?: boolean },
  ) {
    const { data } = await api.patch<Media>(`/api/medias/${id}`, modifications);
    return data;
  },

  async supprimer(id: number) {
    const { data } = await api.delete<{ message: string }>(`/api/medias/${id}`);
    return data;
  },

  /** Couverture d'une offre existante, choisie dans la médiathèque. */
  async choisirPourOffre(offreId: number, mediaId: number) {
    const { data } = await api.put<Offre>(`/api/offres/${offreId}/image`, {
      mediaId,
    });
    return data;
  },
};
