import { useQuery, useQueries } from "@tanstack/react-query";
import { getProductFit } from "../api/recommendation.api";

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
