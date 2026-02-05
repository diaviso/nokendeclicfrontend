export type Role = "ADMIN" | "MEMBRE" | "PARTENAIRE";
export type StatutProfessionnel = "NON_PRECISE" | "EN_RECHERCHE" | "EN_POSTE" | "ETUDIANT" | "FREELANCE" | "CHOMAGE" | "RECONVERSION";
export type TypeOffre = "EMPLOI" | "FORMATION" | "BOURSE" | "VOLONTARIAT";
export type TypeEmploi = "CDI" | "CDD" | "STAGE" | "ALTERNANCE" | "FREELANCE" | "INTERIM" | "SAISONNIER" | "TEMPS_PARTIEL" | "TEMPS_PLEIN";
export type Secteur = "INFORMATIQUE" | "FINANCE" | "SANTE" | "EDUCATION" | "COMMERCE" | "INDUSTRIE" | "AGRICULTURE" | "TOURISME" | "TRANSPORT" | "COMMUNICATION" | "ADMINISTRATION" | "ARTISANAT" | "CONSTRUCTION" | "ENERGIE" | "ENVIRONNEMENT" | "JURIDIQUE" | "MARKETING" | "RESSOURCES_HUMAINES" | "RECHERCHE" | "AUTRE";
export type NiveauExperience = "DEBUTANT" | "JUNIOR" | "CONFIRME" | "SENIOR" | "EXPERT";

export interface User {
  id: number;
  email: string;
  username: string;
  role: Role;
  isActive: boolean;
  pictureUrl?: string;
  firstName?: string;
  lastName?: string;
  statutProfessionnel: StatutProfessionnel;
  pays?: string;
  commune?: string;
  quartier?: string;
  createdAt: string;
  isGoogleLogin: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Offre {
  id: number;
  titre: string;
  description: string;
  url?: string;
  dateLimite?: string;
  datePublication: string;
  typeOffre: TypeOffre;
  typeEmploi?: TypeEmploi;
  secteur?: Secteur;
  niveauExperience?: NiveauExperience;
  tags: string[];
  localisation?: string;
  entreprise?: string;
  salaireMin?: number;
  salaireMax?: number;
  devise?: string;
  organisme?: string;
  dureeFormation?: number;
  certification?: string;
  paysBourse?: string;
  niveauEtude?: string;
  montantBourse?: number;
  estRemboursable?: boolean;
  typeVolontariat?: string;
  dureeVolontariat?: number;
  hebergement?: boolean;
  indemnite?: number;
  competencesRequises?: string;
  documentUrl?: string;
  documentName?: string;
  viewCount: number;
  fichiers?: {
    id: number;
    nom: string;
    url: string;
    type: string;
    taille: number;
    createdAt: string;
  }[];
  auteur: {
    id: number;
    username: string;
    pictureUrl?: string;
  };
  _count?: {
    commentaires: number;
    retours: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface OffresFilters {
  typeOffre?: TypeOffre;
  typeEmploi?: TypeEmploi;
  secteur?: Secteur;
  niveauExperience?: NiveauExperience;
  tag?: string;
  keyword?: string;
  localisation?: string;
  page?: number;
  limit?: number;
}

export interface Experience {
  id?: number;
  poste: string;
  entreprise: string;
  ville?: string;
  dateDebut: string;
  dateFin?: string;
  enCours?: boolean;
  description?: string;
}

export interface Formation {
  id?: number;
  diplome: string;
  etablissement: string;
  ville?: string;
  dateDebut: string;
  dateFin?: string;
  enCours?: boolean;
  description?: string;
}

export interface CV {
  id: number;
  titreProfessionnel?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  linkedin?: string;
  siteWeb?: string;
  github?: string;
  resume?: string;
  competences: string[];
  langues: string[];
  certifications: string[];
  interets: string[];
  estPublic: boolean;
  experiences: Experience[];
  formations: Formation[];
  user?: User;
}

export interface Message {
  id: number;
  sujet: string;
  contenu: string;
  dateEnvoi: string;
  estLu: boolean;
  expediteur: {
    id: number;
    username: string;
    email?: string;
    pictureUrl?: string;
  };
  reponses: {
    id: number;
    contenu: string;
    dateCreation: string;
    auteur: { id: number; username: string };
  }[];
}

export interface Commentaire {
  id: number;
  contenu: string;
  datePublication: string;
  auteur: {
    id: number;
    username: string;
    pictureUrl?: string;
  };
}

export interface Retour {
  id: number;
  contenu: string;
  datePublication: string;
  auteur: {
    id: number;
    username: string;
    email?: string;
    pictureUrl?: string;
  };
  offre?: {
    id: number;
    titre: string;
    entreprise?: string;
  };
  reponses: {
    id: number;
    contenu: string;
    dateCreation: string;
    auteur: { id: number; username: string };
  }[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Statistics {
  totals: {
    users: number;
    offres: number;
    retours: number;
  };
  offresByType: Record<string, number>;
  offresBySecteur: { secteur: string; count: number }[];
  topOffres: {
    id: number;
    titre: string;
    auteur: string;
    retoursCount: number;
  }[];
  thisMonth: {
    newUsers: number;
    newOffres: number;
    newRetours: number;
  };
}
