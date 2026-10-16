import apiClient from "../lib/api-client";

export interface InventoryItem {
  id: string;
  productVariantId: string;
  sku: string;
  skuCode: string;
  productName: string;
  productCode?: string;
  unit?: string;
  quantity: number;
  stockLevel: number;
  location: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

function mapInventoryItem(item: any): InventoryItem {
  return {
    id: item.productVariantId ?? item.product_variant_id ?? item.id,
    productVariantId:
      item.productVariantId ?? item.product_variant_id ?? item.id,
    sku: item.sku ?? "",
    skuCode: item.skuCode ?? item.sku_code ?? "",
    productName: item.productName ?? item.product_name ?? "",
    productCode: item.productCode ?? item.product_code,
    unit: item.unit,
    quantity: item.stockLevel ?? item.stock_level ?? item.quantity ?? 0,
    stockLevel: item.stockLevel ?? item.stock_level ?? item.quantity ?? 0,
    location: item.location ?? "Central Warehouse",
    status: item.status ?? "In Stock",
  };
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const inventoryService = {
  async getAllInventory(page = 0, size = 2000): Promise<Page<InventoryItem>> {
    const response = await apiClient.get(
      `/admin/inventory?page=${page}&size=${size}`,
    );
    return {
      ...response.data,
      content: (response.data?.content || []).map(mapInventoryItem),
    };
  },

  async syncInventory(): Promise<void> {
    await apiClient.post("/admin/inventory/sync");
  },

  async adjustStock(
    variantId: string,
    changeQty: number,
    reason: string,
  ): Promise<void> {
    await apiClient.post("/admin/inventory/adjust", {
      productVariantId: variantId,
      changeQty,
      reason,
    });
  },

  async getMovements(productVariantId: string): Promise<any[]> {
    const response = await apiClient.get(
      `/admin/inventory/${productVariantId}/movements`,
    );
    return response.data || [];
  },
};
