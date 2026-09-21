import { useQuery, useQueries } from "@tanstack/react-query";
import {
  getPersonalFit,
  getProductFit,
  getProductOccupationFit,
  getWorkspaceRecommendationPreview,
} from "../api/recommendation.api";

export function useProductFit(productId?: string, workspaceProfileId?: string) {
  const query = useQuery({
    queryKey: ["product-fit", productId, workspaceProfileId],
    queryFn: () => {
      if (!productId || !workspaceProfileId)
        throw new Error("Missing productId/workspaceProfileId");
      return getProductFit(productId, workspaceProfileId);
    },
    enabled: !!productId && !!workspaceProfileId,
  });

  return { fit: query.data ?? null, status: query.status, query };
}

/** Chấm 1 sản phẩm × MỌI workspace của user song song — cho % trên từng tab của SpaceTabs. */
export function useProductFitAcrossWorkspaces(
  productId: string | undefined,
  workspaceIds: string[],
) {
  const results = useQueries({
    queries: workspaceIds.map((workspaceProfileId) => ({
      queryKey: ["product-fit", productId, workspaceProfileId],
      queryFn: () => getProductFit(productId!, workspaceProfileId),
      enabled: !!productId,
    })),
  });

  const byWorkspaceId = new Map(
    workspaceIds.map((id, i) => [id, { fit: results[i].data ?? null, status: results[i].status }]),
  );

  return { byWorkspaceId };
}

/**
 * Chấm 1 sản phẩm theo bản mệnh user (vật mang theo người).
 *
 * Không retry: lỗi hay gặp nhất ở đây là `422 thiếu ngày sinh` — thử lại không bao giờ đổi kết quả,
 * chỉ làm user chờ lâu hơn trước khi thấy lời mời khai ngày sinh.
 */
export function usePersonalFit(productId?: string) {
  const query = useQuery({
    queryKey: ["personal-fit", productId],
    queryFn: () => {
      if (!productId) throw new Error("Missing productId");
      return getPersonalFit(productId);
    },
    enabled: !!productId,
    retry: false,
  });

  return { fit: query.data ?? null, status: query.status, error: query.error };
}

/** "Sản phẩm này hợp nghề nào" — public, cache theo sản phẩm; hồ sơ nghề đổi rất hiếm nên staleTime dài. */
export function useProductOccupationFit(productId?: string) {
  const query = useQuery({
    queryKey: ["product-occupation-fit", productId],
    queryFn: () => {
      if (!productId) throw new Error("Missing productId");
      return getProductOccupationFit(productId);
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });

  return { data: query.data ?? null, status: query.status };
}

/**
 * Sản phẩm đề xuất cho một workspace (engine-only). Key nằm dưới `["workspace", id]` để mọi chỗ đang
 * `invalidateQueries(["workspace"])` (đặt/gỡ sản phẩm, sửa phòng) kéo danh sách này tính lại theo.
 *
 * Không retry: 422 "chưa có sản phẩm nào gắn thuộc tính" là trạng thái dữ liệu, thử lại không đổi gì.
 */
export function useWorkspaceRecommendationPreview(workspaceId?: string, topN = 8) {
  const query = useQuery({
    queryKey: ["workspace", workspaceId, "recommendation-preview", topN],
    queryFn: () => {
      if (!workspaceId) throw new Error("Missing workspaceId");
      return getWorkspaceRecommendationPreview(workspaceId, topN);
    },
    enabled: !!workspaceId,
    retry: false,
    staleTime: 60 * 1000,
  });
  return { preview: query.data ?? null, status: query.status, error: query.error };
}

