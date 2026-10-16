import { Product } from "../data/products";
import apiClient from "../lib/api-client";

export const sanitizeUrl = (url: string) => {
  if (!url) return url;
  // Replace any localhost absolute URLs with relative paths
  return url.replace(/^https?:\/\/localhost:\d+\//, "/");
};

const mapProduct = (p: any): Product => {
  const images = (
    p.imageUrls ||
    p.images?.map((img: any) => img.imageUrl) ||
    []
  ).map(sanitizeUrl);

  return {
    ...p,
    id: p.id,
    category: p.categoryName || p.category,
    skus: (p.variants || []).map((v: any) => ({
      id: v.id,
      sku: v.sku,
      packaging: v.packaging,
      mrp: v.mrp,
      sellingPrice: v.sellingPrice,
      bulkOrderPrice: v.bulkOrderPrice,
      moq: v.moq,
      cogs: v.cogs,
      stockQuantity: v.stockQuantity,
      lengthMm: v.lengthMm,
      breadthMm: v.breadthMm,
      heightMm: v.heightMm,
      unitsPerBox: v.unitsPerBox,
      weightKg: v.weightKg,
    })),
    images: images,
    imageUrls: images,
  } as Product;
};

export const productService = {
  async getProducts(): Promise<Product[]> {
    const response = await apiClient.get("/api/products");
    const content = response.data.content || response.data;
    return (content || []).map(mapProduct);
  },

  async getAdminProducts(): Promise<Product[]> {
    const response = await apiClient.get("/admin/products");
    const content = response.data.content || response.data;
    return (content || []).map(mapProduct);
  },

  async getProductByCode(code: string): Promise<Product | undefined> {
    const response = await apiClient.get(`/api/products/${code}`);
    return response.data ? mapProduct(response.data) : undefined;
  },

  async getCategories(): Promise<any[]> {
    const response = await apiClient.get("/api/categories");
    return response.data || [];
  },

  async getAdminCategories(): Promise<any[]> {
    const response = await apiClient.get("/admin/categories");
    return response.data || [];
  },

  async addCategory(category: {
    name: string;
    imageUrl?: string;
  }): Promise<void> {
    await apiClient.post("/admin/categories", category);
  },

  async bulkAddCategories(names: string[]): Promise<void> {
    if (names.length === 0) return;
    const payloads = names.map((name) => ({ name }));
    await apiClient.post("/admin/categories/bulk", payloads);
  },

  async updateCategory(
    id: string,
    category: { name: string; imageUrl?: string },
  ): Promise<void> {
    await apiClient.put(`/admin/categories/${id}`, category);
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/admin/categories/${id}`);
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const response = await apiClient.get("/api/products/featured");
    const content = response.data.content || response.data;
    return (content || []).map(mapProduct);
  },

  // Admin methods
  async addProduct(product: any): Promise<void> {
    const categories = await this.getAdminCategories();
    const category = categories.find((c) => c.name === product.category);
    if (!category) throw new Error(`Category ${product.category} not found`);

    const payload = {
      ...product,
      categoryId: category.id,
      variants: product.skus,
      images: product.images?.map((url: string) => ({
        imageUrl: url,
        isPrimary: false,
      })),
    };
    delete payload.category;
    delete payload.skus;

    await apiClient.post("/admin/products", payload);
  },

  async bulkAddProducts(products: any[]): Promise<void> {
    const categories = await this.getAdminCategories();

    const payloads = products.map((product) => {
      const category = categories.find((c) => c.name === product.category);
      if (!category)
        throw new Error(
          `Category ${product.category} not found for product ${product.productCode || product.productName}`,
        );

      const payload = {
        ...product,
        categoryId: category.id,
        variants: product.skus,
        images: product.images?.map((url: string) => ({
          imageUrl: url,
          isPrimary: false,
        })),
      };
      delete payload.category;
      delete payload.skus;

      return payload;
    });

    await apiClient.post("/admin/products/bulk", payloads);
  },

  async updateProduct(id: string, updates: any): Promise<void> {
    const categories = await this.getAdminCategories();
    const category = categories.find((c) => c.name === updates.category);

    const payload = {
      ...updates,
      variants: updates.skus,
      images: updates.images?.map((url: string) => ({
        imageUrl: url,
        isPrimary: false,
      })),
    };

    if (category) {
      payload.categoryId = category.id;
    }
    delete payload.category;
    delete payload.skus;

    await apiClient.put(`/admin/products/${id}`, payload);
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/admin/products/${id}`);
  },

  async toggleFeatured(id: string): Promise<void> {
    await apiClient.patch(`/admin/products/${id}/featured`);
  },

  async searchProducts(
    query: string,
    signal?: AbortSignal,
  ): Promise<Product[]> {
    const response = await apiClient.get("/api/products/search", {
      params: { query },
      signal,
    });
    const content = response.data.content || response.data;
    return (content || []).map(mapProduct);
  },

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const response = await apiClient.get(
      `/api/products/category/${categoryId}`,
    );
    const content = response.data.content || response.data;
    return (content || []).map(mapProduct);
  },
};
