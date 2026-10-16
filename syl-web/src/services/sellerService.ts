import apiClient from "../lib/api-client";

export interface Seller {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  businessName: string;
  gstin: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
  imageUrl: string;
  activity: string;
  memberCount: number;
  city: string;
  state: string;
  isVerified: boolean;
  isActive: boolean;

  tagline?: string;
  organizationType?: string;
  incorporationDate?: string;
  boardMembersCount?: number;
  vision?: string;
  commitment?: string;
  closingStatement?: string;
  activities?: string[];
  missionPoints?: string[];
}

export const sellerService = {
  async getAllSellers(): Promise<Seller[]> {
    const response = await apiClient.get("/admin/sellers");
    return response.data || [];
  },

  async getPublicSellers(): Promise<Seller[]> {
    const response = await apiClient.get("/api/sellers");
    return response.data || [];
  },

  async getSellerById(id: string): Promise<Seller> {
    const response = await apiClient.get(`/admin/sellers/${id}`);
    return response.data;
  },

  async getPublicSellerById(id: string): Promise<Seller> {
    const response = await apiClient.get(`/api/sellers/${id}`);
    return response.data;
  },

  async createSeller(
    seller: Partial<Seller> & {
      firstName: string;
      lastName: string;
      email: string;
    },
  ): Promise<Seller> {
    const response = await apiClient.post("/admin/sellers", seller);
    return response.data;
  },

  async updateSeller(id: string, seller: Partial<Seller>): Promise<Seller> {
    const response = await apiClient.put(`/admin/sellers/${id}`, seller);
    return response.data;
  },

  async deleteSeller(id: string): Promise<void> {
    await apiClient.delete(`/admin/sellers/${id}`);
  },
};
