import fetchHttpClient from "@/lib/httpClient";
import { GetProductsParams, GetProductsResponse, ProductDetail } from "../types/product";
import { ApiResponse } from "../types/product";

export const productApi = {
  getProducts: (params?: GetProductsParams) => {
    return fetchHttpClient.get<GetProductsResponse>("/products", params);
  },

  getProductById: (id: string) => {
    return fetchHttpClient.get<ApiResponse<ProductDetail>>(`/products/${id}`);
  }
};
