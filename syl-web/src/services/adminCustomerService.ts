import apiClient from "../lib/api-client";

export interface AdminCustomerAddress {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  addressType: string;
  landmark?: string;
  alternatePhone?: string;
  isDefault: boolean;
}

export interface AdminCustomerResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  orderCount: number;
  addresses?: AdminCustomerAddress[];
}

export interface PaginatedCustomers {
  content: AdminCustomerResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}

const adminCustomerService = {
  getCustomers: async (
    page = 0,
    size = 50,
    search?: string,
  ): Promise<PaginatedCustomers> => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort: "createdAt,desc",
    });
    if (search) params.set("search", search);
    const response = await apiClient.get(`/admin/customers?${params}`);
    return { ...response.data, content: response.data?.content ?? [] };
  },

  getCustomer: async (id: string): Promise<AdminCustomerResponse> => {
    const response = await apiClient.get(`/admin/customers/${id}`);
    return response.data;
  },

  setActive: async (
    id: string,
    active: boolean,
  ): Promise<AdminCustomerResponse> => {
    const response = await apiClient.patch(
      `/admin/customers/${id}/status?active=${active}`,
    );
    return response.data;
  },
};

export default adminCustomerService;
