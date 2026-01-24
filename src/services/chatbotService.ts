import api from "./api";
import type { Conversation } from "@/types";

export const chatbotService = {
  async chat(message: string, conversationId?: string): Promise<{ response: string; conversationId: string }> {
    const { data } = await api.post<{ response: string; conversationId: string }>("/api/chatbot/chat", {
      message,
      conversationId,
    });
    return data;
  },

  async getConversations(): Promise<Conversation[]> {
    const { data } = await api.get<Conversation[]>("/api/chatbot/conversations");
    return data;
  },

  async getConversation(id: string): Promise<Conversation> {
    const { data } = await api.get<Conversation>(`/api/chatbot/conversations/${id}`);
    return data;
  },

  async deleteConversation(id: string): Promise<void> {
    await api.delete(`/api/chatbot/conversations/${id}`);
  },

  async getSuggestions(): Promise<string[]> {
    const { data } = await api.get<string[]>("/api/chatbot/suggestions");
    return data;
  },
};

export default chatbotService;
