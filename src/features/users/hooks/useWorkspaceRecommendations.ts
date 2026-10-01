import { useWorkspaceRecommendationPreview } from "@/features/recommendation/hooks/useProductFit";

/** Lưới ở nội dung chính rộng hơn sidebar cũ nên lấy nhiều món hơn (sidebar lấy 8). */
const TOP_N = 12;

/**
 * - `loading`: đang tải → giữ bố cục có lưới (skeleton) để không nhảy bố cục khi dữ liệu về.
 * - `ready`: có ít nhất 1 món.
 * - `empty`: 422 / lỗi / danh sách rỗng → trang thu lưới thành dải thông báo, radar về bố cục cũ.
 */
export type WorkspaceRecommendationsState = "loading" | "ready" | "empty";

/** Đề xuất của một phòng + trạng thái để trang chọn bố cục. Cùng queryKey mọi nơi → react-query dedupe. */
export function useWorkspaceRecommendations(workspaceId: string) {
  const { preview, status, error } = useWorkspaceRecommendationPreview(workspaceId, TOP_N);
  const items = preview?.items ?? [];
  const state: WorkspaceRecommendationsState =
    status === "pending" ? "loading" : items.length > 0 ? "ready" : "empty";

  return { items, note: preview?.note ?? null, error, state };
}

export type WorkspaceRecommendations = ReturnType<typeof useWorkspaceRecommendations>;
