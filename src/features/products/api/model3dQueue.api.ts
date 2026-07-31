import fetchHttpClient from "@/lib/httpClient";
import type { ApiResponse } from "../types/product";
import type {
  Model3DFailureReason,
  Model3DPreview,
  Model3DRequestQueueItem,
  Model3DRequestQueueResponse,
  Model3DRequestStatus,
  RequestModel3DPayload,
} from "../types/model3d";

function buildRequestFormData(payload: RequestModel3DPayload): FormData {
  const form = new FormData();
  (payload.sourceImageIds ?? []).forEach((id) => form.append("SourceImageIds", id));
  (payload.newImageFiles ?? []).forEach((file) => form.append("NewImages", file));
  return form;
}

export interface GetModel3DQueueParams {
  status?: Model3DRequestStatus;
  reason?: Model3DFailureReason;
  skip?: number;
  take?: number;
}

/**
 * Hàng chờ Regenerate cho staff sàn (Staff/Manager/Admin) — /api/model3d-requests. Request Initial
 * (tự động) KHÔNG xử lý được qua đây (generate/retry trả 400 nếu gọi nhầm loại) — chỉ hiện để
 * theo dõi (vd status=Queued&reason=InsufficientCredits = đang kẹt vì hết credit Meshy).
 */
export const model3DQueueApi = {
  getQueue: (params?: GetModel3DQueueParams) => {
    return fetchHttpClient.get<ApiResponse<Model3DRequestQueueResponse>>("/model3d-requests", params);
  },

  /** Chọn ảnh (tick có sẵn + upload mới, 1–4 ảnh) rồi gửi task Meshy lần đầu cho request Regenerate. */
  generate: (requestId: string, payload: RequestModel3DPayload) => {
    return fetchHttpClient.post<ApiResponse<Model3DRequestQueueItem>>(
      `/model3d-requests/${requestId}/generate`,
      buildRequestFormData(payload),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },

  /** Chưa ưng ý kết quả trước — chọn lại ảnh, gửi lại Meshy. Không giới hạn số lần. */
  retry: (requestId: string, payload: RequestModel3DPayload) => {
    return fetchHttpClient.post<ApiResponse<Model3DRequestQueueItem>>(
      `/model3d-requests/${requestId}/retry`,
      buildRequestFormData(payload),
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
