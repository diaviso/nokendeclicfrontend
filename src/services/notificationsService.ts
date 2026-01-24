import api from "./api";

export interface Notification {
  id: number;
  type: "NEW_OFFRE" | "NEW_MESSAGE" | "NEW_RETOUR" | "NEW_COMMENTAIRE";
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const notificationsService = {
  async getNotifications(): Promise<Notification[]> {
    const { data } = await api.get<Notification[]>("/api/notifications");
    return data;
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await api.get<{ unreadCount: number }>("/api/notifications/unread-count");
    return data.unreadCount;
  },

  async markAsRead(notificationId: number): Promise<void> {
    await api.post(`/api/notifications/${notificationId}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.post("/api/notifications/read-all");
  },

  async deleteNotification(notificationId: number): Promise<void> {
    await api.delete(`/api/notifications/${notificationId}`);
  },
};

export default notificationsService;
