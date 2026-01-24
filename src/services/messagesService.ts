import api from "./api";
import type { Message } from "@/types";

export const messagesService = {
  async getAll(): Promise<Message[]> {
    const { data } = await api.get<Message[]>("/api/messages");
    return data;
  },

  async getById(id: number): Promise<Message> {
    const { data } = await api.get<Message>(`/api/messages/${id}`);
    return data;
  },

  async create(sujet: string, contenu: string): Promise<Message> {
    const { data } = await api.post<Message>("/api/messages", { sujet, contenu });
    return data;
  },

  async markAsRead(id: number): Promise<Message> {
    const { data } = await api.put<Message>(`/api/messages/${id}/mark-read`);
    return data;
  },

  async reply(id: number, contenu: string): Promise<Message> {
    const { data } = await api.put<Message>(`/api/messages/${id}/reply`, { contenu });
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/messages/${id}`);
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await api.get<{ count: number }>("/api/messages/unread-count");
    return data.count;
  },
};

export default messagesService;
