import fetchHttpClient from "@/lib/httpClient";
import { normalizeImageForUpload } from "@/utils/imageResize";
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

  /** Người bán xoá = xoá mềm (ẩn sản phẩm + biến thể, gỡ khỏi giỏ). 409 khi còn đơn chưa đóng. */
  deleteProduct: (id: string) => {
    return fetchHttpClient.delete<ApiResponse<null>>(`/products/${id}`);
  },

  /** Manager xoá VĨNH VIỄN (cả sản phẩm người bán đã xoá mềm). Đơn cũ và đánh giá vẫn giữ nội dung. */
  hardDeleteProduct: (id: string) => {
    return fetchHttpClient.delete<ApiResponse<null>>(`/products/${id}/permanent`);
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

  addProductImage: async (id: string, data: AddProductImageRequest | FormData) => {
    let payload: FormData;
    if (data instanceof FormData) {
      payload = data;
    } else {
      // Backend chỉ nhận JPG/PNG/BMP/GIF — .webp phải đổi sang JPEG trước, nếu không sẽ bị trả 422.
      payload = new FormData();
      payload.append("file", await normalizeImageForUpload(data.file));
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

  /** Mã SKU của sàn (`FD-XXXXXXXX`) chưa dùng — điền sẵn ô SKU. Không giữ chỗ, lúc lưu BE vẫn kiểm trùng. */
  suggestSku: async () => {
    const { data } = await fetchHttpClient.get<ApiResponse<string>>(`/products/sku-suggestion`);
    return data;
  },
};
