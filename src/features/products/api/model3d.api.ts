import fetchHttpClient from "@/lib/httpClient";
import type { ApiResponse } from "../types/product";
import type { Model3DRequest, ProductModel3D, RequestModel3DPayload } from "../types/model3d";

function buildRequestFormData(payload: RequestModel3DPayload): FormData {
  const form = new FormData();
  if (payload.productImageId) form.append("ProductImageId", payload.productImageId);
  (payload.sourceImageIds ?? []).forEach((id) => form.append("SourceImageIds", id));
  (payload.newImageFiles ?? []).forEach((file) => form.append("NewImages", file));
  return form;
}

export const model3DApi = {
  /**
   * Trạng thái/kết quả model 3D hiện tại của sản phẩm. Public (AllowAnonymous).
   * 404 = sản phẩm chưa từng có model 3D — coi là trạng thái bình thường, không phải lỗi.
   */
  getModel3D: (productId: string) => {
    return fetchHttpClient.get<ApiResponse<ProductModel3D[]>>(`/products/${productId}/model-3d`);
  },

  /**
   * Tạo yêu cầu sinh/tạo lại model 3D (owner/garden staff của store). Server tự quyết định
   * Initial (chưa có model) hay Regenerate (đã có model); cả hai đều vào hàng chờ staff sàn.
   * Bị chặn (409) nếu ảnh đang có một request mở.
   */
  requestModel3D: (productId: string, payload: RequestModel3DPayload) => {
    return fetchHttpClient.post<ApiResponse<Model3DRequest>>(
      `/products/${productId}/model-3d/requests`,
      buildRequestFormData(payload),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  /** Lịch sử request tạo model 3D của sản phẩm — mới nhất trước. */
  listModel3DRequests: (productId: string) => {
    return fetchHttpClient.get<ApiResponse<Model3DRequest[]>>(`/products/${productId}/model-3d/requests`);
  },

  /** Bật/tắt hiển thị model 3D trên trang sản phẩm công khai — không xóa dữ liệu model đã sinh. */
  toggleModel3D: (productId: string, modelId: string, isEnabled: boolean) => {
    return fetchHttpClient.patch<ApiResponse<null>>(`/products/${productId}/model-3d/${modelId}/toggle`, {
      isEnabled,
    });
  },

  deleteModel3D: (productId: string, modelId: string) => {
    return fetchHttpClient.delete<ApiResponse<null>>(`/products/${productId}/model-3d/${modelId}`);
  },
};
