import apiClient from "../lib/api-client";

export interface OrderItem {
  id: string;
  productVariantId: string;
  productId?: string;
  categoryId?: string;
  sku?: string;
  skuCode?: string;
  productName: string;
  hsn?: string;
  quantity: number;
  price: number;
  taxRate?: number;
  taxAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
}

export interface PaymentInfo {
  id: string;
  orderId?: string;
  provider?: string;
  method?: string;
  status: string;
  amount: number;
  currency?: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  failureReason?: string;
  paidAt?: string;
  createdAt?: string;
}

export interface AddressInfo {
  id?: string;
  label?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  pincode?: string;
  landmark?: string;
  alternatePhone?: string;
}

export interface OrderResponse {
  id: string;
  orderNumber?: string;
  invoiceNumber?: string;
  userId?: string;
  addressId?: string;
  status: string;
  totalAmount: number;
  shippingFee?: number;
  currency: string;
  customerName?: string;
  paymentId?: string;
  shippingId?: string;
  isBulk?: boolean;
  exchangeRate?: number;
  taxAmount?: number;
  taxRate?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  couponCode?: string;
  couponDiscount?: number;
  address?: AddressInfo;
  payments?: PaymentInfo[];
  items: OrderItem[];
  createdAt: string;
  returnRequested?: boolean;
  returnReason?: string;
  returnRequestedAt?: string;
}

export interface TrackingActivity {
  date: string;
  description: string;
  location: string;
  srStatus?: string;
}

export interface OrderTrackingResponse {
  awb?: string;
  carrier?: string;
  internalStatus: string;
  currentStatus?: string;
  etd?: string;
  deliveredDate?: string;
  origin?: string;
  destination?: string;
  activities: TrackingActivity[];
}

export interface PlaceOrderRequest {
  addressId: string;
  isBulk?: boolean;
  currencyCode?: string;
  couponCode?: string;
  shippingFee?: number;
  preferredCourierId?: number | null;
}

export interface BuyNowOrderRequest {
  productVariantId: string;
  quantity: number;
  addressId: string;
  isBulk?: boolean;
  currencyCode?: string;
  couponCode?: string;
  shippingFee?: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const orderService = {
  async getMyOrders(
    filter: "this_month" | "this_year" | "all_time" = "this_year",
  ): Promise<OrderResponse[]> {
    const response = await apiClient.get(`/api/orders/me?filter=${filter}`);
    return Array.isArray(response.data)
      ? response.data
      : (response.data?.content ?? []);
  },

  async getOrderDetails(id: string): Promise<OrderResponse> {
    const response = await apiClient.get(`/api/orders/${id}`);
    return response.data;
  },

  async placeOrder(request: PlaceOrderRequest): Promise<OrderResponse> {
    const response = await apiClient.post("/api/orders", request);
    return response.data;
  },

  async placeBuyNowOrder(request: BuyNowOrderRequest): Promise<OrderResponse> {
    const response = await apiClient.post("/api/orders/buy-now", request);
    return response.data;
  },

  async getOrderTracking(id: string): Promise<OrderTrackingResponse> {
    const response = await apiClient.get(`/api/orders/${id}/tracking`);
    return response.data;
  },

  async cancelOrder(id: string): Promise<OrderResponse> {
    const response = await apiClient.post(`/api/orders/${id}/cancel`);
    return response.data;
  },

  async requestReturn(id: string, reason: string): Promise<OrderResponse> {
    const response = await apiClient.post(`/api/orders/${id}/return-request`, {
      reason,
    });
    return response.data;
  },

  async downloadInvoice(id: string): Promise<Blob> {
    const response = await apiClient.get(`/api/orders/${id}/invoice`, {
      responseType: "blob",
    });
    return response.data;
  },
};
