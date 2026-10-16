import apiClient from "../lib/api-client";

export interface CouponRuleResponse {
  id: string;
  ruleType: string;
  entityId: string;
}

export interface CouponResponse {
  id: string;
  code: string;
  description: string;
  discountType: "FIXED" | "PERCENT" | "PERCENT_CAP" | "BOGO" | "SKU_BOGO";
  discountValue: number;
  buyQty?: number;
  getQty?: number;
  minCartValue: number;
  maxDiscount: number;
  expiresAt?: string;
  buySku?: string;
  getSku?: string;
  usageLimit?: number;
  userLimit?: number;
  isActive: boolean;
  rules?: CouponRuleResponse[];
  applicable?: boolean;
}

export interface CouponValidationResponse {
  valid: boolean | null;
  message: string;
  discountAmount: number;
  discountType: string;
  code: string;
}

export interface CartItemDTO {
  productId: string;
  variantId: string;
  categoryId: string;
  sku?: string;
  price: number;
  quantity: number;
}

const couponService = {
  getApplicableCoupons: async (
    productId: string,
    categoryId?: string,
  ): Promise<CouponResponse[]> => {
    const params: Record<string, string> = { productId };
    if (categoryId) params.categoryId = categoryId;
    const response = await apiClient.get(`/api/coupons/applicable`, { params });
    return response.data || [];
  },

  /** Fetches ALL public coupons with `applicable` flag — for product page display */
  getAllWithApplicability: async (
    productId: string,
    categoryId?: string,
  ): Promise<CouponResponse[]> => {
    const params: Record<string, string> = { productId };
    if (categoryId) params.categoryId = categoryId;
    const response = await apiClient.get(`/api/coupons/all`, { params });
    return response.data || [];
  },

  validateCoupon: async (
    code: string,
    cartItems: CartItemDTO[],
  ): Promise<CouponValidationResponse> => {
    const response = await apiClient.post(
      `/api/coupons/validate?code=${code}`,
      cartItems,
    );
    return response.data;
  },

  /** Fetches a coupon's details (description, discount, etc.) by its code — used to show what a coupon was on an invoice. */
  getByCode: async (code: string): Promise<CouponResponse> => {
    const response = await apiClient.get(`/api/coupons/code/${encodeURIComponent(code)}`);
    return response.data;
  },
};

export default couponService;
