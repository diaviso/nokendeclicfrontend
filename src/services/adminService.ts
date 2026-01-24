import api from "./api";
import type { Statistics, User } from "@/types";

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface AdminUser extends User {
  _count?: {
    retours: number;
    offres: number;
  };
}

interface AdminOffre {
  id: number;
  titre: string;
  description: string;
  typeOffre: string;
  typeEmploi?: string;
  localisation?: string;
  entreprise?: string;
  datePublication: string;
  dateLimite?: string;
  viewCount: number;
  auteur?: {
    id: number;
    username: string;
    email: string;
  };
  _count?: {
    retours: number;
  };
}

export const adminService = {
  // Statistics
  async getStatistics(): Promise<Statistics> {
    const { data } = await api.get<Statistics>("/api/admin/statistics");
    return data;
  },

  // Users
  async getUsers(page = 1, limit = 20, search?: string): Promise<PaginatedResponse<AdminUser>> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);
    
    const { data } = await api.get<PaginatedResponse<AdminUser>>(`/api/admin/users?${params}`);
    return data;
  },

  async getUserById(id: number): Promise<AdminUser> {
    const { data } = await api.get<AdminUser>(`/api/admin/users/${id}`);
    return data;
  },

  async updateUserRole(id: number, role: string): Promise<User> {
    const { data } = await api.post<User>(`/api/admin/users/${id}/role`, { role });
    return data;
  },

  async toggleUserActive(id: number, isActive: boolean): Promise<User> {
    const { data } = await api.post<User>(`/api/admin/users/${id}/toggle-active`, { isActive });
    return data;
  },

  async deleteUser(id: number): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/api/admin/users/${id}`);
    return data;
  },

  // Offres
  async getOffres(page = 1, limit = 20, search?: string, typeOffre?: string): Promise<PaginatedResponse<AdminOffre>> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);
    if (typeOffre) params.append("typeOffre", typeOffre);
    
    const { data } = await api.get<PaginatedResponse<AdminOffre>>(`/api/admin/offres?${params}`);
    return data;
  },

  async getOffreById(id: number): Promise<AdminOffre> {
    const { data } = await api.get<AdminOffre>(`/api/admin/offres/${id}`);
    return data;
  },

  async deleteOffre(id: number): Promise<{ message: string }> {
    const { data } = await api.delete<{ message: string }>(`/api/admin/offres/${id}`);
    return data;
  },
};

export default adminService;
