import apiClient from "@/lib/api-client";

export interface RazorpayOrderResponse {
  keyId: string;
  razorpayOrderId: string;
  amountInPaisa: number;
  currency: string;
  internalOrderId: string;
  internalPaymentId: string;
  customerName: string;
  customerEmail: string;
}

export const razorpayService = {
  async createOrder(orderId: string): Promise<RazorpayOrderResponse> {
    const response = await apiClient.post(
      "/api/payments/razorpay/create-order",
      { orderId },
    );
    return response.data;
  },

  async verifyPayment(payload: {
    internalPaymentId: string;
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
  }): Promise<void> {
    await apiClient.post("/api/payments/razorpay/verify", payload);
  },
};

/** Dynamically loads the Razorpay checkout.js script. Returns true on success. */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}
