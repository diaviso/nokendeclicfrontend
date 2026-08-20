export type Role = "ADMIN" | "MEMBRE" | "PARTENAIRE";

export type StatutProfessionnel =
  | "NON_PRECISE"
  | "EN_RECHERCHE"
  | "EN_POSTE"
  | "ETUDIANT"
  | "FREELANCE"
  | "CHOMAGE"
  | "RECONVERSION";

export type Sexe = "HOMME" | "FEMME" | "AUTRE" | "NON_PRECISE";

/**
 * Codes des cinq types livrés à l'origine.
 *
 * Les types d'offres sont désormais créés depuis le back-office : le code porté
 * par une offre est une chaîne libre, et non une énumération. Cette union ne
 * sert plus qu'aux valeurs d'affichage par défaut (icône, couleur, libellé) des
 * types historiques — voir `lib/type-offre.ts`.
 */
export type TypeOffreConnu =
  | "EMPLOI"
  | "FORMATION"
  | "BOURSE"
  | "VOLONTARIAT"
  | "PROGRAMME";

export type TypeChamp =
  | "TEXTE"
  | "TEXTE_LONG"
  | "NOMBRE"
  | "DATE"
  | "BOOLEEN"
  | "LISTE"
  | "URL";

/** Définition d'un champ propre à un type d'offre, saisie par l'administrateur. */
export interface ChampTypeOffre {
  /** Absent tant que le champ n'a pas été enregistré. */
  id?: number;
  /** Clé de la valeur dans `Offre.champs`. Immuable une fois des offres saisies. */
  code: string;
  libelle: string;
  type: TypeChamp;
  obligatoire: boolean;
  /** Renseigné (et requis) uniquement pour le type LISTE. */
  options: string[];
  placeholder?: string | null;
  aide?: string | null;
  ordre: number;
}

export interface TypeOffreDef {
  id: number;
  code: string;
  libelle: string;
  description?: string | null;
  /** Nom d'icône Lucide, résolu à l'affichage. */
  icone?: string | null;
  /** Clé de la palette de couleurs (blue, emerald, …). */
  couleur?: string | null;
  ordre: number;
  estActif: boolean;
  champs: ChampTypeOffre[];
  /** Présent sur les routes d'administration seulement. */
  _count?: { offres: number };
}

export type TypeEmploi =
  | "CDI"
  | "CDD"
  | "STAGE"
  | "ALTERNANCE"
  | "FREELANCE"
  | "INTERIM"
  | "SAISONNIER"
  | "TEMPS_PARTIEL"
  | "TEMPS_PLEIN";

export type Secteur =
  | "INFORMATIQUE"
  | "FINANCE"
  | "SANTE"
  | "EDUCATION"
  | "COMMERCE"
  | "INDUSTRIE"
  | "AGRICULTURE"
  | "TOURISME"
  | "TRANSPORT"
  | "COMMUNICATION"
  | "ADMINISTRATION"
  | "ARTISANAT"
  | "CONSTRUCTION"
  | "ENERGIE"
  | "ENVIRONNEMENT"
  | "JURIDIQUE"
  | "MARKETING"
  | "RESSOURCES_HUMAINES"
  | "RECHERCHE"
  | "AUTRE";

export type NiveauExperience =
  | "DEBUTANT"
  | "JUNIOR"
  | "CONFIRME"
  | "SENIOR"
  | "EXPERT";

/**
 * État de relecture d'une offre. Un dépôt de partenaire attend une validation ;
 * une offre publiée par l'administration est `PUBLIEE` d'emblée.
 */
export type StatutModeration = "EN_ATTENTE" | "PUBLIEE" | "REFUSEE";

export type FeedbackCategory = "BUG" | "AMELIORATION" | "QUESTION" | "AUTRE";
export type FeedbackStatus = "OUVERT" | "EN_COURS" | "RESOLU" | "FERME";
export type FeedbackPriority = "BASSE" | "MOYENNE" | "HAUTE" | "CRITIQUE";

export interface User {
  id: number;
  email: string;
  username: string;
  role: Role;
  isActive: boolean;
  pictureUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  statutProfessionnel: StatutProfessionnel;
  pays?: string | null;
  region?: string | null;
  departement?: string | null;
  commune?: string | null;
  sexe?: Sexe;
  dateNaissance?: string | null;
  adresse?: string | null;
  telephone?: string | null;
  handicap?: boolean;
  typeHandicap?: string | null;
  createdAt: string;
  isGoogleLogin: boolean;
  /** Version des CGU acceptée. Nulle pour un compte antérieur au texte. */
  cguVersion?: string | null;
  cguAccepteeLe?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface OffreFichier {
  id: number;
  nom: string;
  url: string;
  type: string;
  taille: number;
  createdAt: string;
}

export interface Offre {
  id: number;
  titre: string;
  description: string;
  /** Balisage assaini par le serveur. Nul pour les offres antérieures à l'éditeur. */
  contenuHtml?: string | null;
  /**
   * Marque posée par le serveur quand l'appelant n'a pas de session : la fiche
   * ne contient alors que de quoi identifier l'offre, pas de quoi y répondre.
   */
  apercuSeulement?: boolean;
  /** Accroche des listes et des aperçus de partage. */
  extrait?: string | null;
  /** Portion d'adresse lisible. */
  slug?: string | null;
  estBrouillon?: boolean;
  estEpinglee?: boolean;
  datePublicationPrevue?: string | null;
  imageAlt?: string | null;
  metaTitre?: string | null;
  metaDescription?: string | null;
  salaireDevise?: string | null;
  salairePeriode?: string | null;
  teletravail?: string | null;
  nombrePostes?: number | null;
  emailCandidature?: string | null;
  instructionsCandidature?: string | null;
  url?: string | null;
  dateLimite?: string | null;
  datePublication: string;
  /**
   * Code du type. Le backend le renvoie toujours à plat pour la compatibilité,
   * mais l'affichage doit passer par `type` quand il est présent : c'est lui qui
   * porte le libellé, l'icône et la couleur choisis par l'administrateur.
   */
  typeOffre: string;
  typeOffreId?: number;
  type?: TypeOffreDef | null;
  /** Valeurs des champs propres au type, indexées par code de champ. */
  champs?: Record<string, unknown>;
  imageUrl?: string | null;
  typeEmploi?: TypeEmploi | null;
  secteur?: Secteur | null;
  niveauExperience?: NiveauExperience | null;
  tags: string[];
  localisation?: string | null;
  entreprise?: string | null;
  salaireMin?: number | null;
  salaireMax?: number | null;
  devise?: string | null;
  organisme?: string | null;
  dureeFormation?: number | null;
  certification?: string | null;
  paysBourse?: string | null;
  niveauEtude?: string | null;
  montantBourse?: number | null;
  estRemboursable?: boolean | null;
  typeVolontariat?: string | null;
  dureeVolontariat?: number | null;
  hebergement?: boolean | null;
  indemnite?: number | null;
  competencesRequises?: string | null;
  documentUrl?: string | null;
  documentName?: string | null;
  documentType?: string | null;
  estCloturee?: boolean;
  /** Absent des réponses publiques anciennes : traiter l'absence comme publiée. */
  statutModeration?: StatutModeration;
  /** Renseigné uniquement en cas de refus : c'est ce que lit le partenaire. */
  motifRefus?: string | null;
  dateModeration?: string | null;
  viewCount: number;
  fichiers?: OffreFichier[];
  auteur: {
    id: number;
    username: string;
    pictureUrl?: string | null;
  };
  commentaires?: Commentaire[];
  _count?: {
    commentaires: number;
    retours: number;
    likes?: number;
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
  /** Code du type — chaîne libre depuis que les types sont administrables. */
  typeOffre?: string;
  typeOffreId?: number;
  typeEmploi?: TypeEmploi;
  secteur?: Secteur;
  niveauExperience?: NiveauExperience;
  tag?: string;
  keyword?: string;
  localisation?: string;
  /**
   * État de l'échéance. « ouverte » retient aussi les offres sans date limite —
   * candidature spontanée, programme permanent.
   */
  echeance?: "ouverte" | "depassee";
  page?: number;
  limit?: number;
}

export interface Experience {
  id?: number;
  poste: string;
  entreprise: string;
  ville?: string | null;
  dateDebut: string;
  dateFin?: string | null;
  enCours?: boolean;
  description?: string | null;
}

export interface Formation {
  id?: number;
  diplome: string;
  etablissement: string;
  ville?: string | null;
  dateDebut: string;
  dateFin?: string | null;
  enCours?: boolean;
  description?: string | null;
}

/** Entrée d'une rubrique de CV sans équivalent dans le modèle fixe. */
export interface EntreeRubrique {
  titre: string;
  sousTitre?: string | null;
  /**
   * Période telle qu'écrite sur le document, ex. « 2021 — aujourd'hui ». Reste
   * une chaîne libre : la normaliser en dates inventerait une précision que le
   * CV ne donne pas.
   */
  periode?: string | null;
  description?: string | null;
}

/**
 * Rubrique libre : publications, projets personnels, bénévolat, distinctions…
 * Ce qu'un CV contient et que les champs fixes ne prévoient pas. Sans elles,
 * l'import jetait purement et simplement ces sections.
 */
export interface RubriqueCV {
  titre: string;
  entrees: EntreeRubrique[];
}

/** Données lues dans un CV déposé, avant enregistrement. */
export interface ExtractedCV
  extends Omit<CV, "id" | "estPublic" | "user" | "rubriques"> {
  rubriques: RubriqueCV[];
}

export interface CV {
  id: number;
  titreProfessionnel?: string | null;
  telephone?: string | null;
  adresse?: string | null;
  ville?: string | null;
  codePostal?: string | null;
  pays?: string | null;
  linkedin?: string | null;
  siteWeb?: string | null;
  github?: string | null;
  resume?: string | null;
  competences: string[];
  langues: string[];
  certifications: string[];
  interets: string[];
  rubriques: RubriqueCV[];
  estPublic: boolean;
  experiences: Experience[];
  formations: Formation[];
  user?: User;
}

/**
 * CV tel qu'un recruteur le voit : ni téléphone, ni adresse. Le membre a
 * accepté d'être repéré, pas d'être appelé — la prise de contact passe par la
 * messagerie interne.
 */
export interface CVCandidat {
  id: number;
  userId: number;
  titreProfessionnel?: string | null;
  resume?: string | null;
  ville?: string | null;
  pays?: string | null;
  linkedin?: string | null;
  siteWeb?: string | null;
  github?: string | null;
  competences: string[];
  langues: string[];
  certifications: string[];
  interets: string[];
  rubriques: RubriqueCV[];
  dateModification: string;
  experiences?: Experience[];
  formations?: Formation[];
  user: {
    id: number;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    pictureUrl?: string | null;
    statutProfessionnel?: StatutProfessionnel;
    region?: string | null;
  };
}

/** Profil renvoyé par la recherche, avec son score et ce qui l'explique. */
export interface ProfilClasse {
  score: number;
  raisons: string[];
  competencesCorrespondantes: string[];
  cv: CVCandidat;
}

export interface Commentaire {
  id: number;
  contenu: string;
  datePublication: string;
  auteur: {
    id: number;
    username: string;
    pictureUrl?: string | null;
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
    pictureUrl?: string | null;
  };
  offre?: {
    id: number;
    titre: string;
    entreprise?: string | null;
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
  id: number | string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface PrivateConversationSummary {
  id: number;
  otherUser: {
    id: number;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    pictureUrl?: string | null;
    role: Role;
  };
  lastMessage: PrivateMessage | null;
  unreadCount: number;
  updatedAt: string;
}

export interface PrivateMessage {
  id: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  senderId: number;
  sender: {
    id: number;
    username: string;
    firstName?: string | null;
    lastName?: string | null;
    pictureUrl?: string | null;
  };
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Feedback {
  id: number;
  titre: string;
  description: string;
  categorie: FeedbackCategory;
  statut: FeedbackStatus;
  priorite: FeedbackPriority;
  pageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  auteur: {
    id: number;
    username: string;
    email?: string;
    pictureUrl?: string | null;
  };
  reponses: {
    id: number;
    contenu: string;
    createdAt: string;
    auteur: { id: number; username: string; pictureUrl?: string | null };
  }[];
}

export interface Statistics {
  totals: { users: number; offres: number; retours: number };
  offresByType: Record<string, number>;
  offresBySecteur: { secteur: string; count: number }[];
  topOffres: {
    id: number;
    titre: string;
    auteur: string;
    retoursCount: number;
  }[];
  thisMonth: { newUsers: number; newOffres: number; newRetours: number };
}
