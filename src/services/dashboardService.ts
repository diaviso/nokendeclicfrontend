import api from "./api";

export interface DashboardStats {
  totalOffres: number;
  totalFavorites: number;
  totalRetours: number;
  offresByType: Record<string, number>;
  recentOffres: any[];
}

const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>("/api/dashboard/stats");
    return data;
  },
};

export default dashboardService;
