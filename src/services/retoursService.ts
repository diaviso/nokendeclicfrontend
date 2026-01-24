import api from "./api";
import type { Retour } from "@/types";

export const retoursService = {
  async getAll(): Promise<Retour[]> {
    const { data } = await api.get<Retour[]>("/api/retours");
    return data;
  },

  async getMyRetours(): Promise<Retour[]> {
    const { data } = await api.get<Retour[]>("/api/retours/mes-retours");
    return data;
  },

  async getByOffre(offreId: number): Promise<Retour[]> {
    const { data } = await api.get<Retour[]>(`/api/retours/offre/${offreId}`);
    return data;
  },

  async getById(id: number): Promise<Retour> {
    const { data } = await api.get<Retour>(`/api/retours/${id}`);
    return data;
  },

  async create(offreId: number, contenu: string): Promise<Retour> {
    const { data } = await api.post<Retour>("/api/retours", { offreId, contenu });
    return data;
  },

  async update(id: number, contenu: string): Promise<Retour> {
    const { data } = await api.put<Retour>(`/api/retours/${id}`, { contenu });
    return data;
  },

  async reply(id: number, contenu: string): Promise<Retour> {
    const { data } = await api.put<Retour>(`/api/retours/${id}/reply`, { contenu });
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/retours/${id}`);
  },
};

export default retoursService;
