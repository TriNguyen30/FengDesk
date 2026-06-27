import fetchHttpClient from "@/lib/httpClient";
import type {
  ApiResponse,
  GetProductsParams,
  GetProductsResponse,
  ProductDetail,
  ProductItem,
  ProductImage,
  CreateProductRequest,
  UpdateProductRequest,
  CreateProductItemRequest,
  UpdateProductItemRequest,
  AddProductImageRequest,
  UpdateProductFengShuiRequest,
  SetProductCategoriesRequest,
} from "../types/product";

export const productApi = {
  getProducts: (params?: GetProductsParams) => {
    return fetchHttpClient.get<GetProductsResponse>("/products", params);
  },

  getProductById: (id: string) => {
    return fetchHttpClient.get<ApiResponse<ProductDetail>>(`/products/${id}`);
  },

  createProduct: (data: CreateProductRequest) => {
    return fetchHttpClient.post<ApiResponse<ProductDetail>>("/products", data);
  },

  updateProduct: (id: string, data: UpdateProductRequest) => {
    return fetchHttpClient.put<ApiResponse<ProductDetail>>(`/products/${id}`, data);
  },

  deleteProduct: (id: string) => {
    return fetchHttpClient.delete<ApiResponse<null>>(`/products/${id}`);
  },

  createProductItem: (id: string, data: CreateProductItemRequest) => {
    return fetchHttpClient.post<ApiResponse<ProductItem>>(`/products/${id}/items`, data);
  },

  updateProductItem: (id: string, itemId: string, data: UpdateProductItemRequest) => {
    return fetchHttpClient.put<ApiResponse<ProductItem>>(`/products/${id}/items/${itemId}`, data);
  },

  deleteProductItem: (id: string, itemId: string) => {
    return fetchHttpClient.delete<ApiResponse<null>>(`/products/${id}/items/${itemId}`);
  },

  addProductImage: (id: string, data: AddProductImageRequest | FormData) => {
    let payload: FormData;
    if (data instanceof FormData) {
      payload = data;
    } else {
      payload = new FormData();
      payload.append("file", data.file);
      payload.append("sortOrder", String(data.sortOrder));
    }
    return fetchHttpClient.post<ApiResponse<ProductImage>>(`/products/${id}/images`, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  deleteProductImage: (id: string, imageId: string) => {
    return fetchHttpClient.delete<ApiResponse<null>>(`/products/${id}/images/${imageId}`);
  },

  updateProductCategories: (id: string, data: SetProductCategoriesRequest) => {
    return fetchHttpClient.put<ApiResponse<ProductDetail>>(`/products/${id}/categories`, data);
  },

  updateProductFengShui: (id: string, data: UpdateProductFengShuiRequest) => {
    return fetchHttpClient.put<ApiResponse<ProductDetail>>(`/products/${id}/feng-shui`, data);
  },
};
