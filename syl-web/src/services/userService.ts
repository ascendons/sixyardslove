import apiClient from "../lib/api-client";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserAddress {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country?: string;
  pincode: string;
  postalCode?: string;
  addressType: string;
  label?: string;
  landmark?: string;
  alternatePhone?: string;
  isDefault: boolean;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export const userService = {
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get("/api/users/me");
    return response.data;
  },

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await apiClient.patch("/api/users/me", data);
    return response.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.post("/api/users/me/change-password", data);
  },

  async getAddresses(): Promise<UserAddress[]> {
    const response = await apiClient.get("/api/users/me/addresses");
    return response.data || [];
  },

  async addAddress(data: Omit<UserAddress, "id">): Promise<UserAddress> {
    const response = await apiClient.post("/api/users/me/addresses", data);
    return response.data;
  },

  async updateAddress(
    id: string,
    data: Partial<UserAddress>,
  ): Promise<UserAddress> {
    const response = await apiClient.put(`/api/users/me/addresses/${id}`, data);
    return response.data;
  },

  async deleteAddress(id: string): Promise<void> {
    await apiClient.delete(`/api/users/me/addresses/${id}`);
  },
};
