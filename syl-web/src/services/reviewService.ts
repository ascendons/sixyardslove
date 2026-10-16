import apiClient from "@/lib/api-client";

export interface Review {
  id: string;
  userName: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewRequest {
  productId: string;
  rating: number;
  comment: string;
}

export interface PaginatedReviews {
  content: Review[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}

export const reviewService = {
  getProductReviews: async (
    productId: string,
    page = 0,
    size = 20,
  ): Promise<Review[]> => {
    const response = await apiClient.get(
      `/api/reviews/product/${productId}?page=${page}&size=${size}`,
    );
    const data = response.data;
    // Handle both paginated { content: [] } and flat array responses
    if (Array.isArray(data)) return data;
    return data?.content || [];
  },

  addReview: async (review: ReviewRequest): Promise<Review> => {
    const response = await apiClient.post("/api/reviews", review);
    return response.data;
  },
};
