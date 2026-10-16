import apiClient from "../lib/api-client";

export interface WishlistItem {
  id: string;
  productId: string;
  productVariantId: string;
  sku: string;
  productName: string;
  productCode: string;
  price?: number;
  imageUrl?: string;
}

export interface Wishlist {
  id: string;
  items: WishlistItem[];
}

export const wishlistService = {
  async getWishlist(): Promise<Wishlist> {
    const response = await apiClient.get("/api/wishlist");
    return {
      ...response.data,
      items: response.data?.items || [],
    };
  },

  async addItem(productId: string): Promise<Wishlist> {
    const response = await apiClient.post("/api/wishlist/items", { productId });
    return {
      ...response.data,
      items: response.data?.items || [],
    };
  },

  async removeItem(productId: string): Promise<void> {
    await apiClient.delete(`/api/wishlist/items/${productId}`);
  },

  async checkInWishlist(productId: string): Promise<boolean> {
    const response = await apiClient.get(`/api/wishlist/check/${productId}`);
    return response.data;
  },
};
