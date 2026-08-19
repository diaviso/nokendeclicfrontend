import { api } from "./client";
import type {
  CV,
  ExtractedCV,
  Conversation,
  Feedback,
  Notification,
  Offre,
  PaginatedResponse,
  PrivateConversationSummary,
  PrivateMessage,
  Retour,
  Statistics,
  User,
} from "../types";

export * from "./client";
export * from "./auth";
export * from "./offres";
export * from "./types-offres";
export * from "./profils";
export * from "./partenaire";
export * from "./chatbot-flux";

/**
 * Métadonnées de pagination du backend.
 *
 * Attention : toutes les listes ne sont pas paginées de la même façon. Les
 * routes feedback renvoient `{ data, meta }`, tandis que favoris, retours,
 * notifications, conversations et « mes offres » renvoient un tableau nu.
 * Les fonctions ci-dessous déballent systématiquement pour que les composants
 * reçoivent toujours un tableau.
 */
export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ------------------------------------------------------------------ Profil */

export const usersApi = {
  async me() {
    const { data } = await api.get<User>("/api/users/me");
    return data;
  },
  async update(id: number, payload: Partial<User>) {
    const { data } = await api.put<User>(`/api/users/${id}`, payload);
    return data;
  },
  async uploadPhoto(id: number, file: File) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<{ id: number; pictureUrl: string }>(
      `/api/users/${id}/photo`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },
};

export const dashboardApi = {
  async stats() {
    const { data } = await api.get<{
      totalOffres: number;
      totalFavorites: number;
      totalRetours: number;
      offresByType: Record<string, number>;
    }>("/api/dashboard/stats");
    return data;
  },
};

/* --------------------------------------------------------------- Favoris */

export const favoritesApi = {
  async list() {
    const { data } = await api.get<{ offre: Offre }[]>("/api/favorites");
    return data;
  },
  async add(offreId: number) {
    const { data } = await api.post(`/api/favorites/${offreId}`);
    return data;
  },
  async remove(offreId: number) {
    const { data } = await api.delete(`/api/favorites/${offreId}`);
    return data;
  },
  async check(offreId: number) {
    const { data } = await api.get<{ isFavorite: boolean }>(
      `/api/favorites/${offreId}/check`,
    );
    return data;
  },
};

/* --------------------------------------------------------------- Retours */

export const retoursApi = {
  async mine() {
    const { data } = await api.get<Retour[]>("/api/retours/mes-retours");
    return data;
  },
  /**
   * Retours d'une offre. Le service ne renvoie à un membre que les siens :
   * un retour est un témoignage privé, pas un avis public. Seule
   * l'administration reçoit la liste complète.
   */
  async byOffre(offreId: number) {
    const { data } = await api.get<Retour[]>(`/api/retours/offre/${offreId}`);
    return data;
  },
  async create(payload: { offreId: number; contenu: string }) {
    const { data } = await api.post<Retour>("/api/retours", payload);
    return data;
  },
  async remove(id: number) {
    const { data } = await api.delete(`/api/retours/${id}`);
    return data;
  },
};

/* -------------------------------------------------------------------- CV */

export const cvApi = {
  /**
   * L'API répond `{ hasCV, cv }` et non le CV directement : on déballe ici
   * pour que les composants manipulent `CV | null`.
   */
  async mine() {
    const { data } = await api.get<{ hasCV: boolean; cv: CV | null }>(
      "/api/cv/me",
    );
    return data.cv ?? null;
  },
  async save(payload: Partial<CV>) {
    const { data } = await api.post<CV>("/api/cv/me", payload);
    return data;
  },
  async remove() {
    const { data } = await api.delete("/api/cv/me");
    return data;
  },
  async correct(payload: Record<string, unknown>) {
    const { data } = await api.post<{
      success: boolean;
      data: Record<string, unknown>;
      corrections: {
        field: string;
        original: string;
        corrected: string;
        reason: string;
      }[];
    }>("/api/cv/correct", payload);
    return data;
  },
  /**
   * Analyse un CV déposé — PDF ou photographie — et renvoie les données lues,
   * sans rien enregistrer.
   *
   * Le délai d'attente est relevé bien au-dessus des 30 secondes par défaut du
   * client : le document est envoyé à un modèle multimodal, et un CV de deux
   * pages en haute définition demande une dizaine de secondes, davantage sur
   * une connexion lente. Avec le réglage global, la requête était interrompue
   * côté client alors que le serveur travaillait encore.
   */
  async importer(file: File) {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<{
      success: boolean;
      extractedData: ExtractedCV;
    }>("/api/cv/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 180_000,
    });
    return data.extractedData;
  },
};

/** Formats qu'accepte l'import, alignés sur le filtre du backend. */
export const FORMATS_CV_ACCEPTES =
  "application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif";

/* --------------------------------------------------------------- Chatbot */

export const chatbotApi = {
  async send(message: string, conversationId?: string) {
    const { data } = await api.post<{
      response: string;
      conversationId: string;
    }>("/api/chatbot/chat", { message, conversationId });
    return data;
  },
  async conversations() {
    const { data } = await api.get<Conversation[]>("/api/chatbot/conversations");
    return data;
  },
  async conversation(id: string) {
    const { data } = await api.get<Conversation>(
      `/api/chatbot/conversations/${id}`,
    );
    return data;
  },
  async removeConversation(id: string) {
    const { data } = await api.delete(`/api/chatbot/conversations/${id}`);
    return data;
  },
  async suggestions() {
    const { data } = await api.get<string[]>("/api/chatbot/suggestions");
    return data;
  },
};

/* ------------------------------------------------------------ Messagerie */

export const messagingApi = {
  async conversations() {
    const { data } = await api.get<PrivateConversationSummary[]>(
      "/messaging/conversations",
    );
    return data;
  },
  async messages(conversationId: number, page = 1, limit = 50) {
    const { data } = await api.get<PrivateMessage[]>(
      `/messaging/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
    );
    return data;
  },
  async send(conversationId: number, content: string) {
    const { data } = await api.post<PrivateMessage>(
      `/messaging/conversations/${conversationId}/messages`,
      { content },
    );
    return data;
  },
  async start(userId: number) {
    const { data } = await api.post<{
      id: number;
      otherUser: PrivateConversationSummary["otherUser"];
    }>(`/messaging/conversations/start/${userId}`);
    return data;
  },
  async contacts() {
    const { data } = await api.get<PrivateConversationSummary["otherUser"][]>(
      "/messaging/contacts",
    );
    return data;
  },
  async unreadCount() {
    const { data } = await api.get<{ unreadCount: number }>(
      "/messaging/unread-count",
    );
    return data;
  },
};

/* ----------------------------------------------------------- Notifications */

export const notificationsApi = {
  async list() {
    const { data } = await api.get<Notification[]>("/api/notifications");
    return data;
  },
  /** L'API renvoie `{ unreadCount }` ; normalisé en `{ count }` côté client. */
  async unreadCount() {
    const { data } = await api.get<{ unreadCount: number }>(
      "/api/notifications/unread-count",
    );
    return { count: data.unreadCount ?? 0 };
  },
  async markRead(id: number) {
    const { data } = await api.post(`/api/notifications/${id}/read`);
    return data;
  },
  async markAllRead() {
    const { data } = await api.post("/api/notifications/read-all");
    return data;
  },
};

/* --------------------------------------------------------------- Feedback */

export const feedbackApi = {
  /** Réponse paginée `{ data, meta }` : seul le tableau intéresse la liste. */
  async mine() {
    const { data } = await api.get<{ data: Feedback[]; meta: PageMeta }>(
      "/api/feedback/mes-feedbacks",
    );
    return data.data ?? [];
  },
  async byId(id: number) {
    const { data } = await api.get<Feedback>(`/api/feedback/${id}`);
    return data;
  },
  async create(payload: {
    titre: string;
    description: string;
    categorie: string;
    pageUrl?: string;
  }) {
    const { data } = await api.post<Feedback>("/api/feedback", payload);
    return data;
  },
  async reply(id: number, contenu: string) {
    const { data } = await api.post(`/api/feedback/${id}/reponses`, { contenu });
    return data;
  },
};

/* ------------------------------------------------------------------ Admin */

/** Statistiques de désagrégation — forme renvoyée par le backend. */
export interface DisaggregationStats {
  gender: {
    hommes: number;
    femmes: number;
    autres: number;
    nonPrecise: number;
    total: number;
  };
  handicap: { avec: number; sans: number; total: number };
  ageRanges: Record<string, number>;
  statutProfessionnel: Record<string, number>;
  geographic: { pays: string; count: number }[];
  communes: { commune: string; count: number }[];
  regions: { region: string; count: number }[];
  departements: { departement: string; count: number }[];
}

/** Une ligne de la courbe d'activité : un mois, cinq mesures. */
export interface MoisActivite {
  /** Format `AAAA-MM`. */
  mois: string;
  inscriptions: number;
  publications: number;
  retours: number;
  likes: number;
  favoris: number;
}

/** Rapport d'activité sur une période glissante. */
export interface RapportActivite {
  periode: { mois: number; debut: string; cles: string[] };
  evolution: MoisActivite[];
  offresParStatut: Record<string, number>;
  offresParType: Record<string, number>;
  utilisateursParRole: Record<string, number>;
  engagement: {
    cvTotal: number;
    cvPublics: number;
    offresOuvertes: number;
    partenaires: number;
    inscriptionsPeriode: number;
    publicationsPeriode: number;
    retoursPeriode: number;
    likesPeriode: number;
    favorisPeriode: number;
  };
}

export const adminApi = {
  async rapport(mois = 12) {
    const { data } = await api.get<RapportActivite>(
      `/api/admin/statistics/rapport?mois=${mois}`,
    );
    return data;
  },
  async statistics() {
    const { data } = await api.get<Statistics>("/api/admin/statistics");
    return data;
  },
  async disaggregation() {
    const { data } = await api.get<DisaggregationStats>(
      "/api/admin/statistics/disaggregation",
    );
    return data;
  },
  async users(params: { page?: number; limit?: number; search?: string } = {}) {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    const { data } = await api.get<{
      data: User[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>(`/api/admin/users${qs ? `?${qs}` : ""}`);
    return data;
  },
  /**
   * La réponse agrège profil, CV, offres, retours et statistiques : la forme
   * exacte est déclarée par l'appelant plutôt que dupliquée ici.
   */
  async userById<T = Record<string, unknown>>(id: number) {
    const { data } = await api.get<T>(`/api/admin/users/${id}`);
    return data;
  },
  async setUserRole(id: number, role: string) {
    const { data } = await api.post(`/api/admin/users/${id}/role`, { role });
    return data;
  },
  async toggleUserActive(id: number, isActive: boolean) {
    const { data } = await api.post(`/api/admin/users/${id}/toggle-active`, {
      isActive,
    });
    return data;
  },
  /**
   * Définit le mot de passe d'un compte depuis la console.
   *
   * Le serveur coupe les sessions ouvertes et prévient le titulaire : ce n'est
   * pas une écriture discrète, et l'interface doit le dire avant de la
   * proposer.
   */
  async definirMotDePasse(id: number, motDePasse: string) {
    const { data } = await api.post<{ message: string }>(
      `/api/admin/users/${id}/mot-de-passe`,
      { motDePasse },
    );
    return data;
  },
  async removeUser(id: number) {
    const { data } = await api.delete(`/api/admin/users/${id}`);
    return data;
  },
  async offres(
    params: { page?: number; limit?: number; search?: string; typeOffre?: string } = {},
  ) {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    const { data } = await api.get<{
      data: Offre[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>(`/api/admin/offres${qs ? `?${qs}` : ""}`);
    return data;
  },
  async removeOffre(id: number) {
    const { data } = await api.delete(`/api/admin/offres/${id}`);
    return data;
  },
  async toggleCloture(id: number, estCloturee: boolean) {
    const { data } = await api.post(`/api/admin/offres/${id}/toggle-cloture`, {
      estCloturee,
    });
    return data;
  },
  async exportUsers() {
    const { data } = await api.get<User[]>("/api/admin/users/export/all");
    return data;
  },
  async exportOffres() {
    const { data } = await api.get<Offre[]>("/api/admin/offres/export/all");
    return data;
  },
  /** Réponse `{ data, meta, stats }` — la liste seule est exploitée ici. */
  async feedbacks() {
    const { data } = await api.get<{
      data: Feedback[];
      meta: PageMeta;
      stats?: Record<string, number>;
    }>("/api/admin/feedback");
    return data.data ?? [];
  },
  async feedbackById(id: number) {
    const { data } = await api.get<Feedback>(`/api/admin/feedback/${id}`);
    return data;
  },
  async setFeedbackStatus(id: number, statut: string) {
    const { data } = await api.post(`/api/admin/feedback/${id}/status`, {
      statut,
    });
    return data;
  },
  async setFeedbackPriority(id: number, priorite: string) {
    const { data } = await api.post(`/api/admin/feedback/${id}/priority`, {
      priorite,
    });
    return data;
  },
  async replyFeedback(id: number, contenu: string) {
    const { data } = await api.post(`/api/admin/feedback/${id}/reponses`, {
      contenu,
    });
    return data;
  },
};

export type { PaginatedResponse };

/**
 * Dépose une image destinée au corps d'une annonce et renvoie son adresse.
 *
 * Détachée de l'offre : au moment où l'on illustre un paragraphe, l'annonce
 * n'existe pas encore. C'est le balisage enregistré ensuite qui référencera
 * l'adresse rendue ici.
 */
export async function envoyerImageContenu(fichier: File) {
  const corps = new FormData();
  corps.append("file", fichier);
  const { data } = await api.post<{ url: string }>(
    "/upload/image-contenu",
    corps,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}
