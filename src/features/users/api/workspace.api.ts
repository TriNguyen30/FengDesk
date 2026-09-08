import fetchHttpClient from "@/lib/httpClient";
import {
  Workspace,
  WorkspaceType,
  Style,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  WorkspaceElementAnalysis,
  ElementInputVocabulary,
  ClassifyElementInputResult,
  WorkspaceProfileInputDto,
  PurchasedItem,
} from "../types/workspace";
import type { ApiResponse } from "@/types/api";
import { normalizeImageForUpload } from "@/utils/imageResize";
import { AI_REQUEST_TIMEOUT_MS } from "@/config/axios.config";

export const getWorkspaces = async (): Promise<Workspace[]> => {
  const response = await fetchHttpClient.get<ApiResponse<Workspace[]>>("/workspace");
  return response.data.data;
};

export const getWorkspaceById = async (id: string): Promise<Workspace> => {
  const response = await fetchHttpClient.get<ApiResponse<Workspace>>(`/workspace/${id}`);
  return response.data.data;
};

export const getWorkspaceTypes = async () => {
  const response = await fetchHttpClient.get<ApiResponse<WorkspaceType[]>>("/workspace-types");
  return response.data.data;
};

export const getStyles = async (): Promise<Style[]> => {
  const response = await fetchHttpClient.get<ApiResponse<Style[]>>("/styles");
  return response.data.data;
};

export const createWorkspace = async (data: CreateWorkspaceDto): Promise<Workspace> => {
  const response = await fetchHttpClient.post<ApiResponse<Workspace>>("/workspace", data);
  return response.data.data;
};

export const updateWorkspace = async (id: string, data: UpdateWorkspaceDto): Promise<Workspace> => {
  const response = await fetchHttpClient.put<ApiResponse<Workspace>>(`/workspace/${id}`, data);
  return response.data.data;
};

export const deleteWorkspace = async (id: string): Promise<void> => {
  await fetchHttpClient.delete(`/workspace/${id}`);
};

export const setDefaultWorkspace = async (id: string): Promise<Workspace> => {
  const response = await fetchHttpClient.patch<ApiResponse<Workspace>>(
    `/workspace/${id}/set-default`,
  );
  return response.data.data;
};

export const getWorkspaceElementAnalysis = async (
  id: string,
): Promise<WorkspaceElementAnalysis> => {
  const response = await fetchHttpClient.get<ApiResponse<WorkspaceElementAnalysis>>(
    `/workspace/${id}/element-analysis`,
  );
  return response.data.data;
};

// ===== Đặt sản phẩm đã mua vào workspace (radar tính lúc đọc ở BE) =====

/** Sản phẩm đã mua đủ điều kiện đặt phòng + đang đặt ở đâu. */
export const getPurchasedItems = async (): Promise<PurchasedItem[]> => {
  const response = await fetchHttpClient.get<ApiResponse<PurchasedItem[]>>(
    "/workspace/placements/purchasable",
  );
  return response.data.data;
};

/** Đặt (hoặc chuyển từ phòng khác) 1 order item vào workspace. */
export const placeProduct = async (workspaceId: string, orderItemId: string) => {
  const response = await fetchHttpClient.put<ApiResponse<null>>(
    `/workspace/${workspaceId}/placements`,
    { orderItemId },
  );
  return response.data;
};

/** Gỡ 1 order item khỏi workspace. */
export const removePlacement = async (workspaceId: string, orderItemId: string) => {
  const response = await fetchHttpClient.delete<ApiResponse<null>>(
    `/workspace/${workspaceId}/placements/${orderItemId}`,
  );
  return response.data;
};

export const getElementInputVocabulary = async (): Promise<ElementInputVocabulary> => {
  const response = await fetchHttpClient.get<ApiResponse<ElementInputVocabulary>>(
    "/workspace/element-inputs",
  );
  return response.data.data;
};

/** User gõ tên 1 tag mới (chưa có sẵn) → AI phân loại hành + weight, lưu luôn vào vocabulary dùng chung. */
export const classifyElementInput = async (
  kind: WorkspaceProfileInputDto["inputKind"],
  label: string,
): Promise<ClassifyElementInputResult> => {
  const response = await fetchHttpClient.post<ApiResponse<ClassifyElementInputResult>>(
    "/workspace/element-inputs/classify",
    { kind, label },
    // Chờ model phân loại xong — không phải độ trễ mạng.
    { timeout: AI_REQUEST_TIMEOUT_MS },
  );
  return response.data.data;
};

/**
 * Tải ảnh không gian lên storage → trả link để đính kèm parse-description. signal để hủy giữa chừng.
 * Ảnh được CHUẨN HOÁ trước khi gửi (xem utils/imageResize) — ảnh gốc từ điện thoại làm chậm cả chuỗi
 * upload → tải về → base64 → vision model, trong khi model không cần độ phân giải đó; .webp thì
 * backend không đọc được nên đổi sang JPEG luôn ở đây.
 */
export const uploadWorkspaceImage = async (file: File, signal?: AbortSignal): Promise<string> => {
  const optimized = await normalizeImageForUpload(file);
  const formData = new FormData();
  formData.append("file", optimized);
  const response = await fetchHttpClient.post<ApiResponse<string>>("/workspace/images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    // Ảnh đã thu nhỏ nhưng mạng yếu vẫn có thể lâu — cùng ngưỡng với các bước AI để user
    // không mất ảnh đúng lúc sắp xong.
    timeout: AI_REQUEST_TIMEOUT_MS,
    signal,
  });
  return response.data.data;
};
