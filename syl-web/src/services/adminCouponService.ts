import apiClient from "../lib/api-client";
import { CouponResponse } from "./couponService";

export interface CouponData {
  id?: string;
  code: string;
  description: string;
  discountType: "FIXED" | "PERCENT" | "PERCENT_CAP" | "BOGO" | "SKU_BOGO";
  discountValue: number;
  buyQty?: number;
  getQty?: number;
  buySku?: string;
  getSku?: string;
  minCartValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  userLimit?: number;
  isActive: boolean;
  expiresAt?: string;
  rules?: CouponRuleData[];
}

export interface CouponRuleData {
  ruleType: "PRODUCT" | "CATEGORY" | "SKU" | "ALL";
  entityId: string;
}

const adminCouponService = {
  getAllCoupons: async (): Promise<CouponResponse[]> => {
    const response = await apiClient.get("/admin/coupons/all");
    return response.data || [];
  },

  createCoupon: async (coupon: CouponData): Promise<CouponResponse> => {
    const response = await apiClient.post("/admin/coupons/create", coupon);
    return response.data;
  },

  updateCoupon: async (
    id: string,
    coupon: CouponData,
  ): Promise<CouponResponse> => {
    const response = await apiClient.put(`/admin/coupons/update/${id}`, coupon);
    return response.data;
  },

  deleteCoupon: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/coupons/delete/${id}`);
  },
};

export default adminCouponService;
