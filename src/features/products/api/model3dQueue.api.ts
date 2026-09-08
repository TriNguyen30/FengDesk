import fetchHttpClient from "@/lib/httpClient";
import { normalizeImageForUpload } from "@/utils/imageResize";
import type { ApiResponse } from "../types/product";
import type {
  Model3DFailureReason,
  Model3DPreview,
  Model3DRequestQueueItem,
  Model3DRequestQueueResponse,
  Model3DRequestStatus,
  RequestModel3DPayload,
} from "../types/model3d";

/** Ảnh mới được chuẩn hoá trước: backend chỉ nhận JPG/PNG/BMP/GIF nên .webp phải đổi sang JPEG. */
async function buildRequestFormData(payload: RequestModel3DPayload): Promise<FormData> {
  const form = new FormData();
  if (payload.productImageId) form.append("ProductImageId", payload.productImageId);
  (payload.sourceImageIds ?? []).forEach((id) => form.append("SourceImageIds", id));
  const newImages = await Promise.all((payload.newImageFiles ?? []).map(normalizeImageForUpload));
  newImages.forEach((file) => form.append("NewImages", file));
  return form;
}

export interface GetModel3DQueueParams {
  status?: Model3DRequestStatus;
  reason?: Model3DFailureReason;
  skip?: number;
  take?: number;
}

/**
 * Hàng chờ thống nhất cho staff sàn: cả Initial và Regenerate đều dùng cùng generate/preview/
 * retry/accept/reject flow và luôn gắn kết quả với productImageId.
 */
export const model3DQueueApi = {
  getQueue: (params?: GetModel3DQueueParams) => {
    return fetchHttpClient.get<ApiResponse<Model3DRequestQueueResponse>>("/model3d-requests", params);
  },

  /** Chọn ảnh (tick có sẵn + upload mới, 1–4 ảnh) rồi gửi task Meshy lần đầu cho request Regenerate. */
  generate: async (requestId: string, payload: RequestModel3DPayload) => {
    return fetchHttpClient.post<ApiResponse<Model3DRequestQueueItem>>(
      `/model3d-requests/${requestId}/generate`,
      await buildRequestFormData(payload),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  /** Chưa ưng ý kết quả trước — chọn lại ảnh, gửi lại Meshy. Không giới hạn số lần. */
  retry: async (requestId: string, payload: RequestModel3DPayload) => {
    return fetchHttpClient.post<ApiResponse<Model3DRequestQueueItem>>(
      `/model3d-requests/${requestId}/retry`,
      await buildRequestFormData(payload),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  /** Xem trước kết quả Meshy hiện tại (live poll, URL tạm — không lưu) để quyết định accept/retry. */
  preview: (requestId: string) => {
    return fetchHttpClient.get<ApiResponse<Model3DPreview>>(`/model3d-requests/${requestId}/preview`);
  },

  /** Ưng ý — tải GLB từ Meshy, re-host storage vĩnh viễn, ghi đè model hiện tại của sản phẩm. */
  accept: (requestId: string) => {
    return fetchHttpClient.post<ApiResponse<null>>(`/model3d-requests/${requestId}/accept`);
  },

  reject: (requestId: string, reason: string) => {
    return fetchHttpClient.post<ApiResponse<null>>(`/model3d-requests/${requestId}/reject`, { reason });
  },
};
