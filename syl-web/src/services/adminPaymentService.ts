import apiClient from "../lib/api-client";

export interface AdminPaymentResponse {
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

export interface PaginatedPayments {
  content: AdminPaymentResponse[];
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

const adminPaymentService = {
  getAllPayments: async (
    page: number = 0,
    size: number = 50,
    status?: string,
    provider?: string,
  ): Promise<PaginatedPayments> => {
    let params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (status) params.append("status", status);
    if (provider) params.append("provider", provider.toUpperCase());

    const response = await apiClient.get(
      `/admin/payments?${params.toString()}`,
    );
    return {
      ...response.data,
      content: response.data?.content || [],
    };
  },

  getPaymentById: async (id: string): Promise<AdminPaymentResponse> => {
    const response = await apiClient.get(`/admin/payments/${id}`);
    return response.data;
  },

  updatePaymentStatus: async (
    id: string,
    status: string,
  ): Promise<AdminPaymentResponse> => {
    const response = await apiClient.patch(`/admin/payments/${id}/status`, {
      status,
    });
    return response.data;
  },

  triggerReconciliation: async (): Promise<void> => {
    await apiClient.post("/admin/payments/reconcile/razorpay");
  },
};

export default adminPaymentService;
