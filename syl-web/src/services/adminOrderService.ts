import apiClient from "../lib/api-client";

export interface AdminOrderItemResponse {
  id: string;
  productVariantId: string;
  sku?: string;
  skuCode?: string;
  productName: string;
  quantity: number;
  price: number;
  taxRate?: number;
  taxAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
}

export interface AdminPackedItemResponse {
  variantId?: string;
  sku?: string;
  productName?: string;
  quantity?: number;
  itemLengthMm?: number;
  itemBreadthMm?: number;
  itemHeightMm?: number;
  itemWeightKg?: number;
}

export interface AdminBoxAssignmentResponse {
  id: string;
  boxId?: string;
  boxName: string;
  boxLengthCm?: number;
  boxBreadthCm?: number;
  boxHeightCm?: number;
  boxWeightKg?: number;
  totalItemsWeightKg?: number;
  sequence: number;
  packedItems: AdminPackedItemResponse[];
  createdAt: string;
}

export interface AdminPaymentInOrder {
  id: string;
  orderId: string;
  provider: string;
  method: string;
  status: string;
  amount: number;
  currency: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  failureReason?: string;
  paidAt?: string;
  createdAt: string;
}

export interface AdminOrderResponse {
  id: string;
  orderNumber: string;
  userId: string;
  addressId: string;
  status: string;
  isBulk: boolean;
  totalAmount: number;
  currency: string;
  exchangeRate?: number;
  taxAmount?: number;
  taxRate?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  shippingFee?: number;
  customerName?: string;
  paymentId?: string;
  shippingId?: string;
  items: AdminOrderItemResponse[];
  payments?: AdminPaymentInOrder[];
  packagingBoxAssignments?: AdminBoxAssignmentResponse[];
  address?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  expiresAt?: string;
  returnRequested?: boolean;
  returnReason?: string;
  returnRequestedAt?: string;
  adminNotes?: string;
}

export interface PaginatedOrders {
  content: AdminOrderResponse[];
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

const adminOrderService = {
  getAllOrders: async (params?: {
    status?: string;
    days?: number;
    search?: string;
  }): Promise<AdminOrderResponse[]> => {
    const { status, days, search } = params ?? {};
    const q = new URLSearchParams();
    if (status) q.set("status", status);
    if (days != null) q.set("days", String(days));
    if (search?.trim()) q.set("search", search.trim());
    const qs = q.toString();
    const response = await apiClient.get(`/admin/orders${qs ? `?${qs}` : ""}`);
    return Array.isArray(response.data)
      ? response.data
      : (response.data?.content ?? []);
  },

  getOrderById: async (id: string): Promise<AdminOrderResponse> => {
    const response = await apiClient.get(`/admin/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (
    id: string,
    status: string,
  ): Promise<AdminOrderResponse> => {
    const response = await apiClient.patch(`/admin/orders/${id}/status`, {
      status,
    });
    return response.data;
  },

  bulkUpdateStatus: async (
    ids: string[],
    status: string,
  ): Promise<{ updated: number; failed: number }> => {
    const response = await apiClient.patch(`/admin/orders/bulk-status`, {
      ids,
      status,
    });
    return response.data;
  },

  updateNotes: async (
    id: string,
    notes: string,
  ): Promise<AdminOrderResponse> => {
    const response = await apiClient.patch(`/admin/orders/${id}/notes`, {
      notes,
    });
    return response.data;
  },

  refundOrder: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/orders/${id}/refund`);
  },

  pushToShiprocket: async (
    id: string,
  ): Promise<{ success: boolean; warning?: string }> => {
    const response = await apiClient.post(
      `/admin/orders/${id}/push-to-shiprocket`,
    );
    return response.data;
  },

  acceptReturn: async (id: string): Promise<AdminOrderResponse> => {
    const response = await apiClient.post(`/admin/orders/${id}/accept-return`);
    return response.data;
  },

  rejectReturn: async (id: string): Promise<AdminOrderResponse> => {
    const response = await apiClient.post(`/admin/orders/${id}/reject-return`);
    return response.data;
  },

  updateTracking: async (
    id: string,
    data: {
      carrier?: string;
      trackingNumber?: string;
      trackingUrl?: string;
      estimatedDelivery?: string;
    },
  ): Promise<void> => {
    await apiClient.patch(`/admin/orders/${id}/tracking`, data);
  },

  fetchInvoiceBlob: async (
    id: string,
  ): Promise<{ url: string; filename: string }> => {
    const response = await apiClient.get(`/admin/orders/${id}/invoice`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(
      new Blob([response.data], { type: "application/pdf" }),
    );
    return { url, filename: `invoice-${id.substring(0, 8).toUpperCase()}.pdf` };
  },

  downloadInvoice: async (id: string): Promise<void> => {
    const response = await apiClient.get(`/admin/orders/${id}/invoice`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(
      new Blob([response.data], { type: "application/pdf" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${id.substring(0, 8).toUpperCase()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export default adminOrderService;
