import { api } from "./client";

/* ------------------------------------------------------ Téléchargement --- */

/** Remet un fichier reçu en binaire au navigateur, sous son nom définitif. */
export function telechargerFichier(fichier: Blob, nom: string) {
  const url = URL.createObjectURL(fichier);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nom;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------------------------------- Consultations --- */

export interface ConsultationsOffre {
  id: number;
  titre: string;
  entreprise?: string | null;
  datePublication: string;
  vues: number;
  consultations: number;
  uniques: number;
  repetees: number;
  derniere?: string | null;
}

export interface PageConsultations {
  bilan: {
    consultations: number;
    personnes: number;
    suiviDepuis?: string | null;
  };
  elements: ConsultationsOffre[];
  total: number;
  page: number;
  pages: number;
}

export interface PersonneConsultation {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  username: string;
  email: string;
  telephone?: string | null;
  role: string;
  statutProfessionnel: string;
  region?: string | null;
  departement?: string | null;
  nombre: number;
  premiere: string;
  derniere: string;
  dates: string[];
}

export interface DetailConsultations {
  offre: {
    id: number;
    titre: string;
    entreprise?: string | null;
    viewCount: number;
    datePublication: string;
  };
  bilan: {
    vues: number;
    consultations: number;
    uniques: number;
    repetees: number;
    comptesSupprimes: number;
  };
  personnes: PersonneConsultation[];
  total: number;
  page: number;
  pages: number;
}

export const consultationsApi = {
  async parOffre(params: {
    jours: number;
    q?: string;
    page: number;
    tri: "consultations" | "recentes";
  }) {
    const { data } = await api.get<PageConsultations>(
      "/api/admin/consultations",
      { params: { ...params, q: params.q?.trim() || undefined } },
    );
    return data;
  },
  async detail(offreId: number, params: { jours: number; page: number }) {
    const { data } = await api.get<DetailConsultations>(
      `/api/admin/consultations/offres/${offreId}`,
      { params },
    );
    return data;
  },
};

/* ------------------------------------------------------------ Annonces --- */

export interface FiltresAnnonce {
  roles?: string[];
  regions?: string[];
  departements?: string[];
  statuts?: string[];
  sexes?: string[];
  tranchesAge?: string[];
}

export interface ApercuAnnonce {
  destinataires: number;
  emails: number;
  appareils: number;
  quotaEmails: number;
}

export interface Annonce {
  id: number;
  titre: string;
  message: string;
  lien?: string | null;
  avecEmail: boolean;
  destinataires: number;
  emailsPrevus: number;
  emailsEnvoyes: number;
  emailsEchecs: number;
  statut: "EN_COURS" | "TERMINEE" | "INTERROMPUE";
  auteur?: string | null;
  createdAt: string;
}

export const annoncesApi = {
  async historique() {
    const { data } = await api.get<Annonce[]>("/api/admin/annonces");
    return data;
  },
  async options() {
    const { data } = await api.get<{ quotaEmails: number; quotaLimite: number }>(
      "/api/admin/annonces/options",
    );
    return data;
  },
  async apercu(filtres: FiltresAnnonce) {
    const { data } = await api.post<ApercuAnnonce>(
      "/api/admin/annonces/apercu",
      { filtres },
    );
    return data;
  },
  async envoyer(corps: {
    titre: string;
    message: string;
    lien?: string;
    avecEmail: boolean;
    filtres: FiltresAnnonce;
  }) {
    const { data } = await api.post<Annonce>("/api/admin/annonces", corps);
    return data;
  },
};

/* ----------------------------------------------------- Import Excel ------ */

export interface LigneImport {
  ligne: number;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string | null;
  region?: string | null;
  departement?: string | null;
  etat: "nouveau" | "deja_inscrit" | "erreur";
  erreurs: string[];
  avertissements: string[];
}

export interface ResumeImport {
  total: number;
  nouveaux: number;
  dejaInscrits: number;
  erreurs: number;
  avertissements: number;
}

export interface BilanImport {
  importes: number;
  actives: number;
  enAttente: number;
  sansInvitation: number;
  envoiEnCours: boolean;
  quotaEmails: number;
}

function formulaire(fichier: File, champs: Record<string, string> = {}) {
  const form = new FormData();
  form.append("file", fichier);
  for (const [cle, valeur] of Object.entries(champs)) form.append(cle, valeur);
  return form;
}

const multipart = { headers: { "Content-Type": "multipart/form-data" } };

export const importUtilisateursApi = {
  async modele() {
    const { data } = await api.get<Blob>(
      "/api/admin/import-utilisateurs/modele",
      { responseType: "blob" },
    );
    return data;
  },
  async bilan() {
    const { data } = await api.get<BilanImport>(
      "/api/admin/import-utilisateurs/bilan",
    );
    return data;
  },
  async analyser(fichier: File) {
    const { data } = await api.post<{
      resume: ResumeImport;
      quotaEmails: number;
      problemes: LigneImport[];
      apercu: LigneImport[];
    }>("/api/admin/import-utilisateurs/analyse", formulaire(fichier), multipart);
    return data;
  },
  async confirmer(fichier: File, envoyerInvitations: boolean) {
    const { data } = await api.post<ResumeImport & { crees: number }>(
      "/api/admin/import-utilisateurs/confirmer",
      formulaire(fichier, { envoyerInvitations: String(envoyerInvitations) }),
      multipart,
    );
    return data;
  },
  async relancer() {
    const { data } = await api.post<{ aInviter: number; quotaEmails: number }>(
      "/api/admin/import-utilisateurs/relancer",
    );
    return data;
  },
};
