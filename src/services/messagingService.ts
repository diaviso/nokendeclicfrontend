import api from "./api";

export interface UserInfo {
  id: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
  pictureUrl: string | null;
  role: string;
}

export interface PrivateMessage {
  id: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  senderId: number;
  sender: UserInfo;
}

export interface Conversation {
  id: number;
  otherUser: UserInfo;
  lastMessage: PrivateMessage | null;
  unreadCount: number;
  updatedAt: string;
}

export const messagingService = {
  async getConversations(): Promise<Conversation[]> {
    const { data } = await api.get<Conversation[]>("/messaging/conversations");
    return data;
  },

  async getMessages(conversationId: number, page = 1, limit = 50): Promise<PrivateMessage[]> {
    const { data } = await api.get<PrivateMessage[]>(
      `/messaging/conversations/${conversationId}/messages`,
      { params: { page, limit } }
    );
    return data;
  },

  async startConversation(userId: number): Promise<{ id: number; otherUser: UserInfo }> {
    const { data } = await api.post(`/messaging/conversations/start/${userId}`);
    return data;
  },

  async sendMessage(conversationId: number, content: string): Promise<PrivateMessage> {
    const { data } = await api.post<PrivateMessage>(
      `/messaging/conversations/${conversationId}/messages`,
      { content }
    );
    return data;
  },

  async deleteConversation(conversationId: number): Promise<void> {
    await api.delete(`/messaging/conversations/${conversationId}`);
  },

  async updateMessage(messageId: number, content: string): Promise<PrivateMessage> {
    const { data } = await api.post<PrivateMessage>(`/messaging/messages/${messageId}/update`, { content });
    return data;
  },

  async deleteMessage(messageId: number): Promise<void> {
    await api.delete(`/messaging/messages/${messageId}`);
  },

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const { data } = await api.get<{ unreadCount: number }>("/messaging/unread-count");
    return data;
  },

  async getContactableUsers(): Promise<UserInfo[]> {
    const { data } = await api.get<UserInfo[]>("/messaging/contacts");
    return data;
  },
};

export default messagingService;
