export interface SKU {
  id: string;
  sku: string;
  packaging: string;
  mrp?: number | string;
  sellingPrice?: number | string;
  bulkOrderPrice?: number | string;
  moq?: number | string;
  cogs?: number;
  stockQuantity?: number;
  lengthMm?: number;
  breadthMm?: number;
  heightMm?: number;
  unitsPerBox?: number;
  weightKg?: number;
}

export interface Product {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  categoryId?: string;
  subCategory: string;
  unit: string;
  location: string;
  monthlyProductionCapacity: string;
  producedBy: string;
  returnApplicable: boolean;
  returnWindow: string;
  tax: string;
  hsn?: string;
  featured?: boolean;
  leadTime: string;
  description: string;
  competitiveAdvantage: string;
  benefits?: string;
  howToUse?: string;
  skus: SKU[];
  images?: string[];
  inWishlist?: boolean;
  inCart?: boolean;
}
