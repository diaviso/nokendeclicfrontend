import api from "./api";
import type { Offre, PaginatedResponse, OffresFilters } from "@/types";

export const offresService = {
  async getAll(filters: OffresFilters = {}): Promise<PaginatedResponse<Offre>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.append(key, String(value));
      }
    });
    const { data } = await api.get<PaginatedResponse<Offre>>(
      `/api/offres?${params.toString()}`
    );
    return data;
  },

  async getById(id: number): Promise<Offre> {
    const { data } = await api.get<Offre>(`/api/offres/${id}`);
    return data;
  },

  async create(offre: Partial<Offre>): Promise<Offre> {
    const { data } = await api.post<Offre>("/api/offres", offre);
    return data;
  },

  async update(id: number, offre: Partial<Offre>): Promise<Offre> {
    const { data } = await api.put<Offre>(`/api/offres/${id}`, offre);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/offres/${id}`);
  },

  async getMyOffres(): Promise<Offre[]> {
    const { data } = await api.get<Offre[]>("/api/offres/mes-offres");
    return data;
  },

  async getTypes(): Promise<{
    typeOffre: string[];
    typeEmploi: string[];
    secteur: string[];
    niveauExperience: string[];
  }> {
    const { data } = await api.get("/api/offres/types");
    return data;
  },
};

export default offresService;
