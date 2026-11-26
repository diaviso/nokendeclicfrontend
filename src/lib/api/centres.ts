import { api, serverFetch } from "./client";

/** Centre de formation, tel que le public le voit. */
export interface CentreFormation {
  id: number;
  nom: string;
  logoUrl?: string | null;
  description?: string | null;
  /** Domaines enseignés, en texte libre. */
  domaines?: string | null;
  adresse?: string | null;
  ville?: string | null;
  region?: string | null;
  telephone?: string | null;
  emailContact?: string | null;
  siteWeb?: string | null;
  estPublie: boolean;
  /** Nombre de formations publiées (liste publique). */
  _count?: { formations: number };
}

/** Formation dispensée par un centre, résumée pour sa fiche. */
export interface FormationDuCentre {
  id: number;
  titre: string;
  slug?: string | null;
  imageUrl?: string | null;
  localisation?: string | null;
  entreprise?: string | null;
  dateLimite?: string | null;
  datePublication: string;
}

export interface CentreFormationDetail extends CentreFormation {
  formations: FormationDuCentre[];
}

/** Centre vu par l'administration : avec toutes ses formations reliées. */
export interface CentrePourAdministration extends CentreFormation {
  formations: { id: number; titre: string }[];
}

export type CentreFormationPayload = Pick<CentreFormation, "nom"> &
  Partial<
    Pick<
      CentreFormation,
      | "description"
      | "domaines"
      | "adresse"
      | "ville"
      | "region"
      | "telephone"
      | "emailContact"
      | "siteWeb"
      | "estPublie"
    >
  >;

export interface CentresFiltre {
  region?: string;
  search?: string;
}

export const centresApi = {
  async lister(filtre: CentresFiltre = {}): Promise<CentreFormation[]> {
    const { data } = await api.get<CentreFormation[]>("/api/centres-formation", {
      params: {
        region: filtre.region || undefined,
        search: filtre.search || undefined,
      },
    });
    return data;
  },

  async fiche(id: number): Promise<CentreFormationDetail> {
    const { data } = await api.get<CentreFormationDetail>(
      `/api/centres-formation/${id}`,
    );
    return data;
  },

  /* ------------------------------------------------------ Administration */

  async listerPourAdministration(): Promise<CentrePourAdministration[]> {
    const { data } = await api.get<CentrePourAdministration[]>(
      "/api/centres-formation/administration",
    );
    return data;
  },

  async creer(payload: CentreFormationPayload) {
    const { data } = await api.post<CentrePourAdministration>(
      "/api/centres-formation/administration",
      payload,
    );
    return data;
  },

  async modifier(id: number, payload: CentreFormationPayload) {
    const { data } = await api.put<CentrePourAdministration>(
      `/api/centres-formation/administration/${id}`,
      payload,
    );
    return data;
  },

  async supprimer(id: number) {
    const { data } = await api.delete<{ ok: boolean }>(
      `/api/centres-formation/administration/${id}`,
    );
    return data;
  },

  async logo(id: number, fichier: File) {
    const form = new FormData();
    form.append("file", fichier);
    const { data } = await api.post<CentrePourAdministration>(
      `/api/centres-formation/administration/${id}/logo`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  async definirFormations(id: number, offreIds: number[]) {
    const { data } = await api.put<CentrePourAdministration>(
      `/api/centres-formation/administration/${id}/formations`,
      { offreIds },
    );
    return data;
  },
};

/** Variante serveur, pour les pages publiques indexables. */
export const centresServerApi = {
  lister(filtre: CentresFiltre = {}) {
    const params = new URLSearchParams();
    if (filtre.region) params.set("region", filtre.region);
    if (filtre.search) params.set("search", filtre.search);
    const requete = params.size ? `?${params}` : "";
    return serverFetch<CentreFormation[]>(`/api/centres-formation${requete}`, {
      revalidate: 300,
      tags: ["centres"],
    });
  },

  fiche(id: number) {
    return serverFetch<CentreFormationDetail>(`/api/centres-formation/${id}`, {
      revalidate: 300,
      tags: ["centres"],
    });
  },
};
