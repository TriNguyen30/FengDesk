import { useQuery, useQueries } from "@tanstack/react-query";
import { getPersonalFit, getProductFit } from "../api/recommendation.api";

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
