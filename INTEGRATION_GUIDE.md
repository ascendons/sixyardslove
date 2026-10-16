# Six Yards Love E-Commerce Frontend Integration Guide

This document describes how to integrate a new frontend (React/Vite) with the existing Six Yards Love e-commerce backend.

---

## 1. Project Setup

### 1.1 Initialize Vite + React + TypeScript Project

```bash
npm create vite@latest your-frontend -- --template react-ts
cd your-frontend
npm install
npm install axios react-router-dom
```

### 1.2 Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=https://api.sixyardslove.com
```

If you need Razorpay payments:
```env
VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
```

---

## 2. API Client Setup

### 2.1 Create `src/lib/api-client.ts`

```typescript
import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8081",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const saved = localStorage.getItem("syl_auth_user");
  if (saved) {
    const user = JSON.parse(saved);
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = !!localStorage.getItem("syl_auth_user");
      localStorage.removeItem("syl_auth_user");
      if (hadToken) {
        window.dispatchEvent(new CustomEvent("syl:session-expired", { detail: { reason: "Session expired" } }));
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2.2 URL Sanitization Utility (`src/lib/utils.ts`)

The backend may return localhost URLs in development. Use this utility to sanitize:

```typescript
export const sanitizeUrl = (url: string): string => {
  if (!url) return url;
  return url.replace(/^https?:\/\/localhost:\d+\//, "/");
};
```

---

## 3. Authentication Service

### 3.1 Auth User Interface

```typescript
interface User {
  username: string;
  role: "admin" | "user" | "super_admin";
  token?: string;
  accessToken?: string;
}
```

### 3.2 Auth Service (`src/services/authService.ts`)

```typescript
import apiClient from "../lib/api-client";

const AUTH_USER_KEY = "syl_auth_user";

export const authService = {
  async login(credentials: { username: string; password: string }) {
    const response = await apiClient.post("/api/auth/login", credentials);
    const user: User = {
      username: response.data.username,
      role: response.data.role,
      token: response.data.accessToken,
    };
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    return user;
  },

  async register(data: { username: string; email: string; password: string; firstName: string; lastName: string }) {
    const response = await apiClient.post("/api/auth/register", data);
    return response.data;
  },

  async verifyEmail(token: string) {
    const response = await apiClient.post("/api/auth/verify-email", { token });
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await apiClient.post("/api/auth/forgot-password", { email });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string) {
    const response = await apiClient.post("/api/auth/reset-password", { token, newPassword });
    return response.data;
  },

  logout() {
    localStorage.removeItem(AUTH_USER_KEY);
  },

  getCurrentUser(): User | null {
    const saved = localStorage.getItem(AUTH_USER_KEY);
    return saved ? JSON.parse(saved) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getCurrentUser()?.token;
  },

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === "admin" || user?.role === "super_admin";
  },
};
```

---

## 4. Service Layer Pattern

All services follow this pattern. Examples:

### 4.1 Product Service (`src/services/productService.ts`)

```typescript
import apiClient from "../lib/api-client";
import { sanitizeUrl } from "../lib/utils";

export interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  mrp: number;
  stock: number;
  variantName: string;
  imageUrls: string[];
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  baseMrp: number;
  skus: ProductVariant[];
  rating: number;
  reviewCount: number;
  tags: string[];
}

function mapProduct(raw: any): Product {
  return {
    id: raw.id,
    code: raw.code,
    name: raw.name,
    description: raw.description,
    category: raw.category,
    basePrice: raw.basePrice,
    baseMrp: raw.baseMrp,
    skus: (raw.variants || []).map((v: any) => ({
      id: v.id,
      sku: v.sku,
      price: v.price,
      mrp: v.mrp,
      stock: v.stock,
      variantName: v.variantName,
      imageUrls: v.imageUrls?.map(sanitizeUrl) || v.images?.map((i: any) => sanitizeUrl(i.imageUrl)) || [],
    })),
    rating: raw.rating,
    reviewCount: raw.reviewCount,
    tags: raw.tags || [],
  };
}

export const productService = {
  getProducts(params?: { page?: number; size?: number; category?: string; search?: string }) {
    return apiClient.get("/api/products", { params }).then(r => ({
      content: r.data.content.map(mapProduct),
      totalElements: r.data.totalElements,
      totalPages: r.data.totalPages,
      size: r.data.size,
      number: r.data.number,
    }));
  },

  getProductByCode(code: string) {
    return apiClient.get(`/api/products/${code}`).then(r => mapProduct(r.data));
  },

  getFeatured() {
    return apiClient.get("/api/products/featured").then(r => r.data.content.map(mapProduct));
  },
};
```

### 4.2 Cart Service (`src/services/cartService.ts`)

```typescript
import apiClient from "../lib/api-client";

export interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface CartResponse {
  id: string;
  items: CartItem[];
  totalAmount: number;
  currency: string;
}

export const cartService = {
  getCart() {
    return apiClient.get("/api/cart").then(r => r.data as CartResponse);
  },

  addItem(item: { productCode: string; variantId: string; quantity: number }) {
    return apiClient.post("/api/cart/items", item).then(r => r.data as CartResponse);
  },

  updateItem(itemId: string, quantity: number) {
    return apiClient.put(`/api/cart/items/${itemId}`, { quantity }).then(r => r.data as CartResponse);
  },

  removeItem(itemId: string) {
    return apiClient.delete(`/api/cart/items/${itemId}`).then(r => r.data as CartResponse);
  },

  clearCart() {
    return apiClient.delete("/api/cart").then(r => r.data);
  },
};
```

### 4.3 Order Service (`src/services/orderService.ts`)

```typescript
import apiClient from "../lib/api-client";

export interface OrderItem {
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface OrderResponse {
  id: string;
  orderNumber?: string;
  status: string;
  totalAmount: number;
  shippingFee: number;
  items: OrderItem[];
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  createdAt: string;
}

export const orderService = {
  getOrders(params?: { page?: number; size?: number }) {
    return apiClient.get("/api/orders/me", { params }).then(r => r.data);
  },

  getOrderById(id: string) {
    return apiClient.get(`/api/orders/${id}`).then(r => r.data as OrderResponse);
  },

  createOrder(data: { addressId: string; paymentMethod: string; couponCode?: string; razorpayPaymentId?: string }) {
    return apiClient.post("/api/orders", data).then(r => r.data);
  },

  getOrderTracking(orderId: string) {
    return apiClient.get(`/api/orders/${orderId}/tracking`).then(r => r.data);
  },
};
```

### 4.4 User Service (`src/services/userService.ts`)

```typescript
import apiClient from "../lib/api-client";

export const userService = {
  getProfile() {
    return apiClient.get("/api/users/me").then(r => r.data);
  },

  updateProfile(data: { firstName?: string; lastName?: string; phone?: string }) {
    return apiClient.put("/api/users/me", data).then(r => r.data);
  },

  getAddresses() {
    return apiClient.get("/api/users/me/addresses").then(r => r.data);
  },

  addAddress(address: {
    label: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }) {
    return apiClient.post("/api/users/me/addresses", address).then(r => r.data);
  },

  updateAddress(id: string, address: any) {
    return apiClient.put(`/api/users/me/addresses/${id}`, address).then(r => r.data);
  },

  deleteAddress(id: string) {
    return apiClient.delete(`/api/users/me/addresses/${id}`).then(r => r.data);
  },
};
```

### 4.5 Coupon Service (`src/services/couponService.ts`)

```typescript
import apiClient from "../lib/api-client";

export const couponService = {
  getApplicableCoupons() {
    return apiClient.get("/api/coupons/applicable").then(r => r.data);
  },

  validateCoupon(code: string, cartTotal: number) {
    return apiClient.post("/api/coupons/validate", { code, cartTotal }).then(r => r.data);
  },
};
```

### 4.6 Media Upload Service (`src/services/mediaService.ts`)

Two-step upload: presigned URL from backend, then direct S3 upload.

```typescript
import apiClient from "../lib/api-client";

export const mediaService = {
  async uploadFile(file: File): Promise<string> {
    // Step 1: Get presigned URL
    const presignRes = await apiClient.post("/api/media/presign", {
      filename: file.name,
      contentType: file.type,
    });

    const { uploadUrl, publicUrl } = presignRes.data;

    // Step 2: Upload directly to S3
    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    return publicUrl;
  },

  async uploadFileFallback(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post("/api/media/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url;
  },
};
```

---

## 5. Admin Services

Admin services use the same `apiClient` but call `/admin/*` endpoints.

```typescript
// Example: adminProductService
export const adminProductService = {
  getProducts(params?: any) {
    return apiClient.get("/admin/products", { params }).then(r => r.data);
  },

  createProduct(data: any) {
    return apiClient.post("/admin/products", data).then(r => r.data);
  },

  updateProduct(id: string, data: any) {
    return apiClient.put(`/admin/products/${id}`, data).then(r => r.data);
  },

  deleteProduct(id: string) {
    return apiClient.delete(`/admin/products/${id}`).then(r => r.data);
  },
};

// Example: adminOrderService
export const adminOrderService = {
  getOrders(params?: any) {
    return apiClient.get("/admin/orders", { params }).then(r => r.data);
  },

  updateOrderStatus(orderId: string, status: string) {
    return apiClient.put(`/admin/orders/${orderId}/status`, { status }).then(r => r.data);
  },
};
```

---

## 6. Session Expiry Handling

Listen for the global event in your components:

```typescript
useEffect(() => {
  const handleSessionExpired = () => {
    // Redirect to login
    window.location.href = "/login";
  };
  window.addEventListener("syl:session-expired", handleSessionExpired);
  return () => window.removeEventListener("syl:session-expired", handleSessionExpired);
}, []);
```

---

## 7. Key Backend URL Patterns

| Endpoint Pattern | Description |
|------------------|-------------|
| `/api/auth/*` | Authentication (login, register, verify, password reset) |
| `/api/products*` | Public product browsing |
| `/api/cart*` | Shopping cart operations |
| `/api/orders*` | Order management |
| `/api/users/me*` | Current user profile & addresses |
| `/api/coupons*` | Coupon validation |
| `/api/media*` | Media upload (presign, S3, fallback) |
| `/admin/*` | Admin-only endpoints |
| `/api/reviews*` | Product reviews |

---

## 8. Paginated Response Format

Backend returns paginated data in this format:

```typescript
interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
```

When calling paginated endpoints, access `response.data.content` for the array.

---

## 9. Error Handling

All services throw axios errors on failure. Handle in components:

```typescript
try {
  const cart = await cartService.getCart();
} catch (error) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || error.message;
    console.error("Cart error:", message);
  }
}
```

---

## 10. Quick Start Checklist

- [ ] Set up Vite + React + TypeScript
- [ ] Create `src/lib/api-client.ts` with interceptors
- [ ] Create `src/lib/utils.ts` with `sanitizeUrl`
- [ ] Create `src/services/authService.ts`
- [ ] Create `src/services/productService.ts`
- [ ] Create `src/services/cartService.ts`
- [ ] Create `src/services/orderService.ts`
- [ ] Create `src/services/userService.ts`
- [ ] Create `src/services/couponService.ts`
- [ ] Create `src/services/mediaService.ts`
- [ ] Add admin services as needed
- [ ] Set up routing with React Router
- [ ] Add session expiry listener in root component
- [ ] Configure environment variables