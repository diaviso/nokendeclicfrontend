import api from "./api";

export type FeedbackCategory = "BUG" | "AMELIORATION" | "QUESTION" | "AUTRE";
export type FeedbackStatus = "OUVERT" | "EN_COURS" | "RESOLU" | "FERME";
export type FeedbackPriority = "BASSE" | "MOYENNE" | "HAUTE" | "CRITIQUE";

export interface FeedbackAuthor {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  pictureUrl?: string;
  role?: string;
  email?: string;
}

export interface FeedbackReponse {
  id: number;
  contenu: string;
  createdAt: string;
  auteur: FeedbackAuthor;
}

export interface Feedback {
  id: number;
  titre: string;
  description: string;
  categorie: FeedbackCategory;
  statut: FeedbackStatus;
  priorite: FeedbackPriority;
  pageUrl?: string;
  capture?: string;
  createdAt: string;
  updatedAt: string;
  auteur: FeedbackAuthor;
  reponses?: FeedbackReponse[];
  _count?: { reponses: number };
}

export interface FeedbackListResponse {
  data: Feedback[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats?: Record<string, number>;
}

export const feedbackService = {
  // User endpoints
  async create(data: {
    titre: string;
    description: string;
    categorie: FeedbackCategory;
    pageUrl?: string;
    capture?: string;
  }): Promise<Feedback> {
    const { data: result } = await api.post<Feedback>("/api/feedback", data);
    return result;
  },

  async getMyFeedbacks(page = 1, limit = 20): Promise<FeedbackListResponse> {
    const { data } = await api.get<FeedbackListResponse>(
      `/api/feedback/mes-feedbacks?page=${page}&limit=${limit}`
    );
    return data;
  },

  async getById(id: number): Promise<Feedback> {
    const { data } = await api.get<Feedback>(`/api/feedback/${id}`);
    return data;
  },

  async addReponse(feedbackId: number, contenu: string): Promise<FeedbackReponse> {
    const { data } = await api.post<FeedbackReponse>(
      `/api/feedback/${feedbackId}/reponses`,
      { contenu }
    );
    return data;
  },

  // Admin endpoints
  async adminGetAll(
    page = 1,
    limit = 20,
    statut?: string,
    categorie?: string,
    search?: string
  ): Promise<FeedbackListResponse> {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (statut) params.set("statut", statut);
    if (categorie) params.set("categorie", categorie);
    if (search) params.set("search", search);
    const { data } = await api.get<FeedbackListResponse>(
      `/api/admin/feedback?${params.toString()}`
    );
    return data;
  },

  async adminGetById(id: number): Promise<Feedback> {
    const { data } = await api.get<Feedback>(`/api/admin/feedback/${id}`);
    return data;
  },

  async adminUpdateStatus(id: number, statut: FeedbackStatus): Promise<Feedback> {
    const { data } = await api.post<Feedback>(`/api/admin/feedback/${id}/status`, { statut });
    return data;
  },

  async adminUpdatePriority(id: number, priorite: FeedbackPriority): Promise<Feedback> {
    const { data } = await api.post<Feedback>(`/api/admin/feedback/${id}/priority`, { priorite });
    return data;
  },

  async adminAddReponse(feedbackId: number, contenu: string): Promise<FeedbackReponse> {
    const { data } = await api.post<FeedbackReponse>(
      `/api/admin/feedback/${feedbackId}/reponses`,
      { contenu }
    );
    return data;
  },

  async adminDelete(id: number): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/api/admin/feedback/${id}`);
    return data;
  },
};

export default feedbackService;
