import api from "./api";
import type { User } from "@/types";

export const usersService = {
  async getAll(): Promise<User[]> {
    const { data } = await api.get<User[]>("/api/users");
    return data;
  },

  async getById(id: number): Promise<User> {
    const { data } = await api.get<User>(`/api/users/${id}`);
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<User>("/api/users/me");
    return data;
  },

  async update(id: number, userData: Partial<User>): Promise<User> {
    const { data } = await api.put<User>(`/api/users/${id}`, userData);
    return data;
  },

  async toggleActive(id: number): Promise<User> {
    const { data } = await api.put<User>(`/api/users/${id}/toggle-active`);
    return data;
  },

  async changeRole(id: number, role: string): Promise<User> {
    const { data } = await api.put<User>(`/api/users/${id}/change-role`, { role });
    return data;
  },

  async changeStatutProfessionnel(id: number, statutProfessionnel: string): Promise<User> {
    const { data } = await api.put<User>(`/api/users/${id}/change-statut-professionnel`, { statutProfessionnel });
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/users/${id}`);
  },

  async uploadPhoto(id: number, formData: FormData): Promise<User> {
    const { data } = await api.post<User>(`/api/users/${id}/photo`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },
};

export default usersService;
