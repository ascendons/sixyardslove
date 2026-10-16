import apiClient from "../lib/api-client";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface CreateContactMessageRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

const contactService = {
  sendMessage: async (
    data: CreateContactMessageRequest,
  ): Promise<ContactMessage> => {
    const response = await apiClient.post("/api/contact", data);
    return response.data;
  },

  getAllMessages: async (): Promise<ContactMessage[]> => {
    const response = await apiClient.get("/api/admin/contacts");
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/api/admin/contacts/${id}/read`);
  },

  deleteMessage: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/admin/contacts/${id}`);
  },
};

export default contactService;
