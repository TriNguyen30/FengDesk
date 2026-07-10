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
  primaryElement?: string | null;
  items: ProductItem[];
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
  weightGram: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
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
  // Thuộc tính phong thủy (thay cho tags)
  primaryElement?: string | null;
  secondaryElements?: string[];
  sizeClass?: string | null;
  vibes?: string[];
  styles?: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Write/Request Payloads
// ============================================================

export interface CreateProductImageRequest {
  url: string;
  sortOrder: number;
}

export interface CreateProductRequest {
  gardenStoreId: string;
  name: string;
  description: string;
  items: CreateProductItemRequest[];
  images: CreateProductImageRequest[];
  categoryIds: string[];
  isActive?: boolean;
  // Đặc điểm sản phẩm (tùy chọn) — nguồn auto-calc vector ngũ hành, ưu tiên hơn primaryElement.
  elementInputs?: { kind: import("./taxonomy").ElementInputKind; code: string }[];
  // Phong thủy nâng cao (tùy chọn) — đường advanced/fallback. Bỏ trống primaryElement = tạo chưa có phong thủy.
  primaryElement?: string;
  secondaryElements?: string[];
  sizeClass?: string;
  vibes?: string[];
  styles?: string[];
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
  weightGram: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface UpdateProductItemRequest {
  name: string;
  price: number;
  stock: number;
  sku: string;
  weightGram: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
}

export interface AddProductImageRequest {
  file: File;
  sortOrder: number;
}

export interface UpdateProductFengShuiRequest {
  primaryElement: string;
  secondaryElements: string[];
  sizeClass: string;
  vibes: string[];
  styles: string[];
}

export interface SetProductCategoriesRequest {
  categoryIds: string[];
}
