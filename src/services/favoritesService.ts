import api from "./api";
import type { Offre } from "@/types";

export const favoritesService = {
  async add(offreId: number): Promise<{ offre: Offre }> {
    const { data } = await api.post(`/api/favorites/${offreId}`);
    return data;
  },

  async remove(offreId: number): Promise<void> {
    await api.delete(`/api/favorites/${offreId}`);
  },

  async getAll(): Promise<{ offre: Offre }[]> {
    const { data } = await api.get("/api/favorites");
    return data;
  },

  async isFavorite(offreId: number): Promise<boolean> {
    const { data } = await api.get<{ isFavorite: boolean }>(`/api/favorites/${offreId}/check`);
    return data.isFavorite;
  },
};

export default favoritesService;
