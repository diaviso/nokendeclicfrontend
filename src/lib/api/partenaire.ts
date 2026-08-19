import { api, serverFetch } from "./client";
import type { CVCandidat, Secteur } from "../types";

/** Fiche d'une structure partenaire, telle qu'elle la renseigne. */
export interface EntreprisePartenaire {
  id: number;
  userId: number;
  nom: string;
  logoUrl?: string | null;
  description?: string | null;
  secteur?: Secteur | null;
  siteWeb?: string | null;
  emailContact?: string | null;
  telephone?: string | null;
  ville?: string | null;
  region?: string | null;
  taille?: string | null;
  estVisibleVitrine: boolean;
  ordreVitrine: number;
}

/** Champs modifiables par le partenaire — la vitrine relève de l'administration. */
export type EntreprisePayload = Pick<EntreprisePartenaire, "nom"> &
  Partial<
    Pick<
      EntreprisePartenaire,
      | "description"
      | "secteur"
      | "siteWeb"
      | "emailContact"
      | "telephone"
      | "ville"
      | "region"
      | "taille"
    >
  >;

/** Candidat mis de côté, avec l'annotation privée du partenaire. */
export interface FavoriCandidat {
  id: number;
  createdAt: string;
  candidatId: number;
  note?: string | null;
  candidat: {
    id: number;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    pictureUrl?: string | null;
    statutProfessionnel?: string | null;
    region?: string | null;
  };
  /** Absent si le candidat a retiré la visibilité de son CV depuis. */
  cv: CVCandidat | null;
  profilToujoursVisible: boolean;
}

/** Structure mise en avant sur la page d'accueil. */
export interface PartenaireVitrine {
  id: number;
  nom: string;
  logoUrl?: string | null;
  siteWeb?: string | null;
  secteur?: Secteur | null;
  ville?: string | null;
  description?: string | null;
}

/** Fiche vue depuis la console : le compte propriétaire et son activité. */
export interface EntreprisePourAdministration extends EntreprisePartenaire {
  user: {
    id: number;
    email: string;
    username: string;
    isActive: boolean;
    _count: { offres: number };
  };
}

export const partenaireApi = {
  /* ---------------------------------------------------------- Entreprise */

  /** `null` tant que la fiche n'a pas été créée. */
  async monEntreprise(): Promise<EntreprisePartenaire | null> {
    const { data } = await api.get<EntreprisePartenaire | null>(
      "/api/partenaire/entreprise",
    );
    return data;
  },

  async enregistrerEntreprise(payload: EntreprisePayload) {
    const { data } = await api.put<EntreprisePartenaire>(
      "/api/partenaire/entreprise",
      payload,
    );
    return data;
  },

  async envoyerLogo(fichier: File) {
    const form = new FormData();
    form.append("file", fichier);
    const { data } = await api.post<EntreprisePartenaire>(
      "/api/partenaire/entreprise/logo",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  async retirerLogo() {
    const { data } = await api.delete<EntreprisePartenaire>(
      "/api/partenaire/entreprise/logo",
    );
    return data;
  },

  /* ------------------------------------------------------------- Favoris */

  async favoris(): Promise<FavoriCandidat[]> {
    const { data } = await api.get<FavoriCandidat[]>("/api/partenaire/favoris");
    return data;
  },

  /**
   * Identifiants des candidats déjà mis de côté.
   *
   * Un seul appel pour marquer toute une page de résultats — interroger le
   * serveur profil par profil multiplierait les requêtes sans rien apporter.
   */
  async identifiantsFavoris(): Promise<number[]> {
    const { data } = await api.get<number[]>(
      "/api/partenaire/favoris/identifiants",
    );
    return data;
  },

  async ajouterFavori(candidatId: number, note?: string) {
    const { data } = await api.post(`/api/partenaire/favoris/${candidatId}`, {
      note,
    });
    return data;
  },

  async retirerFavori(candidatId: number) {
    const { data } = await api.delete<{ message: string }>(
      `/api/partenaire/favoris/${candidatId}`,
    );
    return data;
  },

  /* ---------------------------------------------- Vitrine (console) */

  async listerPourAdministration(): Promise<EntreprisePourAdministration[]> {
    const { data } = await api.get<EntreprisePourAdministration[]>(
      "/api/partenaire/administration/entreprises",
    );
    return data;
  },

  async reglerVitrine(
    id: number,
    reglages: { estVisibleVitrine?: boolean; ordreVitrine?: number },
  ) {
    const { data } = await api.patch<EntreprisePartenaire>(
      `/api/partenaire/administration/entreprises/${id}/vitrine`,
      reglages,
    );
    return data;
  },

  /* ------------------------------------------------------------- Vitrine */

  async vitrine(): Promise<PartenaireVitrine[]> {
    const { data } = await api.get<PartenaireVitrine[]>(
      "/api/partenaire/vitrine",
    );
    return data;
  },
};

/** Variante serveur — la vitrine est rendue avec la page d'accueil. */
export const partenaireServerApi = {
  vitrine() {
    return serverFetch<PartenaireVitrine[]>("/api/partenaire/vitrine", {
      revalidate: 300,
      tags: ["vitrine"],
    });
  },
};
