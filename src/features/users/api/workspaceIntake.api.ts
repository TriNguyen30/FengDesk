import fetchHttpClient from "@/lib/httpClient";
import type { ApiResponse } from "@/types/api";
import type { WorkspaceProfileDraft } from "../types/workspace";

/** Bắt đầu 1 job intake async — trả operationId ngay (không chờ LLM). FE nghe realtime + poll fallback. */
export interface WorkspaceIntakeStart {
  operationId: string;
}

/** Trạng thái/kết quả 1 job intake (fallback khi lỡ event realtime / F5). */
export interface WorkspaceIntakeJobStatus {
  status: "pending" | "done" | "failed";
  draft?: WorkspaceProfileDraft | null;
  message?: string | null;
}

/** Đẩy mô tả (+ảnh) vào hàng đợi AI nền → operationId để theo dõi realtime.
 *  think: user bật "suy nghĩ kỹ" (chậm hơn nhiều). undefined = theo mặc định server. */
export const startParseWorkspace = async (
  description: string,
  imageUrls?: string[],
  think?: boolean,
): Promise<WorkspaceIntakeStart> => {
  const response = await fetchHttpClient.post<ApiResponse<WorkspaceIntakeStart>>(
    "/workspace/parse-description",
    { description, imageUrls, think },
  );
  return response.data.data;
};

/** Poll trạng thái job theo operationId (fallback: F5, mất kết nối, hoặc SignalR rớt event). */
export const getWorkspaceIntakeStatus = async (
  operationId: string,
): Promise<WorkspaceIntakeJobStatus> => {
  const response = await fetchHttpClient.get<ApiResponse<WorkspaceIntakeJobStatus>>(
    `/workspace/parse-description/${operationId}`,
  );
  return response.data.data;
};
