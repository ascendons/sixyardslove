import apiClient from "../lib/api-client";

export interface AdminAbandonedCartItem {
  productName: string | null;
  sku: string | null;
  quantity: number;
  price: number;
}

export interface AdminAbandonedCartResponse {
  cartId: string;
  userId: string | null;
  customerName: string | null;
  email: string | null;
  phone: string | null;
  distinctProducts: number;
  itemCount: number;
  cartValue: number;
  items: AdminAbandonedCartItem[];
  createdAt: string;
  updatedAt: string;
}

const adminCartService = {
  // Carts that currently hold items but were never checked out. A cart is
  // cleared the moment an order is placed, so "has items" already means
  // "not checked out" — no extra status filter needed.
  getAbandonedCarts: async (): Promise<AdminAbandonedCartResponse[]> => {
    const response = await apiClient.get("/admin/carts/abandoned");
    return response.data ?? [];
  },
};

export default adminCartService;
