import apiClient from "../lib/api-client";

export interface AdminShipmentResponse {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  status: string;
  estimatedDelivery?: string;
  shiprocketOrderId?: number;
  shiprocketShipmentId?: number;
}

export interface CreateShipmentData {
  orderId: string;
  carrier: string;
  trackingNumber: string;
  status: string;
  estimatedDelivery?: string;
}

export interface UpdateShipmentData {
  carrier: string;
  trackingNumber: string;
  status: string;
  estimatedDelivery?: string;
}

export interface PaginatedShipments {
  content: AdminShipmentResponse[];
  pageable: any;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: any;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

const adminShippingService = {
  getAllShipments: async (
    page: number = 0,
    size: number = 50,
  ): Promise<PaginatedShipments> => {
    const response = await apiClient.get(
      `/admin/shipments?page=${page}&size=${size}`,
    );
    return {
      ...response.data,
      content: response.data?.content || [],
    };
  },

  getShipmentById: async (id: string): Promise<AdminShipmentResponse> => {
    const response = await apiClient.get(`/admin/shipments/${id}`);
    return response.data;
  },

  createShipment: async (
    data: CreateShipmentData,
  ): Promise<AdminShipmentResponse> => {
    const response = await apiClient.post(`/admin/shipments`, data);
    return response.data;
  },

  updateShipment: async (
    id: string,
    data: UpdateShipmentData,
  ): Promise<AdminShipmentResponse> => {
    const response = await apiClient.patch(`/admin/shipments/${id}`, data);
    return response.data;
  },
};

export default adminShippingService;
