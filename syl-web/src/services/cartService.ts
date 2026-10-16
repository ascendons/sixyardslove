import apiClient from "@/lib/api-client";
import { sanitizeUrl } from "./productService";

export interface CartItem {
  id: string;
  productId: string;
  productVariantId: string;
  categoryId: string;
  sku: string;
  productName: string;
  packaging: string;
  price: number;
  quantity: number;
  imageUrl: string;
  weightKg: number;
  lengthMm: number;
  breadthMm: number;
  heightMm: number;
  unitsPerBox: number;
}

export interface CartResponse {
  id: string;
  items: CartItem[];
  totalAmount: number;
  currency: string;
}

export const cartService = {
  getCart: async (): Promise<CartResponse> => {
    const response = await apiClient.get("/api/cart");
    const items = (response.data?.items || [])
      .map((item: any) => ({
        ...item,
        imageUrl: sanitizeUrl(item.imageUrl),
      }))
      .sort((a, b) => a.productName.localeCompare(b.productName));
    return {
      ...response.data,
      items,
    };
  },

  addItem: async (
    productVariantId: string,
    quantity: number,
  ): Promise<CartResponse> => {
    const response = await apiClient.post("/api/cart/items", {
      productVariantId,
      quantity,
    });
    const items = (response.data?.items || []).map((item: any) => ({
      ...item,
      imageUrl: sanitizeUrl(item.imageUrl),
    }));
    return {
      ...response.data,
      items,
    };
  },

  updateQuantity: async (
    itemId: string,
    productVariantId: string,
    quantity: number,
  ): Promise<CartResponse> => {
    const response = await apiClient.put(`/api/cart/items/${itemId}`, {
      productVariantId,
      quantity,
    });
    const items = (response.data?.items || []).map((item: any) => ({
      ...item,
      imageUrl: sanitizeUrl(item.imageUrl),
    }));
    return {
      ...response.data,
      items,
    };
  },

  removeItem: async (itemId: string): Promise<void> => {
    await apiClient.delete(`/api/cart/items/${itemId}`);
  },

  clearCart: async (): Promise<void> => {
    await apiClient.delete("/api/cart");
  },
};
