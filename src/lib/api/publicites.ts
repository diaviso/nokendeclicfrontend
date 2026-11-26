import { api } from "./client";

/** Annonce publicitaire telle que la voit un membre. */
export interface Publicite {
  id: number;
  titre: string;
  texte?: string | null;
  /** Structure qui fait la promotion. */
  annonceur?: string | null;
  imageUrl?: string | null;
  /** Adresse externe (https://…) ou chemin interne (/offres/12). */
  lien?: string | null;
  libelleBouton?: string | null;
  /** Clé de couleur, voir `TEINTES_PUBLICITE`. */
  teinte: string;
}

/** Annonce vue par l'administration : diffusion et compteurs. */
export interface PublicitePourAdministration extends Publicite {
  estActive: boolean;
  debut?: string | null;
  fin?: string | null;
  ordre: number;
  vues: number;
  clics: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicitePayload {
  titre: string;
  texte?: string;
  annonceur?: string;
  lien?: string;
  libelleBouton?: string;
  teinte?: string;
  estActive?: boolean;
  debut?: string | null;
  fin?: string | null;
}

const BASE = "/api/publicites";

export const publicitesApi = {
  /** Annonces actives et dans leur fenêtre de diffusion. */
  async enDiffusion(): Promise<Publicite[]> {
    const { data } = await api.get<Publicite[]>(BASE);
    return data;
  },

  /** Compteurs : sans effet visible, une erreur ne doit jamais remonter. */
  compterVue(id: number) {
    api.post(`${BASE}/${id}/vue`).catch(() => undefined);
  },

  compterClic(id: number) {
    api.post(`${BASE}/${id}/clic`).catch(() => undefined);
  },

  /* ------------------------------------------------------ Administration */

  async listerPourAdministration(): Promise<PublicitePourAdministration[]> {
    const { data } = await api.get<PublicitePourAdministration[]>(
      `${BASE}/administration`,
    );
    return data;
  },

  async creer(payload: PublicitePayload) {
    const { data } = await api.post<PublicitePourAdministration>(
      `${BASE}/administration`,
      payload,
    );
    return data;
  },

  async modifier(id: number, payload: PublicitePayload) {
    const { data } = await api.put<PublicitePourAdministration>(
      `${BASE}/administration/${id}`,
      payload,
    );
    return data;
  },

  async basculer(id: number, active: boolean) {
    const { data } = await api.put<PublicitePourAdministration>(
      `${BASE}/administration/${id}/active/${active}`,
    );
    return data;
  },

  async reordonner(ids: number[]) {
    const { data } = await api.put<PublicitePourAdministration[]>(
      `${BASE}/administration/ordre`,
      { ids },
    );
    return data;
  },

  async supprimer(id: number) {
    const { data } = await api.delete<{ ok: boolean }>(
      `${BASE}/administration/${id}`,
    );
    return data;
  },

  async image(id: number, fichier: File) {
    const form = new FormData();
    form.append("file", fichier);
    const { data } = await api.post<PublicitePourAdministration>(
      `${BASE}/administration/${id}/image`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  async retirerImage(id: number) {
    const { data } = await api.delete<PublicitePourAdministration>(
      `${BASE}/administration/${id}/image`,
    );
    return data;
  },
};
