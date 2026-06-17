// ============================================================
// Shared API envelope
// ============================================================

export interface ApiResponse<T> {
  data: T;
  isSuccess: boolean;
  statusCode: number;
  message: string | null;
  errors: string[] | null;
}

export interface PaginatedData<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

// ============================================================
// Product / Garden store item
// ============================================================

export interface Product {
  id: string;
  gardenStoreId: string;
  name: string;
  isActive: boolean;
  minPrice: number;
  primaryImageUrl: string;
}

// ============================================================
// GET /api/products
// ============================================================

export interface GetProductsParams {
  storeId?: string;
  categoryId?: string;
  tagId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export type GetProductsResponse = PaginatedResponse<Product>;

// ============================================================
// Product Detail
// ============================================================

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
}

export interface ProductImage {
  id: string;
  url: string;
  sortOrder: number;
}

export interface ProductCategory {
  id: string;
  name: string;
}

export interface ProductTag {
  id: string;
  name: string;
}

export interface ProductDetail {
  id: string;
  gardenStoreId: string;
  storeName: string;
  name: string;
  description: string;
  isActive: boolean;
  items: ProductItem[];
  images: ProductImage[];
  categories: ProductCategory[];
  tags: ProductTag[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Write/Request Payloads
// ============================================================

export interface CreateProductRequest {
  gardenStoreId: string;
  name: string;
  description: string;
  item: ProductItem[];
  images: ProductImage[];
  categoriesIds: string[];
  tagIds: string[];
  isActive: boolean;
}

export interface UpdateProductRequest {
  name: string;
  description: string;
  isActive: boolean;
}

export interface CreateProductItemRequest {
  name: string;
  price: number;
  stock: number;
  sku: string;
}

export interface UpdateProductItemRequest {
  name: string;
  price: number;
  stock: number;
  sku: string;
}

export interface AddProductImageRequest {
  file: File;
  sortOrder: number;
}

export interface UpdateProductFengShuiRequest {
  element: string;
  compatibility?: string;
  description?: string;
  [key: string]: any;
}
